/* Student OS BD — store. State shape, localStorage persistence, XP/levels, activity streak, export/import. Pure except load/save. */
'use strict';

const KEY = 'student-os-bd-v1';
const XP_PER_LEVEL = 100;

function uid() {
  return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function defaultState() {
  return {
    v: 1,
    lang: 'en',
    xp: 0,
    subjects: [],      // {id,name,color,examDate:'YYYY-MM-DD'|null,topics:[{id,name,minutes,passes}]}
    decks: [],         // {id,name,cards:[{id,front,back,ease,interval,reps,due}]}
    focusSessions: [], // {id,startedAt,minutes,kind:'focus'|'short'|'long'}
    countdowns: [],    // {id,name,at:ms}
    notes: [],         // {id,title,body,updatedAt}
    settings: { focus: 25, short: 5, long: 15, cycle: 4 },
    activity: {},      // {'YYYY-MM-DD': true}
  };
}

function load(storage) {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object' || s.v !== 1) return defaultState();
    const d = defaultState();
    return Object.assign(d, s, {
      settings: Object.assign(d.settings, s.settings || {}),
      activity: s.activity || {},
    });
  } catch (e) { return defaultState(); }
}

function save(storage, state) {
  try { storage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota/full — non-fatal */ }
}

/* ---- XP / levels ---- */
function levelFor(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  return { level, into: xp % XP_PER_LEVEL, need: XP_PER_LEVEL };
}
/* Adds xp; returns {leveledUp, level}. */
function addXP(state, amount) {
  const before = levelFor(state.xp).level;
  state.xp = Math.max(0, state.xp + amount);
  const after = levelFor(state.xp).level;
  return { leveledUp: after > before, level: after };
}

/* ---- activity streak ---- */
function dayStr(ms) {
  const d = new Date(ms);
  const p = x => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function touchActivity(state, ms) { state.activity[dayStr(ms)] = true; }
/* Consecutive active days ending today (or yesterday if today is not active yet). */
function streak(state, nowMs) {
  let count = 0;
  let cursor = new Date(nowMs);
  const fmt = d => dayStr(d.getTime());
  if (!state.activity[fmt(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (state.activity[fmt(cursor)]) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
    if (count > 3650) break;
  }
  return count;
}

/* ---- export / import ---- */
function exportJSON(state) {
  return JSON.stringify({ app: 'student-os-bd', v: 1, exportedAt: new Date().toISOString(), state }, null, 2);
}
function validateImport(text) {
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return { error: 'parse' }; }
  if (!obj || obj.app !== 'student-os-bd' || !obj.state || obj.state.v !== 1) return { error: 'shape' };
  const s = obj.state;
  for (const k of ['subjects', 'decks', 'focusSessions', 'countdowns', 'notes']) {
    if (!Array.isArray(s[k])) return { error: 'shape' };
  }
  if (typeof s.xp !== 'number') return { error: 'shape' };
  return { state: s };
}

/* ---- ?asof=YYYY-MM-DD test hook: freezes "today" ---- */
function asOfToday() {
  try {
    const m = /[?&]asof=(\d{4}-\d{2}-\d{2})/.exec(typeof location !== 'undefined' ? location.search : '');
    if (m) return m[1];
  } catch (e) {}
  return dayStr(Date.now());
}
function asOfNow() {
  const d = asOfToday();
  const t = Date.parse(d + 'T12:00:00');
  return isNaN(t) ? Date.now() : t;
}

const storeApi = { KEY, XP_PER_LEVEL, uid, defaultState, load, save, levelFor, addXP, dayStr, touchActivity, streak, exportJSON, validateImport, asOfToday, asOfNow };
if (typeof module !== 'undefined' && module.exports) module.exports = storeApi;
if (typeof window !== 'undefined') { window.SOS = window.SOS || {}; window.SOS.store = storeApi; }
