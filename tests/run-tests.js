/* Student OS BD — Node unit tests for all pure logic. Run: node tests/run-tests.js */
'use strict';
const assert = require('assert');
const path = require('path');
const J = p => require(path.join(__dirname, '..', 'js', p));

const planner = J('planner.js');
const flash = J('flashcards.js');
const timer = J('timer.js');
const cd = J('countdowns.js');
const store = J('store.js');
const i18n = J('i18n.js');

let pass = 0, fail = 0;
const cases = [];
function test(name, fn) {
  try { fn(); pass++; /* console.log('ok -', name); */ }
  catch (e) { fail++; cases.push(name + ' :: ' + e.message); console.log('FAIL -', name, '::', e.message); }
}
const approx = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `expected ${b}, got ${a}`);

/* ================= PLANNER ================= */
const subj = passes => ({ topics: passes.map((p, i) => ({ name: 't' + i, minutes: 30, passes: p })) });

test('readiness: 4 topics x 2/3 passes = 66.666...%', () => {
  approx(planner.subjectReadiness(subj([2, 2, 2, 2])), 66.66666666666667);
});
test('readiness: [3,1,0] = 44.444...%', () => {
  approx(planner.subjectReadiness(subj([3, 1, 0])), 44.44444444444444);
});
test('readiness: all done = 100%', () => {
  assert.strictEqual(planner.subjectReadiness(subj([3, 3])), 100);
});
test('readiness: none started = 0%', () => {
  assert.strictEqual(planner.subjectReadiness(subj([0, 0, 0])), 0);
});
test('readiness: no topics = 0%', () => {
  assert.strictEqual(planner.subjectReadiness({ topics: [] }), 0);
});
test('readiness: passes clamped to 0..3', () => {
  approx(planner.subjectReadiness(subj([9, -2])), 50); // (3+0)/6
});
test('overallReadiness: two subjects', () => {
  const state = { subjects: [subj([3, 3]), subj([0, 0])] };
  approx(store && planner.overallReadiness(state), 50);
});
test('overallReadiness: empty state = 0', () => {
  assert.strictEqual(planner.overallReadiness({ subjects: [] }), 0);
});
test('daysUntil exact', () => {
  assert.strictEqual(planner.daysUntil('2026-10-20', '2026-10-12'), 8);
  assert.strictEqual(planner.daysUntil('2026-10-12', '2026-10-12'), 0);
  assert.strictEqual(planner.daysUntil('2026-10-10', '2026-10-12'), -2);
});
test('examState buckets', () => {
  assert.strictEqual(planner.examState('2026-10-12', '2026-10-12'), 'today');
  assert.strictEqual(planner.examState('2026-10-13', '2026-10-12'), 'tomorrow');
  assert.strictEqual(planner.examState('2026-10-19', '2026-10-12'), 'week');
  assert.strictEqual(planner.examState('2026-11-30', '2026-10-12'), 'plenty');
  assert.strictEqual(planner.examState('2026-10-01', '2026-10-12'), 'passed');
  assert.strictEqual(planner.examState(null, '2026-10-12'), 'none');
});
test('todaysFocus: nearest exam + least-done topic', () => {
  const state = { subjects: [
    { name: 'Far', examDate: '2026-11-01', topics: [{ name: 'a', passes: 3 }] },
    { name: 'Near', examDate: '2026-10-15', topics: [{ name: 'x', passes: 2 }, { name: 'y', passes: 0 }] },
    { name: 'NoDate', examDate: null, topics: [{ name: 'z', passes: 0 }] },
  ]};
  const f = planner.todaysFocus(state, '2026-10-12');
  assert.strictEqual(f.subject.name, 'Near');
  assert.strictEqual(f.topic.name, 'y');
});
test('todaysFocus: passed exams sink below undated', () => {
  const state = { subjects: [
    { name: 'Old', examDate: '2026-01-01', topics: [{ name: 'a', passes: 0 }] },
    { name: 'NoDate', examDate: null, topics: [{ name: 'z', passes: 0 }] },
  ]};
  assert.strictEqual(planner.todaysFocus(state, '2026-10-12').subject.name, 'NoDate');
});
test('todaysFocus: null when no topics anywhere', () => {
  assert.strictEqual(planner.todaysFocus({ subjects: [{ name: 'S', topics: [] }] }, '2026-10-12'), null);
  assert.strictEqual(planner.todaysFocus({ subjects: [] }, '2026-10-12'), null);
});
test('cyclePasses: click filled dot clears to that level', () => {
  assert.strictEqual(planner.cyclePasses({ passes: 1 }, 0), 0);
  assert.strictEqual(planner.cyclePasses({ passes: 3 }, 2), 2);
  assert.strictEqual(planner.cyclePasses({ passes: 1 }, 1), 2);
  assert.strictEqual(planner.cyclePasses({ passes: 0 }, 2), 3);
});

