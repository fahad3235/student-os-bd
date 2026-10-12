/* Student OS BD — flashcards logic: SM-2-lite spaced repetition (pure). */
'use strict';

/* quality: 1=Again, 3=Hard, 4=Good, 5=Easy */
const QUALITY_XP = { 1: 2, 3: 3, 4: 5, 5: 6 };

function newCard(front, back, nowMs) {
  return { id: null, front, back, ease: 2.5, interval: 0, reps: 0, due: nowMs, lapses: 0 };
}

/* Applies one SM-2-lite review. Returns {xp} and mutates the card.
   nowMs is injected for determinism. */
function review(card, quality, nowMs) {
  const q = quality;
  if (q >= 3) {
    card.reps += 1;
    if (card.reps === 1) card.interval = 1;
    else if (card.reps === 2) card.interval = 6;
    else card.interval = Math.max(1, Math.round(card.interval * card.ease));
    card.ease = Math.max(1.3, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  } else {
    card.reps = 0;
    card.interval = 1;
    card.lapses = (card.lapses || 0) + 1;
    card.ease = Math.max(1.3, card.ease - 0.2);
  }
  card.due = nowMs + card.interval * 86400000;
  return { xp: QUALITY_XP[q] || 0 };
}

function isDue(card, nowMs) { return card.due <= nowMs; }
function dueCards(decks, nowMs) {
  const out = [];
  for (const d of (decks || [])) for (const c of (d.cards || [])) {
    if (isDue(c, nowMs)) out.push({ deck: d, card: c });
  }
  return out;
}
function deckStats(deck, nowMs) {
  const cards = deck.cards || [];
  let due = 0, fresh = 0;
  for (const c of cards) { if (isDue(c, nowMs)) due++; if (c.reps === 0 && c.interval === 0) fresh++; }
  return { total: cards.length, due, fresh };
}

const flashApi = { QUALITY_XP, newCard, review, isDue, dueCards, deckStats };
if (typeof module !== 'undefined' && module.exports) module.exports = flashApi;
if (typeof window !== 'undefined') { window.SOS = window.SOS || {}; window.SOS.flash = flashApi; }
