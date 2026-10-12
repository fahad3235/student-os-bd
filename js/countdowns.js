/* Student OS BD — countdown math (pure). */
'use strict';

function parts(at, nowMs) {
  let diff = at - nowMs;
  const past = diff <= 0;
  diff = Math.abs(diff);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const mins = Math.floor(diff / 60000) % 60;
  const secs = Math.floor(diff / 1000) % 60;
  return { past, days, hours, mins, secs };
}

const cdApi = { parts };
if (typeof module !== 'undefined' && module.exports) module.exports = cdApi;
if (typeof window !== 'undefined') { window.SOS = window.SOS || {}; window.SOS.countdowns = cdApi; }
