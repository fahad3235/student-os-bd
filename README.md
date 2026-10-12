# Student OS BD — স্টুডেন্ট ওএস বিডি

Your entire student life in one offline page. **Student OS BD** is a fully
offline, bilingual (English/বাংলা) single-page "operating system" for students:
a today-at-a-glance dashboard, study planner with revision tracking, SM-2
spaced-repetition flashcards, a Pomodoro focus timer, a live exam-countdown hub,
and quick notes — all tied together with cross-module **XP/levels**, global
search, and JSON backup/restore. No account, no internet, no tracking: every
byte stays in your browser's localStorage.

## Problem

Students juggle syllabi, revision, flashcards, focus sessions, exam dates and
scattered notes across five different apps — most of which need accounts,
internet, and subscriptions. The night before an exam, nothing is in one place
and revision history is guesswork. Student OS BD puts the whole workflow in a
single static page that works offline on a phone or laptop, in English or
বাংলা, and rewards consistency with XP earned in every module.

## Features

- **📊 Dashboard** — today at a glance: overall study readiness %, flashcards
  due, today's focus minutes + sessions, day streak 🔥, next 5 upcoming exams
  with days-left pills, auto-picked **🎯 Today's focus** (nearest exam's
  least-revised topic, one-click "mark one pass done"), and study-health stats.
- **📚 Study Planner** — subjects with color tags + optional exam dates
  (countdown states: plenty of time / this week / tomorrow / TODAY / passed);
  topics with estimated minutes and **3 revision passes** (click the dots);
  per-subject and overall readiness %; validation (empty/duplicate names,
  >5-year date warning).
- **🃏 Flashcards** — decks with add/rename/delete; cards with add/edit/delete;
  **SM-2-lite spaced repetition** (Again/Hard/Good/Easy → 1/6/ease×days
  intervals, ease factor 1.3–2.5+); due queue with one-tap review flow.
- **⏱️ Focus Timer** — Pomodoro state machine (custom focus/short/long/cycle
  lengths); start/pause/resume/skip/reset; session log; today + 7-day focus
  stats. Completing a focus session earns **+10 XP**.
- **⏳ Countdown Hub** — named countdowns with live ticking
  (days/hrs/min/sec), sorted soonest-first, expired state.
- **📝 Quick Notes** — CRUD notes with instant search.
- **Shared systems**
  - **XP/levels everywhere**: flashcard reviews (+2/+3/+5/+6 by grade), focus
    sessions (+10), topic passes (+4), new subjects/decks/cards/notes/countdowns
    (+1/+2); level = 100 XP; level-up toast; header XP chip.
  - **Day streak** from any XP-earning activity.
  - **Global search** across subjects, topics, decks, cards, notes, countdowns
    (click a hit to jump there).
  - **EN/বাংলা toggle** — full UI translation + Bengali digits (১২৩) in every
    number, date and clock.
  - **JSON export/import** of ALL data (validated backup format) + clear-all
    with confirm; everything persists in localStorage.
- **Mobile-first**: bottom tab bar, responsive cards, no horizontal overflow at
  390px. **Zero network requests** — open `index.html` from `file://`.
- Test hook: `?asof=YYYY-MM-DD` freezes "today" for deterministic QA.

## Stack

Vanilla HTML/CSS/JS — no build step, no dependencies, no backend, no network
calls. Pure logic modules (`js/planner.js`, `js/flashcards.js`, `js/timer.js`,
`js/countdowns.js`, `js/store.js`, `js/i18n.js`) are separated from UI wiring
(`js/app.js`) and load in both the browser (`window.SOS`) and Node
(`module.exports`) so the math is unit-testable.

## Prerequisites

Any modern browser (Chrome, Edge, Firefox, Safari). Nothing to install.
For running the tests: Node.js 18+.

## Install

No install needed — it's static files.

```bash
cd student-os-bd
# option A: just open it (fully offline, works from file://)
xdg-open index.html
# option B: serve it
python3 -m http.server 8123
# open http://localhost:8123/
```

## Dev commands

No build, no package manager. Edit files, reload the browser.

```bash
python3 -m http.server 8123   # local dev server (optional)
node tests/run-tests.js       # Node unit tests (50 checks)
node /tmp/sos-qa.mjs          # headless-Chrome UI suite (see Testing)
```

## Environment

**None.** No API keys, no `.env`, no backend, no third-party requests — the app
is 100% client-side and makes zero network calls. (Verified: no `fetch`/`XHR`/
external `<script src>` anywhere in the source.)

## Testing

Two suites, both green:

**1. Node unit tests** — `node tests/run-tests.js` → **50/50 pass**. Covers:
readiness % math (hand-verified: 4 topics × 2/3 passes = 66.666…%,
`[3,1,0]` = 44.444…%, clamping, empty subjects); `daysUntil`/`examState`
buckets; today's-focus picking (nearest exam, least-done topic, passed exams
sink); pass-dot cycling; SM-2 intervals (1 → 6 → 15 days on Good, ease 2.5 →
2.6 on Easy / 2.36 on Hard / −0.2 on Again, 1.3 floor, lapse reset, due/due-queue
filtering); Pomodoro state machine (start → focus → short → … → long after 4th,
pause/resume time-freeze, skip, reset, overshoot chaining, clock formatting);
countdown parts (2d 3h 4m 5s exact, past flag); XP/level thresholds
(0→L1, 99→L1, 100→L2, 250→L3, level-up detection); streak math (consecutive,
gap, yesterday-start); export/import round-trip + rejection of garbage;
save/load with fake storage; i18n (BN strings, Bengali digits, localized
dates, key fallback).

**2. Headless-Chrome UI suite** — **48/48 pass, 0 console/page errors**
(`file://` + CDP; deterministic via `?asof=2026-10-12`). Covers: navigation
across all 6 modules; add subject → add topics → pass dots → exact readiness
text (`100.0%` → `50.0%`); full flashcard review (flip, grade Good/Easy, done
state, +11 XP); timer start/pause/resume + forced completion → session logged
and +10 XP; countdown add + live second-ticking; notes create/edit/search/delete;
BN toggle rewrites UI with Bengali digits and back; global search hits +
navigates; export toast; import round-trip via synthetic File (xp 777 restored);
reload persistence (xp, subjects, notes, session log); 390px mobile — no
horizontal overflow on any tab, bottom tab bar in place.

## Deployment

GitHub Pages compatible: static files only, no server. Publish the folder
as-is (branch `main`, root `/`). Works from `file://` too — no `fetch` calls,
so there are no CORS issues.

## Limitations

- **Readiness % is motivational, not scientific**: each of the 3 revision
  passes counts ⅓ of a topic — real mastery isn't linear.
- **SM-2-lite is simplified**: classic SM-2 quality→interval mapping, but
  "new card" intervals start at 1 day (no learning steps) and there is no
  leech detection beyond a lapse counter.
- **Countdowns tick only while the tab is open** — no push notifications or
  background reminders (impossible for a static page).
- **Pomodoro uses the wall clock**: switching tabs is fine, but closing the
  page abandons the running phase (no partial credit).
- **Data is per-browser localStorage** (~5 MB): no sync between devices;
  JSON export is the backup/migration path. Import *replaces* all data.
- **Bengali translations** cover the full UI but month abbreviations and some
  compound strings are simplified; dates use device-local timezone.
- Sample data is seeded on first run (clear it with "Clear all data").

## Status

Built and tested 2026-10-12 — **50/50 Node unit checks + 48/48 headless-Chrome
UI checks pass, zero console/page errors**. Staged for publishing (not yet
pushed).
