/* Student OS BD — Pomodoro state machine (pure, no DOM, no setInterval).
   Phases: idle -> focus -> short|long -> focus ... ; pause/resume/skip/reset.
   All time in ms; nowMs injected for determinism. */
'use strict';

const XP_PER_FOCUS = 10;

function createTimer(settings) {
  return {
    settings: { focus: settings.focus, short: settings.short, long: settings.long, cycle: settings.cycle },
    phase: 'idle',          // idle|focus|short|long|paused
    phaseBeforePause: null,
    endAt: 0,               // when current phase ends (ms)
    remainingMs: 0,         // used while paused
    completedFocus: 0,      // focus phases completed in this run
    startedAt: 0,           // when current focus phase started (for session logging)
  };
}

function phaseLen(t, phase) {
  const s = t.settings;
  if (phase === 'focus') return s.focus * 60000;
  if (phase === 'short') return s.short * 60000;
  if (phase === 'long') return s.long * 60000;
  return 0;
}

/* events: array of {type:'phaseComplete', phase, startedAt, minutes} */
function start(t, nowMs) {
  if (t.phase !== 'idle') return [];
  t.phase = 'focus';
  t.startedAt = nowMs;
  t.endAt = nowMs + phaseLen(t, 'focus');
  return [];
}

function tick(t, nowMs) {
  const events = [];
  if (t.phase === 'idle' || t.phase === 'paused') return events;
  while (nowMs >= t.endAt && t.phase !== 'idle' && t.phase !== 'paused') {
    const done = t.phase;
    if (done === 'focus') {
      t.completedFocus += 1;
      events.push({ type: 'phaseComplete', phase: 'focus', startedAt: t.startedAt, minutes: t.settings.focus });
      t.phase = (t.completedFocus % t.settings.cycle === 0) ? 'long' : 'short';
    } else {
      events.push({ type: 'phaseComplete', phase: done, startedAt: t.endAt - phaseLen(t, done), minutes: Math.round(phaseLen(t, done) / 60000) });
      t.phase = 'focus';
      t.startedAt = t.endAt;
    }
    t.endAt = t.endAt + phaseLen(t, t.phase);
  }
  return events;
}

function pause(t, nowMs) {
  if (t.phase === 'idle' || t.phase === 'paused') return false;
  t.remainingMs = Math.max(0, t.endAt - nowMs);
  t.phaseBeforePause = t.phase;
  t.phase = 'paused';
  return true;
}

function resume(t, nowMs) {
  if (t.phase !== 'paused') return false;
  t.phase = t.phaseBeforePause || 'focus';
  t.phaseBeforePause = null;
  t.endAt = nowMs + t.remainingMs;
  t.remainingMs = 0;
  return true;
}

/* Skips the current phase as if it finished now (no XP for partial focus). */
function skip(t, nowMs) {
  if (t.phase === 'idle' || t.phase === 'paused') return [];
  t.endAt = nowMs;
  return tick(t, nowMs);
}

function reset(t) {
  t.phase = 'idle'; t.phaseBeforePause = null;
  t.endAt = 0; t.remainingMs = 0; t.completedFocus = 0; t.startedAt = 0;
}

function remaining(t, nowMs) {
  if (t.phase === 'idle') return phaseLen(t, 'focus');
  if (t.phase === 'paused') return t.remainingMs;
  return Math.max(0, t.endAt - nowMs);
}

function fmtClock(ms) {
  const s = Math.ceil(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return mm + ':' + ss;
}

const timerApi = { XP_PER_FOCUS, createTimer, phaseLen, start, tick, pause, resume, skip, reset, remaining, fmtClock };
if (typeof module !== 'undefined' && module.exports) module.exports = timerApi;
if (typeof window !== 'undefined') { window.SOS = window.SOS || {}; window.SOS.timer = timerApi; }