/* ================= FLASHCARDS (SM-2-lite) ================= */
const NOW = Date.parse('2026-10-12T12:00:00Z');

test('newCard defaults', () => {
  const c = flash.newCard('f', 'b', NOW);
  assert.strictEqual(c.ease, 2.5); assert.strictEqual(c.interval, 0);
  assert.strictEqual(c.reps, 0); assert.strictEqual(c.due, NOW);
});
test('SM-2: 1st Good -> interval 1 day, ease unchanged 2.5, +5 XP', () => {
  const c = flash.newCard('f', 'b', NOW);
  const r = flash.review(c, 4, NOW);
  assert.strictEqual(c.reps, 1); assert.strictEqual(c.interval, 1);
  assert.strictEqual(c.due, NOW + 86400000);
  approx(c.ease, 2.5);
  assert.strictEqual(r.xp, 5);
});
test('SM-2: 2nd Good -> interval 6 days', () => {
  const c = flash.newCard('f', 'b', NOW);
  flash.review(c, 4, NOW);
  flash.review(c, 4, NOW + 86400000);
  assert.strictEqual(c.reps, 2); assert.strictEqual(c.interval, 6);
});
test('SM-2: 3rd Good -> interval round(6 * 2.5) = 15 days', () => {
  const c = flash.newCard('f', 'b', NOW);
  flash.review(c, 4, NOW);
  flash.review(c, 4, NOW + 86400000);
  flash.review(c, 4, NOW + 7 * 86400000);
  assert.strictEqual(c.interval, 15);
});
test('SM-2: Easy bumps ease by 0.1, +6 XP', () => {
  const c = flash.newCard('f', 'b', NOW);
  const r = flash.review(c, 5, NOW);
  approx(c.ease, 2.6); assert.strictEqual(r.xp, 6);
});
test('SM-2: Hard drops ease by 0.14, +3 XP', () => {
  const c = flash.newCard('f', 'b', NOW);
  const r = flash.review(c, 3, NOW);
  approx(c.ease, 2.36); assert.strictEqual(r.xp, 3);
});
test('SM-2: Again resets reps, interval 1, ease -0.2, lapses 1, +2 XP', () => {
  const c = flash.newCard('f', 'b', NOW);
  flash.review(c, 4, NOW); flash.review(c, 4, NOW + 86400000);
  const r = flash.review(c, 1, NOW + 2 * 86400000);
  assert.strictEqual(c.reps, 0); assert.strictEqual(c.interval, 1);
  assert.strictEqual(c.lapses, 1); approx(c.ease, 2.3);
  assert.strictEqual(r.xp, 2);
});
test('SM-2: ease never drops below 1.3', () => {
  const c = flash.newCard('f', 'b', NOW);
  for (let i = 0; i < 20; i++) flash.review(c, 1, NOW + i * 86400000);
  assert.ok(c.ease >= 1.3, 'ease=' + c.ease);
});
test('dueCards filters by due timestamp', () => {
  const decks = [{ cards: [
    { id: 'a', due: NOW - 1 }, { id: 'b', due: NOW + 999999 },
  ]}];
  const due = flash.dueCards(decks, NOW);
  assert.strictEqual(due.length, 1); assert.strictEqual(due[0].card.id, 'a');
});
test('deckStats counts', () => {
  const d = { cards: [
    { due: NOW - 1, reps: 2, interval: 6 },
    { due: NOW + 1, reps: 0, interval: 0 },
    { due: NOW - 5, reps: 0, interval: 1 },
  ]};
  const st = flash.deckStats(d, NOW);
  assert.deepStrictEqual(st, { total: 3, due: 2, fresh: 1 });
});

