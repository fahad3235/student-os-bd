/* Student OS BD — planner logic (pure functions, no DOM). */
'use strict';

const PASSES_PER_TOPIC = 3;

function clampPasses(p) { return Math.max(0, Math.min(PASSES_PER_TOPIC, p | 0)); }

/* Subject readiness % = completed passes / total possible passes * 100. */
function subjectReadiness(subject) {
  const topics = subject.topics || [];
  if (!topics.length) return 0;
  let done = 0;
  for (const t of topics) done += clampPasses(t.passes);
  return (done / (PASSES_PER_TOPIC * topics.length)) * 100;
}

/* Overall readiness across all subjects. */
function overallReadiness(state) {
  let done = 0, total = 0;
  for (const s of (state.subjects || [])) {
    for (const t of (s.topics || [])) { done += clampPasses(t.passes); total += PASSES_PER_TOPIC; }
  }
  return total === 0 ? 0 : (done / total) * 100;
}

/* Whole days from asof (YYYY-MM-DD) to examDate (YYYY-MM-DD). Negative = passed. */
function daysUntil(examDate, asof) {
  const a = Date.parse(asof + 'T00:00:00');
  const b = Date.parse(examDate + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function examState(examDate, asof) {
  if (!examDate) return 'none';
  const d = daysUntil(examDate, asof);
  if (d < 0) return 'passed';
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d <= 7) return 'week';
  return 'plenty';
}

/* Today's focus: nearest upcoming exam (undated subjects last), then the
   least-completed topic of that subject. Returns {subject, topic} or null. */
function todaysFocus(state, asof) {
  const subjects = (state.subjects || []).filter(s => (s.topics || []).length > 0);
  if (!subjects.length) return null;
  const rank = s => {
    if (!s.examDate) return 1e9;
    const d = daysUntil(s.examDate, asof);
    return d < 0 ? 1e9 + Math.abs(d) : d; // passed exams sink to the bottom
  };
  const sorted = subjects.slice().sort((a, b) => rank(a) - rank(b));
  const subject = sorted[0];
  const topic = subject.topics.slice().sort((a, b) => clampPasses(a.passes) - clampPasses(b.passes))[0];
  return { subject, topic };
}

/* Pass cycling used by the UI dots: clicking dot i sets passes to i+1, or back to i if already there. */
function cyclePasses(topic, dotIndex) {
  const cur = clampPasses(topic.passes);
  return (dotIndex + 1 === cur) ? dotIndex : dotIndex + 1;
}

const plannerApi = { PASSES_PER_TOPIC, clampPasses, subjectReadiness, overallReadiness, daysUntil, examState, todaysFocus, cyclePasses };
if (typeof module !== 'undefined' && module.exports) module.exports = plannerApi;
if (typeof window !== 'undefined') { window.SOS = window.SOS || {}; window.SOS.planner = plannerApi; }
