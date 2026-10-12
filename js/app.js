/* Student OS BD — app.js: UI wiring. Requires i18n, store, planner, flashcards, timer, countdowns loaded first. */
'use strict';
(function () {
  const SOS = window.SOS;
  const L = SOS.i18n, S = SOS.store, P = SOS.planner, F = SOS.flash, T = SOS.timer, C = SOS.countdowns;
  const t = L.t.bind(L);

  let state = S.load(localStorage);
  L.setLang(state.lang || 'en');

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function persist() { S.save(localStorage, state); }

  /* ---------------- i18n ---------------- */
  function applyStaticI18n() {
    document.documentElement.lang = L.getLang() === 'bn' ? 'bn' : 'en';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    $('#lang-toggle').textContent = L.getLang() === 'bn' ? 'EN' : 'বাং';
  }

  /* ---------------- toast / modal ---------------- */
  function toast(msg) {
    let root = $('#toast-root');
    if (!root) { root = document.createElement('div'); root.id = 'toast-root'; document.body.appendChild(root); }
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function modal(title, bodyHTML, onOk, okLabel) {
    const root = $('#modal-root');
    root.innerHTML =
      '<div class="modal-back"><div class="modal" role="dialog" aria-label="' + esc(title) + '">' +
      '<h3>' + esc(title) + '</h3><div class="modal-body">' + bodyHTML + '</div>' +
      '<div class="btn-row"><button class="btn ghost" id="m-cancel">' + esc(t('cancel')) + '</button>' +
      '<button class="btn primary" id="m-ok">' + esc(okLabel || t('save')) + '</button></div></div></div>';
    const close = () => { root.innerHTML = ''; };
    $('#m-cancel').addEventListener('click', close);
    root.querySelector('.modal-back').addEventListener('click', e => { if (e.target.classList.contains('modal-back')) close(); });
    $('#m-ok').addEventListener('click', () => { if (onOk() !== false) close(); });
    const first = root.querySelector('input, textarea');
    if (first) first.focus();
    return close;
  }
  function field(label, inner) {
    return '<label class="field">' + esc(label) + inner + '</label>';
  }
  function textField(id, label, value, type) {
    return field(label, '<input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(value || '') + '">');
  }

  /* ---------------- XP ---------------- */
  function gainXP(amount, silent) {
    const r = S.addXP(state, amount);
    S.touchActivity(state, S.asOfNow());
    persist(); updateXpChip();
    if (!silent) toast(L.fill(t('xp_gained'), { n: L.n(amount) }));
    if (r.leveledUp) toast(L.fill(t('level_up'), { n: L.n(r.level) }));
    return r;
  }
  function updateXpChip() {
    const lv = S.levelFor(state.xp);
    $('#xp-text').textContent = L.n(state.xp) + ' XP · L' + L.n(lv.level);
    $('#xp-chip').title = 'Level ' + lv.level + ' — ' + lv.into + '/' + lv.need + ' XP to next';
  }

  /* ---------------- tabs ---------------- */
  let currentTab = 'dashboard';
  function showTab(name) {
    currentTab = name;
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('#view .panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + name));
    render();
    window.scrollTo(0, 0);
  }
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (b) showTab(b.dataset.tab);
  });

  /* ---------------- DASHBOARD ---------------- */
  function pillFor(st) {
    if (st === 'today') return '<span class="pill bad">' + esc(t('st_today')) + '</span>';
    if (st === 'tomorrow') return '<span class="pill warn">' + esc(t('st_tomorrow')) + '</span>';
    if (st === 'week') return '<span class="pill warn">' + esc(t('st_week')) + '</span>';
    if (st === 'passed') return '<span class="pill muted">' + esc(t('st_passed')) + '</span>';
    return '<span class="pill info">' + esc(t('st_plenty')) + '</span>';
  }

  function renderDashboard() {
    const asof = S.asOfToday(), now = S.asOfNow();
    const readiness = P.overallReadiness(state);
    const due = F.dueCards(state.decks, now).length;
    const todayStr = S.dayStr(now);
    let focusMin = 0, sessionsToday = 0;
    for (const s of state.focusSessions) {
      if (s.kind !== 'focus') continue;
      if (S.dayStr(s.startedAt) === todayStr) { focusMin += s.minutes; sessionsToday++; }
    }
    const streakN = S.streak(state, now);

    const cards = [
      { label: t('dash_readiness'), big: L.n(readiness.toFixed(1)) + '%', sub: '<div class="progress"><i style="width:' + readiness.toFixed(1) + '%"></i></div>' },
      { label: t('dash_due'), big: L.n(due), sub: '<div class="stat-label">' + (due ? esc(t('dash_review_now')) : esc(t('dash_due_none'))) + '</div>' },
      { label: t('dash_focus_today'), big: L.n(focusMin) + 'm', sub: '<div class="stat-label">' + L.n(sessionsToday) + ' ' + esc(t('sessions')) + '</div>' },
      { label: t('dash_streak'), big: '🔥 ' + L.n(streakN), sub: '<div class="stat-label">' + esc(t('days')) + '</div>' },
    ];
    $('#dash-cards').innerHTML = cards.map(c =>
      '<div class="card"><div class="stat-big">' + c.big + '</div><div class="stat-label">' + esc(c.label) + '</div>' + c.sub + '</div>'
    ).join('');

    // upcoming exams
    const upcoming = state.subjects
      .filter(s => s.examDate && P.daysUntil(s.examDate, asof) >= 0)
      .sort((a, b) => a.examDate < b.examDate ? -1 : 1)
      .slice(0, 5);
    let examHTML;
    if (!upcoming.length) {
      examHTML = '<p class="muted">' + esc(t('dash_no_exams')) + '</p>';
    } else {
      examHTML = '<h3>' + esc(t('dash_upcoming')) + '</h3>' + upcoming.map(s => {
        const d = P.daysUntil(s.examDate, asof), st = P.examState(s.examDate, asof);
        const r = P.subjectReadiness(s);
        return '<div class="kv"><span>' + esc(s.name) + ' <span class="muted small">' + esc(fmtDate(s.examDate)) + ' · ' + L.n(r.toFixed(0)) + '%</span></span>' +
          '<span>' + pillFor(st) + ' <b>' + L.n(d) + ' ' + esc(d === 1 ? t('day') : t('days')) + '</b></span></div>';
      }).join('');
    }

    // today's focus pick
    const pick = P.todaysFocus(state, asof);
    let pickHTML;
    if (!pick) {
      pickHTML = '<p class="muted">' + esc(t('dash_no_focus')) + '</p>';
    } else {
      pickHTML = '<div class="kv"><span><b>' + esc(pick.subject.name) + '</b> → ' + esc(pick.topic.name) +
        ' <span class="muted small">(' + esc(t('readiness')) + ' ' + L.n(P.subjectReadiness(pick.subject).toFixed(0)) + '%)</span></span></div>' +
        '<div class="kv"><span>' + esc(t('mark_pass')) + '</span>' +
        '<button class="btn small primary" id="dash-mark-pass">✓ ' + esc(t('mark_pass')) + '</button></div>';
    }
    $('#dash-focus-pick').innerHTML = pickHTML + examHTML;
    const mp = $('#dash-mark-pass');
    if (mp && pick) mp.addEventListener('click', () => {
      pick.topic.passes = P.clampPasses(pick.topic.passes + 1);
      gainXP(4); render();
    });

    // study health
    let topics = 0, passesDone = 0;
    for (const s of state.subjects) for (const tp of (s.topics || [])) { topics++; passesDone += P.clampPasses(tp.passes); }
    $('#dash-health').innerHTML = state.subjects.length === 0
      ? '<p class="muted">' + esc(t('dash_no_subjects')) + '</p>'
      : '<div class="kv"><span>' + esc(t('h_subjects')) + '</span><b>' + L.n(state.subjects.length) + '</b></div>' +
        '<div class="kv"><span>' + esc(t('h_topics')) + '</span><b>' + L.n(topics) + '</b></div>' +
        '<div class="kv"><span>' + esc(t('h_passes_done')) + '</span><b>' + L.n(passesDone) + ' / ' + L.n(topics * 3) + '</b></div>' +
        '<div class="kv"><span>' + esc(t('h_overall')) + '</span><b>' + L.n(readiness.toFixed(1)) + '%</b></div>' +
        '<div class="progress"><i style="width:' + readiness.toFixed(1) + '%"></i></div>';
  }

  /* ---------------- PLANNER ---------------- */
  const SUBJECT_COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#db2777', '#0891b2'];

  function renderPlanner() {
    const asof = S.asOfToday();
    const list = $('#subject-list');
    $('#planner-empty').classList.toggle('hidden', state.subjects.length > 0);
    list.innerHTML = state.subjects.map((s, si) => {
      const r = P.subjectReadiness(s);
      const st = P.examState(s.examDate, asof);
      const d = s.examDate ? P.daysUntil(s.examDate, asof) : null;
      const dateLine = s.examDate
        ? '<span class="muted small">' + esc(fmtDate(s.examDate)) + ' · ' + (d >= 0 ? L.n(d) + ' ' + esc(d === 1 ? t('day') : t('days')) + ' ' + esc(t('left')) : esc(t('passed'))) + '</span> ' + pillFor(st)
        : '<span class="muted small">' + esc(t('no_exam_date')) + '</span>';
      const topics = (s.topics || []).map((tp, ti) => {
        const dots = [0, 1, 2].map(i =>
          '<button class="pass-dot' + (P.clampPasses(tp.passes) > i ? ' on' : '') + '" data-s="' + si + '" data-t="' + ti + '" data-dot="' + i + '" aria-label="pass ' + (i + 1) + '"></button>'
        ).join('');
        return '<div class="topic"><span class="topic-name">' + esc(tp.name) +
          ' <span class="muted small">' + L.n(tp.minutes || 0) + 'm</span></span>' +
          '<span class="passes" title="' + esc(t('pass_title')) + '">' + dots + '</span>' +
          '<button class="topic-del" data-s="' + si + '" data-t="' + ti + '" aria-label="delete">✕</button></div>';
      }).join('');
      return '<div class="card subject" data-subject="' + esc(s.id) + '">' +
        '<div class="subject-head"><span class="dot" style="background:' + esc(s.color) + '"></span>' +
        '<h3>' + esc(s.name) + '</h3>' + dateLine +
        '<div class="subject-actions"><button class="btn small" data-edit-sub="' + si + '">' + esc(t('edit')) + '</button>' +
        '<button class="btn small danger-text" data-del-sub="' + si + '">' + esc(t('delete')) + '</button></div></div>' +
        '<div class="kv"><span>' + esc(t('readiness')) + '</span><b>' + L.n(r.toFixed(1)) + '%</b></div>' +
        '<div class="progress"><i style="width:' + r.toFixed(1) + '%"></i></div>' +
        '<div class="topics">' + (topics || '<p class="muted small">' + esc(t('no_topics')) + '</p>') + '</div>' +
        '<div class="add-row"><input class="grow" data-topic-name="' + si + '" placeholder="' + esc(t('m_topic_name')) + '">' +
        '<input data-topic-min="' + si + '" type="number" min="1" max="9999" value="30" style="width:84px" aria-label="' + esc(t('m_minutes')) + '">' +
        '<button class="btn small primary" data-add-topic="' + si + '">' + esc(t('add_topic')) + '</button></div>' +
        '</div>';
    }).join('');

    // pass dots
    list.querySelectorAll('.pass-dot').forEach(b => b.addEventListener('click', () => {
      const tp = state.subjects[+b.dataset.s].topics[+b.dataset.t];
      const next = P.cyclePasses(tp, +b.dataset.dot);
      if (next > P.clampPasses(tp.passes)) gainXP(4, true); // XP only when advancing
      tp.passes = next;
      persist(); render();
    }));
    // topic delete
    list.querySelectorAll('.topic-del').forEach(b => b.addEventListener('click', () => {
      if (!confirm(t('confirm_del_topic'))) return;
      state.subjects[+b.dataset.s].topics.splice(+b.dataset.t, 1);
      persist(); render();
    }));
    // add topic
    list.querySelectorAll('[data-add-topic]').forEach(b => b.addEventListener('click', () => {
      const si = +b.dataset.addTopic;
      const nameEl = list.querySelector('[data-topic-name="' + si + '"]');
      const minEl = list.querySelector('[data-topic-min="' + si + '"]');
      const name = nameEl.value.trim();
      if (!name) { toast(t('empty_name')); return; }
      const minutes = Math.max(1, Math.min(9999, parseInt(minEl.value, 10) || 30));
      state.subjects[si].topics.push({ id: S.uid(), name, minutes, passes: 0 });
      persist(); render();
    }));
    // edit / delete subject
    list.querySelectorAll('[data-edit-sub]').forEach(b => b.addEventListener('click', () => editSubject(+b.dataset.editSub)));
    list.querySelectorAll('[data-del-sub]').forEach(b => b.addEventListener('click', () => {
      if (!confirm(t('confirm_del_subject'))) return;
      state.subjects.splice(+b.dataset.delSub, 1);
      persist(); render();
    }));
  }

  function editSubject(si) {
    const isNew = si === -1;
    const s = isNew ? { name: '', color: SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length], examDate: '' } : state.subjects[si];
    modal(isNew ? t('new_subject') : t('edit_subject'),
      textField('f-name', t('m_subject_name'), s.name) +
      field(t('m_exam_date'), '<input id="f-date" type="date" value="' + esc(s.examDate || '') + '">') +
      field('🎨', '<input id="f-color" type="color" value="' + esc(s.color || '#2563eb') + '" style="height:40px;padding:2px">'),
      () => {
        const name = $('#f-name').value.trim();
        if (!name) { toast(t('empty_name')); return false; }
        const dup = state.subjects.some((x, i) => i !== si && x.name.toLowerCase() === name.toLowerCase());
        if (dup) { toast(t('dup_name')); return false; }
        const date = $('#f-date').value || null;
        if (date && P.daysUntil(date, S.asOfToday()) > 365 * 5) { if (!confirm(t('bad_date'))) return false; }
        if (isNew) {
          state.subjects.push({ id: S.uid(), name, color: $('#f-color').value, examDate: date, topics: [] });
          gainXP(2, true);
        } else {
          s.name = name; s.color = $('#f-color').value; s.examDate = date;
        }
        persist(); render();
      }, isNew ? t('add') : t('save'));
  }
  $('#btn-add-subject').addEventListener('click', () => editSubject(-1));

  /* ---------------- FLASHCARDS ---------------- */
  let reviewSession = null; // {deckId, queue:[cardIds], idx, flipped}

  function renderDecks() {
    const now = S.asOfNow();
    const list = $('#deck-list');
    $('#decks-empty').classList.toggle('hidden', state.decks.length > 0);
    $('#review-area').classList.add('hidden');
    list.classList.remove('hidden');
    list.innerHTML = state.decks.map((d, di) => {
      const st = F.deckStats(d, now);
      const rows = (d.cards || []).map((c, ci) => {
        const due = F.isDue(c, now);
        return '<div class="card-row"><span class="faces"><b>' + esc(c.front) + '</b><span class="muted">' + esc(c.back) + '</span></span>' +
          (due ? '<span class="pill warn">' + esc(t('due_now').replace('{n}', '').trim()) + '</span>' : '<span class="pill good">✓</span>') +
          '<button class="btn small" data-edit-card="' + di + ':' + ci + '">' + esc(t('edit')) + '</button>' +
          '<button class="btn small danger-text" data-del-card="' + di + ':' + ci + '">✕</button></div>';
      }).join('');
      return '<div class="card" data-deck="' + esc(d.id) + '"><div class="deck-head"><h3>🃏 ' + esc(d.name) + '</h3>' +
        '<div><button class="btn small" data-rename-deck="' + di + '">' + esc(t('rename')) + '</button> ' +
        '<button class="btn small danger-text" data-del-deck="' + di + '">' + esc(t('delete')) + '</button></div></div>' +
        '<div class="deck-meta">' + esc(L.fill(t('cards_count'), { n: L.n(st.total) })) + ' · ' +
        esc(L.fill(t('due_now'), { n: L.n(st.due) })) + '</div>' +
        (rows || '<p class="muted small">' + esc(t('deck_empty_cards')) + '</p>') +
        '<div class="deck-actions"><button class="btn small primary" data-review-deck="' + di + '"' + (st.due ? '' : ' disabled') + '>▶ ' + esc(t('review')) + '</button>' +
        '<button class="btn small" data-add-card="' + di + '">＋ ' + esc(t('new_card')) + '</button></div></div>';
    }).join('');

    list.querySelectorAll('[data-del-deck]').forEach(b => b.addEventListener('click', () => {
      if (!confirm(t('confirm_del_deck'))) return;
      state.decks.splice(+b.dataset.delDeck, 1); persist(); render();
    }));
    list.querySelectorAll('[data-rename-deck]').forEach(b => b.addEventListener('click', () => {
      const d = state.decks[+b.dataset.renameDeck];
      modal(t('rename'), textField('f-name', t('m_deck_name'), d.name), () => {
        const v = $('#f-name').value.trim();
        if (!v) { toast(t('empty_name')); return false; }
        d.name = v; persist(); render();
      });
    }));
    list.querySelectorAll('[data-add-card]').forEach(b => b.addEventListener('click', () => editCard(+b.dataset.addCard, -1)));
    list.querySelectorAll('[data-edit-card]').forEach(b => b.addEventListener('click', () => {
      const [di, ci] = b.dataset.editCard.split(':').map(Number);
      editCard(di, ci);
    }));
    list.querySelectorAll('[data-del-card]').forEach(b => b.addEventListener('click', () => {
      if (!confirm(t('confirm_del_card'))) return;
      const [di, ci] = b.dataset.delCard.split(':').map(Number);
      state.decks[di].cards.splice(ci, 1); persist(); render();
    }));
    list.querySelectorAll('[data-review-deck]').forEach(b => b.addEventListener('click', () => startReview(+b.dataset.reviewDeck)));
  }

  function editCard(di, ci) {
    const isNew = ci === -1;
    const c = isNew ? { front: '', back: '' } : state.decks[di].cards[ci];
    modal(isNew ? t('new_card_title') : t('edit_card'),
      textField('f-front', t('m_front'), c.front) + field(t('m_back'), '<textarea id="f-back">' + esc(c.back) + '</textarea>'),
      () => {
        const front = $('#f-front').value.trim(), back = $('#f-back').value.trim();
        if (!front || !back) { toast(t('empty_name')); return false; }
        if (isNew) {
          const card = F.newCard(front, back, S.asOfNow());
          card.id = S.uid();
          state.decks[di].cards.push(card);
          gainXP(1, true);
        } else { c.front = front; c.back = back; }
        persist(); render();
      }, isNew ? t('add') : t('save'));
  }

  function startReview(di) {
    const now = S.asOfNow();
    const deck = state.decks[di];
    const queue = deck.cards.filter(c => F.isDue(c, now)).map(c => c.id);
    if (!queue.length) { toast(t('review_done')); return; }
    reviewSession = { deckId: deck.id, queue, idx: 0, flipped: false };
    renderReview();
  }

  function renderReview() {
    const rs = reviewSession;
    const area = $('#review-area'), list = $('#deck-list');
    list.classList.add('hidden');
    area.classList.remove('hidden');
    const deck = state.decks.find(d => d.id === rs.deckId);
    if (!deck || rs.idx >= rs.queue.length) {
      reviewSession = null;
      area.innerHTML = '<div class="card review"><h3>' + esc(t('review_done')) + '</h3>' +
        '<button class="btn primary" id="review-back">' + esc(t('close')) + '</button></div>';
      $('#review-back').addEventListener('click', render);
      persist();
      return;
    }
    const card = deck.cards.find(c => c.id === rs.queue[rs.idx]);
    area.innerHTML = '<div class="card review">' +
      '<div class="review-progress">' + esc(L.fill(t('of_cards'), { a: L.n(rs.idx + 1), b: L.n(rs.queue.length) })) + ' · ' + esc(deck.name) + '</div>' +
      '<div class="review-card" id="rev-card">' + esc(rs.flipped ? card.back : card.front) + '</div>' +
      (rs.flipped
        ? '<div class="grade-btns">' +
          '<button class="btn g-again" data-grade="1">↺ ' + esc(t('again')) + ' <span class="small">+2</span></button>' +
          '<button class="btn g-hard" data-grade="3">' + esc(t('hard')) + ' <span class="small">+3</span></button>' +
          '<button class="btn g-good" data-grade="4">' + esc(t('good')) + ' <span class="small">+5</span></button>' +
          '<button class="btn g-easy" data-grade="5">' + esc(t('easy')) + ' <span class="small">+6</span></button></div>'
        : '<button class="btn primary" id="rev-flip">' + esc(t('show_answer')) + '</button>') +
      '<div style="margin-top:12px"><button class="btn ghost small" id="review-back">' + esc(t('close')) + '</button></div></div>';
    $('#rev-flip') && $('#rev-flip').addEventListener('click', () => { rs.flipped = true; renderReview(); });
    const rc = $('#rev-card');
    if (rc && !rs.flipped) rc.addEventListener('click', () => { rs.flipped = true; renderReview(); });
    area.querySelectorAll('[data-grade]').forEach(b => b.addEventListener('click', () => {
      const r = F.review(card, +b.dataset.grade, S.asOfNow());
      gainXP(r.xp, true);
      toast('+' + L.n(r.xp) + ' XP');
      rs.idx++; rs.flipped = false;
      persist(); renderReview();
    }));
    $('#review-back').addEventListener('click', () => { reviewSession = null; persist(); render(); });
  }

  $('#btn-add-deck').addEventListener('click', () => {
    modal(t('new_deck'), textField('f-name', t('m_deck_name'), ''), () => {
      const v = $('#f-name').value.trim();
      if (!v) { toast(t('empty_name')); return false; }
      state.decks.push({ id: S.uid(), name: v, cards: [] });
      gainXP(2, true); persist(); render();
    }, t('add'));
  });

  /* ---------------- FOCUS TIMER ---------------- */
  let tmr = T.createTimer(state.settings);
  function syncTimerSettings() { tmr.settings = { focus: state.settings.focus, short: state.settings.short, long: state.settings.long, cycle: state.settings.cycle }; }

  function onPhaseEvents(events) {
    for (const e of events) {
      if (e.type !== 'phaseComplete') continue;
      const kind = e.phase;
      state.focusSessions.push({ id: S.uid(), startedAt: e.startedAt, minutes: e.minutes, kind });
      if (kind === 'focus') gainXP(T.XP_PER_FOCUS);
    }
    if (events.length) { persist(); renderFocusStats(); renderSessionLog(); }
  }

  function renderFocus() {
    syncTimerSettings();
    const s = state.settings;
    $('#set-focus').value = s.focus; $('#set-short').value = s.short;
    $('#set-long').value = s.long; $('#set-cycle').value = s.cycle;
    $('#timer-xp-note').textContent = t('focus_xp_note');
    paintTimer();
    renderFocusStats();
    renderSessionLog();
  }

  function phaseLabel() {
    if (tmr.phase === 'idle') return t('phase_ready');
    if (tmr.phase === 'paused') return t('phase_paused') + ' (' + t('phase_' + (tmr.phaseBeforePause || 'focus')) + ')';
    return t('phase_' + tmr.phase);
  }

  function paintTimer() {
    const rem = T.remaining(tmr, Date.now());
    $('#timer-clock').textContent = L.n(T.fmtClock(rem));
    $('#timer-phase').textContent = phaseLabel();
    const running = tmr.phase !== 'idle' && tmr.phase !== 'paused';
    const paused = tmr.phase === 'paused';
    $('#timer-start').classList.toggle('hidden', running || paused);
    $('#timer-pause').classList.toggle('hidden', !running);
    $('#timer-resume').classList.toggle('hidden', !paused);
    $('#timer-skip').classList.toggle('hidden', tmr.phase === 'idle');
  }

  $('#timer-start').addEventListener('click', () => { T.start(tmr, Date.now()); paintTimer(); });
  $('#timer-pause').addEventListener('click', () => { T.pause(tmr, Date.now()); paintTimer(); });
  $('#timer-resume').addEventListener('click', () => { T.resume(tmr, Date.now()); paintTimer(); });
  $('#timer-skip').addEventListener('click', () => { onPhaseEvents(T.skip(tmr, Date.now())); paintTimer(); });
  $('#timer-reset').addEventListener('click', () => { T.reset(tmr); paintTimer(); });
  setInterval(() => {
    if (tmr.phase !== 'idle' && tmr.phase !== 'paused') onPhaseEvents(T.tick(tmr, Date.now()));
    if (currentTab === 'focus') paintTimer();
  }, 500);

  $('#btn-save-settings').addEventListener('click', () => {
    const g = id => Math.max(1, Math.min(999, parseInt($(id).value, 10) || 25));
    state.settings = { focus: g('#set-focus'), short: g('#set-short'), long: g('#set-long'), cycle: Math.max(2, Math.min(12, parseInt($('#set-cycle').value, 10) || 4)) };
    T.reset(tmr); syncTimerSettings();
    persist(); paintTimer(); toast(t('settings_saved'));
  });

  function renderFocusStats() {
    const now = S.asOfNow(), todayStr = S.dayStr(now);
    let todayMin = 0, weekMin = 0, todayN = 0;
    for (const s of state.focusSessions) {
      if (s.kind !== 'focus') continue;
      const age = Math.floor((now - s.startedAt) / 86400000);
      if (S.dayStr(s.startedAt) === todayStr) { todayMin += s.minutes; todayN++; }
      if (age >= 0 && age < 7) weekMin += s.minutes;
    }
    $('#focus-stats').innerHTML =
      '<div class="kv"><span>' + esc(t('today_min')) + '</span><b>' + L.n(todayMin) + 'm · ' + L.n(todayN) + ' ' + esc(t('sessions')) + '</b></div>' +
      '<div class="kv"><span>' + esc(t('week_min')) + '</span><b>' + L.n(weekMin) + 'm</b></div>';
  }

  function renderSessionLog() {
    const rows = state.focusSessions.slice().sort((a, b) => b.startedAt - a.startedAt).slice(0, 20);
    $('#session-log').innerHTML = rows.length ? rows.map(s => {
      const d = new Date(s.startedAt);
      const when = S.dayStr(s.startedAt) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      return '<div class="log-row"><span>' + (s.kind === 'focus' ? '🍅' : '☕') + ' ' + esc(t('phase_' + s.kind)) +
        ' · ' + L.n(s.minutes) + 'm</span><span class="muted small">' + esc(L.n(when)) + '</span></div>';
    }).join('') : '<p class="muted">' + esc(t('no_sessions')) + '</p>';
  }

  /* ---------------- COUNTDOWNS ---------------- */
  function renderCountdowns() {
    const list = $('#cd-list');
    $('#cd-empty').classList.toggle('hidden', state.countdowns.length > 0);
    const sorted = state.countdowns.slice().sort((a, b) => a.at - b.at);
    list.innerHTML = sorted.map(c => {
      const idx = state.countdowns.indexOf(c);
      const d = new Date(c.at);
      const p = x => String(x).padStart(2, '0');
      const when = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
      return '<div class="card cd-card" data-cd="' + esc(c.id) + '"><div class="cd-name">' + esc(c.name) + '</div>' +
        '<div class="cd-time" data-at="' + c.at + '"></div>' +
        '<div class="cd-meta">' + esc(L.n(when)) + '</div>' +
        '<div class="note-actions"><button class="btn small danger-text" data-del-cd="' + idx + '">' + esc(t('delete')) + '</button></div></div>';
    }).join('');
    list.querySelectorAll('[data-del-cd]').forEach(b => b.addEventListener('click', () => {
      if (!confirm(t('confirm_del_cd'))) return;
      state.countdowns.splice(+b.dataset.delCd, 1); persist(); render();
    }));
    paintCountdowns();
  }

  function paintCountdowns() {
    const now = Date.now();
    $$('.cd-time').forEach(el => {
      const p = C.parts(+el.dataset.at, now);
      if (p.past) {
        el.innerHTML = '<span class="pill good">' + esc(t('cd_expired')) + '</span>';
        return;
      }
      el.innerHTML = '<span>' + L.n(p.days) + '<span class="unit">' + esc(t('u_days')) + '</span></span>' +
        '<span>' + L.n(p.hours) + '<span class="unit">' + esc(t('u_hours')) + '</span></span>' +
        '<span>' + L.n(p.mins) + '<span class="unit">' + esc(t('u_mins')) + '</span></span>' +
        '<span>' + L.n(p.secs) + '<span class="unit">' + esc(t('u_secs')) + '</span></span>';
    });
  }
  setInterval(() => { if (currentTab === 'countdowns') paintCountdowns(); }, 1000);

  $('#btn-add-cd').addEventListener('click', () => {
    const now = new Date(Date.now() + 7 * 86400000);
    const p = x => String(x).padStart(2, '0');
    const def = now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()) + 'T09:00';
    modal(t('new_countdown'),
      textField('f-name', t('m_cd_name'), '') +
      field(t('m_cd_when'), '<input id="f-when" type="datetime-local" value="' + def + '">'),
      () => {
        const name = $('#f-name').value.trim();
        if (!name) { toast(t('empty_name')); return false; }
        const at = Date.parse($('#f-when').value);
        if (isNaN(at)) { toast(t('empty_name')); return false; }
        state.countdowns.push({ id: S.uid(), name, at });
        gainXP(1, true); persist(); render();
      }, t('add'));
  });

  /* ---------------- NOTES ---------------- */
  let notesQuery = '';
  function renderNotes() {
    const list = $('#notes-list');
    const q = notesQuery.trim().toLowerCase();
    const notes = state.notes.slice().sort((a, b) => b.updatedAt - a.updatedAt)
      .filter(nt => !q || (nt.title + ' ' + nt.body).toLowerCase().includes(q));
    $('#notes-empty').classList.toggle('hidden', notes.length > 0);
    list.innerHTML = notes.map(nt => {
      const idx = state.notes.indexOf(nt);
      const d = new Date(nt.updatedAt);
      const when = L.n(S.dayStr(nt.updatedAt)) + ' ' + L.n(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'));
      return '<div class="card" data-note="' + esc(nt.id) + '"><div class="note-title">' + esc(nt.title) + '</div>' +
        '<div class="note-body">' + esc(nt.body) + '</div>' +
        '<div class="note-date">' + esc(when) + '</div>' +
        '<div class="note-actions"><button class="btn small" data-edit-note="' + idx + '">' + esc(t('edit')) + '</button>' +
        '<button class="btn small danger-text" data-del-note="' + idx + '">✕</button></div></div>';
    }).join('');
    list.querySelectorAll('[data-del-note]').forEach(b => b.addEventListener('click', () => {
      if (!confirm(t('confirm_del_note'))) return;
      state.notes.splice(+b.dataset.delNote, 1); persist(); render();
    }));
    list.querySelectorAll('[data-edit-note]').forEach(b => b.addEventListener('click', () => editNote(+b.dataset.editNote)));
  }
  $('#notes-search').addEventListener('input', e => { notesQuery = e.target.value; renderNotes(); });

  function editNote(idx) {
    const isNew = idx === -1;
    const nt = isNew ? { title: '', body: '' } : state.notes[idx];
    modal(isNew ? t('new_note') : t('edit'),
      textField('f-title', t('m_note_title'), nt.title) +
      field(t('m_note_body'), '<textarea id="f-body">' + esc(nt.body) + '</textarea>'),
      () => {
        const title = $('#f-title').value.trim() || t('new_note');
        const body = $('#f-body').value.trim();
        if (!body) { toast(t('empty_name')); return false; }
        if (isNew) { state.notes.push({ id: S.uid(), title, body, updatedAt: Date.now() }); gainXP(1, true); }
        else { nt.title = title; nt.body = body; nt.updatedAt = Date.now(); }
        persist(); render();
      }, isNew ? t('add') : t('save'));
  }
  $('#btn-add-note').addEventListener('click', () => editNote(-1));

  /* ---------------- GLOBAL SEARCH ---------------- */
  const searchBox = $('#global-search'), srBox = $('#search-results');
  function doSearch() {
    const q = searchBox.value.trim().toLowerCase();
    if (q.length < 2) {
      srBox.innerHTML = '<div class="sr-item muted">' + esc(t('type_min')) + '</div>';
      srBox.classList.remove('hidden');
      return;
    }
    const hits = [];
    const push = (kind, label, sub, go) => hits.push({ kind, label, sub, go });
    state.subjects.forEach((s, si) => {
      if (s.name.toLowerCase().includes(q)) push(t('kind_subject'), s.name, (s.topics || []).length + ' topics', () => gotoPlannerSubject(s.id));
      (s.topics || []).forEach(tp => {
        if (tp.name.toLowerCase().includes(q)) push(t('kind_topic'), tp.name, s.name, () => gotoPlannerSubject(s.id));
      });
    });
    state.decks.forEach((d, di) => {
      if (d.name.toLowerCase().includes(q)) push(t('kind_deck'), d.name, '', () => { showTab('flashcards'); });
      (d.cards || []).forEach(c => {
        if ((c.front + ' ' + c.back).toLowerCase().includes(q)) push(t('kind_card'), c.front, d.name, () => { showTab('flashcards'); });
      });
    });
    state.notes.forEach(nt => {
      if ((nt.title + ' ' + nt.body).toLowerCase().includes(q)) push(t('kind_note'), nt.title, nt.body.slice(0, 60), () => { showTab('notes'); });
    });
    state.countdowns.forEach(c => {
      if (c.name.toLowerCase().includes(q)) push(t('kind_countdown'), c.name, '', () => { showTab('countdowns'); });
    });
    srBox.innerHTML = '<h3 style="padding:4px 12px 0">' + esc(t('search_results')) + ' (' + L.n(hits.length) + ')</h3>' +
      (hits.length ? hits.slice(0, 30).map((h, i) =>
        '<div class="sr-item" data-hit="' + i + '"><span class="sr-kind">' + esc(h.kind) + '</span><span><b>' + esc(h.label) + '</b>' +
        (h.sub ? '<br><span class="muted small">' + esc(h.sub) + '</span>' : '') + '</span></div>'
      ).join('') : '<div class="sr-item muted">' + esc(t('no_results')) + '</div>');
    srBox.classList.remove('hidden');
    srBox.querySelectorAll('[data-hit]').forEach(el => el.addEventListener('click', () => {
      srBox.classList.add('hidden');
      hits[+el.dataset.hit].go();
    }));
  }
  function gotoPlannerSubject(id) {
    showTab('planner');
    const el = document.querySelector('[data-subject="' + id + '"]');
    if (el) { el.scrollIntoView({ block: 'center' }); el.style.outline = '2px solid var(--brand)'; setTimeout(() => el.style.outline = '', 1500); }
  }
  let searchDeb = null;
  searchBox.addEventListener('input', () => { clearTimeout(searchDeb); searchDeb = setTimeout(doSearch, 180); });
  searchBox.addEventListener('focus', doSearch);
  document.addEventListener('click', e => {
    if (!e.target.closest('#search-results') && e.target !== searchBox) srBox.classList.add('hidden');
  });

  /* ---------------- EXPORT / IMPORT / CLEAR ---------------- */
  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([S.exportJSON(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'student-os-bd-backup-' + S.asOfToday() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(t('export_done'));
  });
  $('#btn-import').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const v = S.validateImport(String(rd.result || ''));
      if (v.error) { toast(t('import_bad')); return; }
      if (!confirm(t('confirm_import'))) return;
      state = v.state;
      L.setLang(state.lang || 'en');
      persist(); applyStaticI18n(); render();
      toast(t('import_ok'));
    };
    rd.readAsText(f);
  });
  $('#btn-clear').addEventListener('click', () => {
    if (!confirm(t('confirm_clear'))) return;
    const lang = state.lang;
    state = S.defaultState(); state.lang = lang;
    L.setLang(lang); T.reset(tmr); reviewSession = null;
    persist(); render(); toast(t('cleared'));
  });

  /* ---------------- LANGUAGE ---------------- */
  $('#lang-toggle').addEventListener('click', () => {
    const next = L.getLang() === 'bn' ? 'en' : 'bn';
    L.setLang(next); state.lang = next;
    persist(); applyStaticI18n(); render();
  });

  /* ---------------- SEED SAMPLES (first run) ---------------- */
  function seedIfEmpty() {
    if (localStorage.getItem(S.KEY)) return;
    const now = S.asOfNow();
    const d = n => S.dayStr(now + n * 86400000);
    const mk = (name, days, topics) => ({
      id: S.uid(), name, color: SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length],
      examDate: days == null ? null : d(days),
      topics: topics.map(([tn, m, p]) => ({ id: S.uid(), name: tn, minutes: m, passes: p })),
    });
    state.subjects.push(
      mk('Physics', 12, [['Motion & Forces', 45, 2], ['Electricity', 60, 1], ['Waves & Optics', 40, 0]]),
      mk('ICT', 26, [['Number Systems', 30, 3], ['Logic Gates', 35, 1], ['Networking', 50, 0]]),
      mk('English', null, [['Grammar: Tenses', 25, 1], ['Writing: Paragraph', 30, 0]])
    );
    const deck = { id: S.uid(), name: 'Physics formulas', cards: [] };
    [['F = ?', 'F = ma'], ['v = ?', 'v = u + at'], ['P = ?', 'P = VI']].forEach(([f, b], i) => {
      const c = F.newCard(f, b, now - (i === 2 ? 0 : 2 * 86400000));
      c.id = S.uid();
      if (i === 2) c.due = now + 3 * 86400000; // one card not due
      deck.cards.push(c);
    });
    state.decks.push(deck);
    state.countdowns.push(
      { id: S.uid(), name: 'Physics final', at: Date.parse(d(12) + 'T09:00:00') },
      { id: S.uid(), name: 'Admission test', at: now + 45 * 86400000 + 3600000 }
    );
    state.notes.push({ id: S.uid(), title: 'Welcome 👋', body: 'This is Student OS BD — your offline study companion.\n\n• Plan subjects in Planner\n• Review with Flashcards (spaced repetition)\n• Focus with the Pomodoro timer\n• Track exams in Countdowns\n\nEarn XP everywhere. Good luck!', updatedAt: now });
    state.xp = 12;
    S.touchActivity(state, now);
    persist();
  }

  /* ---------------- RENDER DISPATCH / INIT ---------------- */
  function render() {
    updateXpChip();
    if (currentTab === 'dashboard') renderDashboard();
    else if (currentTab === 'planner') renderPlanner();
    else if (currentTab === 'flashcards') renderDecks();
    else if (currentTab === 'focus') renderFocus();
    else if (currentTab === 'countdowns') renderCountdowns();
    else if (currentTab === 'notes') renderNotes();
  }

  // test hooks (used by the headless QA suite; harmless in production)
  window.__sos = {
    get state() { return state; },
    set state(s) { state = s; },
    store: S, planner: P, flash: F, timerMod: T, cd: C, i18n: L,
    render, showTab, gainXP, persist,
    get tmr() { return tmr; },
    reviewSession: () => reviewSession,
  };

  seedIfEmpty();
  applyStaticI18n();
  render();
})();