/* ================= POMODORO STATE MACHINE ================= */
const T0 = 1_700_000_000_000;
const tm = () => timer.createTimer({ focus: 25, short: 5, long: 15, cycle: 4 });

test('timer: start -> focus, ends in 25 min', () => {
  const t = tm();
  timer.start(t, T0);
  assert.strictEqual(t.phase, 'focus');
  assert.strictEqual(t.endAt, T0 + 25 * 60000);
});
test('timer: completing focus -> short break event', () => {
  const t = tm();
  timer.start(t, T0);
  const ev = timer.tick(t, T0 + 25 * 60000);
  assert.strictEqual(ev.length, 1);
  assert.strictEqual(ev[0].type, 'phaseComplete');
  assert.strictEqual(ev[0].phase, 'focus');
  assert.strictEqual(ev[0].minutes, 25);
  assert.strictEqual(t.phase, 'short');
  assert.strictEqual(t.completedFocus, 1);
});
test('timer: 4th focus -> long break', () => {
  const t = tm();
  timer.start(t, T0);
  let now = T0;
  for (let i = 1; i <= 4; i++) {
    const ev = timer.tick(t, t.endAt); // finish focus
    assert.strictEqual(ev[0].phase, 'focus');
    now = t.endAt;
    if (i < 4) {
      assert.strictEqual(t.phase, 'short', 'after focus ' + i);
      timer.tick(t, t.endAt); // finish short break -> back to focus
      assert.strictEqual(t.phase, 'focus');
    }
  }
  assert.strictEqual(t.phase, 'long');
  assert.strictEqual(timer.phaseLen(t, 'long'), 15 * 60000);
});
test('timer: pause freezes remaining, resume restores', () => {
  const t = tm();
  timer.start(t, T0);
  timer.pause(t, T0 + 60_000);
  assert.strictEqual(t.phase, 'paused');
  assert.strictEqual(timer.remaining(t, T0 + 999_999_000), 24 * 60000);
  timer.resume(t, T0 + 120_000);
  assert.strictEqual(t.phase, 'focus');
  assert.strictEqual(t.endAt, T0 + 120_000 + 24 * 60000);
});
test('timer: skip completes phase immediately', () => {
  const t = tm();
  timer.start(t, T0);
  const ev = timer.skip(t, T0 + 60_000);
  assert.strictEqual(ev[0].phase, 'focus');
  assert.strictEqual(t.phase, 'short');
});
test('timer: reset -> idle', () => {
  const t = tm();
  timer.start(t, T0);
  timer.reset(t);
  assert.strictEqual(t.phase, 'idle');
  assert.strictEqual(timer.remaining(t, T0), 25 * 60000);
});
test('timer: tick while idle is a no-op', () => {
  const t = tm();
  assert.deepStrictEqual(timer.tick(t, T0 + 99999999), []);
});
test('timer: fmtClock', () => {
  assert.strictEqual(timer.fmtClock(25 * 60000), '25:00');
  assert.strictEqual(timer.fmtClock(61000), '01:01');
  assert.strictEqual(timer.fmtClock(0), '00:00');
});
test('timer: tick overshoot chains phases', () => {
  const t = tm();
  timer.start(t, T0);
  const ev = timer.tick(t, T0 + 25 * 60000 + 5 * 60000); // focus + short
  assert.strictEqual(ev.length, 2);
  assert.strictEqual(t.phase, 'focus');
  assert.strictEqual(t.completedFocus, 1);
});

/* ================= COUNTDOWNS ================= */
test('countdown parts exact', () => {
  const at = NOW + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;
  assert.deepStrictEqual(cd.parts(at, NOW), { past: false, days: 2, hours: 3, mins: 4, secs: 5 });
});
test('countdown past', () => {
  const p = cd.parts(NOW - 1000, NOW);
  assert.strictEqual(p.past, true);
});

/* ================= STORE: XP / STREAK / IMPORT ================= */
test('levelFor thresholds: 0->L1, 99->L1, 100->L2, 250->L3', () => {
  assert.deepStrictEqual(store.levelFor(0), { level: 1, into: 0, need: 100 });
  assert.strictEqual(store.levelFor(99).level, 1);
  assert.deepStrictEqual(store.levelFor(100), { level: 2, into: 0, need: 100 });
  assert.deepStrictEqual(store.levelFor(250), { level: 3, into: 50, need: 100 });
});
test('addXP level-up detection', () => {
  const s = { xp: 95 };
  const r = store.addXP(s, 10);
  assert.strictEqual(s.xp, 105);
  assert.strictEqual(r.leveledUp, true);
  assert.strictEqual(r.level, 2);
  const r2 = store.addXP(s, 3);
  assert.strictEqual(r2.leveledUp, false);
});
test('streak: consecutive days', () => {
  const s = store.defaultState();
  store.touchActivity(s, NOW);
  store.touchActivity(s, NOW - 86400000);
  assert.strictEqual(store.streak(s, NOW), 2);
});
test('streak: gap breaks the run', () => {
  const s = store.defaultState();
  store.touchActivity(s, NOW);
  store.touchActivity(s, NOW - 3 * 86400000);
  assert.strictEqual(store.streak(s, NOW), 1);
});
test('streak: yesterday-only counts (today not yet active)', () => {
  const s = store.defaultState();
  store.touchActivity(s, NOW - 86400000);
  store.touchActivity(s, NOW - 2 * 86400000);
  assert.strictEqual(store.streak(s, NOW), 2);
});
test('export/import round-trip', () => {
  const s = store.defaultState();
  s.xp = 42; s.subjects.push({ id: 'x', name: 'S' });
  const v = store.validateImport(store.exportJSON(s));
  assert.ok(!v.error, v.error);
  assert.strictEqual(v.state.xp, 42);
  assert.strictEqual(v.state.subjects[0].name, 'S');
});
test('validateImport rejects garbage', () => {
  assert.strictEqual(store.validateImport('not json').error, 'parse');
  assert.strictEqual(store.validateImport('{"app":"other"}').error, 'shape');
  assert.strictEqual(store.validateImport(JSON.stringify({ app: 'student-os-bd', v: 1, state: { v: 1, xp: 0 } })).error, 'shape');
});
test('save/load round-trip with fake storage', () => {
  const mem = { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; } };
  const s = store.defaultState(); s.lang = 'bn'; s.xp = 7;
  store.save(mem, s);
  const back = store.load(mem);
  assert.strictEqual(back.lang, 'bn'); assert.strictEqual(back.xp, 7);
});
test('load returns defaults on corrupt data', () => {
  const mem = { getItem: () => '{oops', setItem() {} };
  assert.strictEqual(store.load(mem).xp, 0);
});

/* ================= I18N ================= */
test('i18n EN default', () => {
  i18n.setLang('en');
  assert.strictEqual(i18n.t('nav_dashboard'), 'Dashboard');
});
test('i18n BN translations', () => {
  i18n.setLang('bn');
  assert.strictEqual(i18n.t('nav_dashboard'), 'ড্যাশবোর্ড');
  assert.strictEqual(i18n.t('start'), 'শুরু');
});
test('i18n Bengali digits', () => {
  i18n.setLang('bn');
  assert.strictEqual(i18n.n(123), '১২৩');
  assert.strictEqual(i18n.n('25:00'), '২৫:০০');
  i18n.setLang('en');
  assert.strictEqual(i18n.n(123), '123');
});
test('i18n fmtDate localized', () => {
  i18n.setLang('en');
  assert.strictEqual(i18n.fmtDate('2026-10-12'), '12 Oct 2026');
  i18n.setLang('bn');
  assert.strictEqual(i18n.fmtDate('2026-10-12'), '১২ অক্টো ২০২৬');
  i18n.setLang('en');
});
test('i18n missing key falls back to key', () => {
  i18n.setLang('en');
  assert.strictEqual(i18n.t('no_such_key_xyz'), 'no_such_key_xyz');
});
test('i18n fill replaces vars', () => {
  assert.strictEqual(i18n.fill('a {n} b', { n: 5 }), 'a 5 b');
});

console.log(`\n${pass} passed, ${fail} failed`);
if (cases.length) { console.log('failures:'); cases.forEach(c => console.log(' -', c)); }
process.exit(fail ? 1 : 0);
