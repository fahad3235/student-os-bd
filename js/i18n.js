/* Student OS BD — i18n. Pure (no DOM). Exposed via module.exports (Node) and window.SOS (browser). */
'use strict';

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];

const STRINGS = {
en: {
  nav_dashboard: 'Dashboard', nav_planner: 'Planner', nav_flashcards: 'Flashcards',
  nav_focus: 'Focus', nav_countdowns: 'Countdowns', nav_notes: 'Notes',
  search_placeholder: 'Search subjects, cards, notes…',
  export: 'Export', import: 'Import', clear_all: 'Clear all data',
  footer_offline: '100% offline · your data stays in this browser',
  // dashboard
  dash_title: 'Today at a glance',
  dash_readiness: 'Study readiness', dash_due: 'Flashcards due', dash_focus_today: 'Focus today',
  dash_streak: 'Day streak', dash_upcoming: 'Upcoming exams', dash_no_exams: 'No upcoming exams. Add exam dates in Planner.',
  dash_focus_pick: "🎯 Today's focus", dash_health: '📊 Study health',
  dash_no_focus: 'Nothing to focus on — add a subject with topics in Planner.',
  dash_due_none: 'Nothing due. 🎉', dash_review_now: 'Review now',
  dash_no_subjects: 'Add subjects in the Planner to see your study health.',
  h_subjects: 'Subjects', h_topics: 'Topics', h_passes_done: 'Passes done', h_overall: 'Overall readiness',
  days: 'days', day: 'day', left: 'left', passed: 'passed',
  mark_pass: 'Mark one pass done',
  xp_gained: '+{n} XP',
  // planner
  planner_title: 'Study planner', add_subject: 'Add subject',
  m_subject_name: 'Subject name', m_exam_date: 'Exam date (optional)',
  m_topic_name: 'Topic name', m_minutes: 'Est. minutes',
  add: 'Add', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit', close: 'Close',
  new_subject: 'New subject', new_topic: 'New topic', edit_subject: 'Edit subject',
  planner_empty: 'No subjects yet. Add your first subject to start planning.',
  no_topics: 'No topics yet — add the first one below.',
  add_topic: 'Add topic', delete_subject: 'Delete subject',
  confirm_del_subject: 'Delete this subject and all its topics?',
  confirm_del_topic: 'Delete this topic?',
  readiness: 'Readiness',
  st_plenty: 'plenty of time', st_week: 'this week', st_tomorrow: 'tomorrow', st_today: 'TODAY', st_passed: 'passed',
  no_exam_date: 'no exam date',
  pass_title: 'Revision passes (click a dot)',
  empty_name: 'Name cannot be empty.',
  dup_name: 'A subject with this name already exists.',
  bad_date: 'Exam date is more than 5 years away — is that right?',
  // flashcards
  decks_title: 'Flashcards', new_deck: 'New deck', new_card: 'New card',
  m_deck_name: 'Deck name', m_front: 'Front', m_back: 'Back',
  decks_empty: 'No decks yet. Create a deck and add cards to start spaced repetition.',
  cards_count: '{n} cards', due_now: '{n} due now', new_cards: '{n} new',
  review: 'Review', add_cards: 'Cards', rename: 'Rename',
  confirm_del_deck: 'Delete this deck and all its cards?',
  confirm_del_card: 'Delete this card?',
  review_done: 'All caught up! 🎉 No cards due right now.',
  show_answer: 'Show answer', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy',
  of_cards: 'Card {a} of {b}', edit_card: 'Edit card', new_card_title: 'New card',
  deck_empty_cards: 'This deck has no cards yet. Add the first one.',
  // focus
  focus_title: 'Focus timer', start: 'Start', pause: 'Pause', resume: 'Resume',
  skip: 'Skip', reset: 'Reset',
  phase_ready: 'Ready', phase_focus: 'Focus', phase_short: 'Short break', phase_long: 'Long break',
  phase_paused: 'Paused',
  focus_stats: 'Stats', focus_settings: 'Settings', focus_len: 'Focus', short_len: 'Short break',
  long_len: 'Long break', cycle_len: 'Cycle', session_log: 'Session log',
  today_min: 'Today', week_min: 'This week', sessions: 'sessions',
  no_sessions: 'No sessions logged yet. Start your first focus session!',
  focus_xp_note: 'Completing a focus session earns +10 XP.',
  settings_saved: 'Settings saved.',
  // countdowns
  cd_title: 'Exam countdown hub', new_countdown: 'New countdown',
  m_cd_name: 'Name (e.g. Physics final)', m_cd_when: 'Date & time',
  cd_empty: 'No countdowns yet. Add one for your next exam or deadline.',
  cd_expired: 'Reached 🎉', confirm_del_cd: 'Delete this countdown?',
  u_days: 'd', u_hours: 'h', u_mins: 'm', u_secs: 's',
  // notes
  notes_title: 'Quick notes', new_note: 'New note', m_note_title: 'Title', m_note_body: 'Note',
  search_notes: 'Search notes…',
  notes_empty: 'No notes yet. Jot down anything worth remembering.',
  confirm_del_note: 'Delete this note?',
  // search
  search_results: 'Search results', no_results: 'No matches. Try another keyword.',
  kind_subject: 'Subject', kind_topic: 'Topic', kind_deck: 'Deck', kind_card: 'Card',
  kind_note: 'Note', kind_countdown: 'Countdown',
  type_min: 'Type at least 2 characters to search.',
  // export/import
  export_done: 'Backup downloaded.',
  import_ok: 'Import successful — data replaced.',
  import_bad: 'Import failed: not a valid Student OS backup.',
  confirm_import: 'Import will REPLACE all current data. Continue?',
  confirm_clear: 'Delete ALL data in every module? This cannot be undone.',
  cleared: 'All data cleared.',
  level_up: '🎉 Level up! You are now level {n}.',
  // misc
  on: 'on',
},
bn: {
  nav_dashboard: 'ড্যাশবোর্ড', nav_planner: 'প্ল্যানার', nav_flashcards: 'ফ্ল্যাশকার্ড',
  nav_focus: 'ফোকাস', nav_countdowns: 'কাউন্টডাউন', nav_notes: 'নোট',
  search_placeholder: 'বিষয়, কার্ড, নোট খুঁজুন…',
  export: 'এক্সপোর্ট', import: 'ইমপোর্ট', clear_all: 'সব ডেটা মুছুন',
  footer_offline: '১০০% অফলাইন · আপনার ডেটা এই ব্রাউজারেই থাকে',
  dash_title: 'আজকের এক নজর',
  dash_readiness: 'পড়ার প্রস্তুতি', dash_due: 'ফ্ল্যাশকার্ড বাকি', dash_focus_today: 'আজকের ফোকাস',
  dash_streak: 'দিনের ধারাবাহিকতা', dash_upcoming: 'আসন্ন পরীক্ষা', dash_no_exams: 'কোনো আসন্ন পরীক্ষা নেই। প্ল্যানারে পরীক্ষার তারিখ যোগ করুন।',
  dash_focus_pick: '🎯 আজকের ফোকাস', dash_health: '📊 পড়াশোনার স্বাস্থ্য',
  dash_no_focus: 'ফোকাস করার কিছু নেই — প্ল্যানারে টপিকসহ বিষয় যোগ করুন।',
  dash_due_none: 'বাকি কিছু নেই। 🎉', dash_review_now: 'এখনই রিভিউ করুন',
  dash_no_subjects: 'পড়ার স্বাস্থ্য দেখতে প্ল্যানারে বিষয় যোগ করুন।',
  h_subjects: 'বিষয়', h_topics: 'টপিক', h_passes_done: 'পাস সম্পন্ন', h_overall: 'সামগ্রিক প্রস্তুতি',
  days: 'দিন', day: 'দিন', left: 'বাকি', passed: 'শেষ',
  mark_pass: 'একটি পাস সম্পন্ন করুন',
  xp_gained: '+{n} XP',
  planner_title: 'স্টাডি প্ল্যানার', add_subject: 'বিষয় যোগ করুন',
  m_subject_name: 'বিষয়ের নাম', m_exam_date: 'পরীক্ষার তারিখ (ঐচ্ছিক)',
  m_topic_name: 'টপিকের নাম', m_minutes: 'আনুমানিক মিনিট',
  add: 'যোগ করুন', cancel: 'বাতিল', save: 'সংরক্ষণ', delete: 'মুছুন', edit: 'সম্পাদনা', close: 'বন্ধ',
  new_subject: 'নতুন বিষয়', new_topic: 'নতুন টপিক', edit_subject: 'বিষয় সম্পাদনা',
  planner_empty: 'এখনো কোনো বিষয় নেই। পরিকল্পনা শুরু করতে প্রথম বিষয় যোগ করুন।',
  no_topics: 'এখনো কোনো টপিক নেই — নিচে প্রথমটি যোগ করুন।',
  add_topic: 'টপিক যোগ করুন', delete_subject: 'বিষয় মুছুন',
  confirm_del_subject: 'এই বিষয় ও এর সব টপিক মুছে ফেলবেন?',
  confirm_del_topic: 'এই টপিক মুছে ফেলবেন?',
  readiness: 'প্রস্তুতি',
  st_plenty: 'যথেষ্ট সময়', st_week: 'এই সপ্তাহে', st_tomorrow: 'আগামীকাল', st_today: 'আজ', st_passed: 'শেষ',
  no_exam_date: 'পরীক্ষার তারিখ নেই',
  pass_title: 'রিভিশন পাস (ডটে ক্লিক করুন)',
  empty_name: 'নাম খালি রাখা যাবে না।',
  dup_name: 'এই নামে একটি বিষয় ইতিমধ্যে আছে।',
  bad_date: 'পরীক্ষার তারিখ ৫ বছরেরও বেশি দূরে — ঠিক আছে তো?',
  decks_title: 'ফ্ল্যাশকার্ড', new_deck: 'নতুন ডেক', new_card: 'নতুন কার্ড',
  m_deck_name: 'ডেকের নাম', m_front: 'সামনে', m_back: 'পেছনে',
  decks_empty: 'এখনো কোনো ডেক নেই। স্পেসড রিপিটিশন শুরু করতে ডেক তৈরি করে কার্ড যোগ করুন।',
  cards_count: '{n}টি কার্ড', due_now: '{n}টি বাকি', new_cards: '{n}টি নতুন',
  review: 'রিভিউ', add_cards: 'কার্ড', rename: 'নাম বদলান',
  confirm_del_deck: 'এই ডেক ও এর সব কার্ড মুছে ফেলবেন?',
  confirm_del_card: 'এই কার্ড মুছে ফেলবেন?',
  review_done: 'সব শেষ! 🎉 এখন বাকি কোনো কার্ড নেই।',
  show_answer: 'উত্তর দেখুন', again: 'আবার', hard: 'কঠিন', good: 'ভালো', easy: 'সহজ',
  of_cards: '{a} / {b} নং কার্ড', edit_card: 'কার্ড সম্পাদনা', new_card_title: 'নতুন কার্ড',
  deck_empty_cards: 'এই ডেকে এখনো কোনো কার্ড নেই। প্রথমটি যোগ করুন।',
  focus_title: 'ফোকাস টাইমার', start: 'শুরু', pause: 'বিরতি', resume: 'আবার শুরু',
  skip: 'এড়িয়ে যান', reset: 'রিসেট',
  phase_ready: 'প্রস্তুত', phase_focus: 'ফোকাস', phase_short: 'ছোট বিরতি', phase_long: 'লম্বা বিরতি',
  phase_paused: 'বিরতিতে',
  focus_stats: 'পরিসংখ্যান', focus_settings: 'সেটিংস', focus_len: 'ফোকাস', short_len: 'ছোট বিরতি',
  long_len: 'লম্বা বিরতি', cycle_len: 'চক্র', session_log: 'সেশন লগ',
  today_min: 'আজ', week_min: 'এই সপ্তাহে', sessions: 'সেশন',
  no_sessions: 'এখনো কোনো সেশন লগ হয়নি। প্রথম ফোকাস সেশন শুরু করুন!',
  focus_xp_note: 'একটি ফোকাস সেশন সম্পন্ন করলে +১০ XP পাবেন।',
  settings_saved: 'সেটিংস সংরক্ষিত হয়েছে।',
  cd_title: 'পরীক্ষার কাউন্টডাউন হাব', new_countdown: 'নতুন কাউন্টডাউন',
  m_cd_name: 'নাম (যেমন: পদার্থবিজ্ঞান ফাইনাল)', m_cd_when: 'তারিখ ও সময়',
  cd_empty: 'এখনো কোনো কাউন্টডাউন নেই। পরের পরীক্ষা বা ডেডলাইনের জন্য একটি যোগ করুন।',
  cd_expired: 'পৌঁছে গেছে 🎉', confirm_del_cd: 'এই কাউন্টডাউন মুছে ফেলবেন?',
  u_days: 'দি', u_hours: 'ঘ', u_mins: 'মি', u_secs: 'সে',
  notes_title: 'দ্রুত নোট', new_note: 'নতুন নোট', m_note_title: 'শিরোনাম', m_note_body: 'নোট',
  search_notes: 'নোট খুঁজুন…',
  notes_empty: 'এখনো কোনো নোট নেই। মনে রাখার মতো কিছু লিখে রাখুন।',
  confirm_del_note: 'এই নোট মুছে ফেলবেন?',
  search_results: 'খোঁজার ফলাফল', no_results: 'কোনো মিল পাওয়া যায়নি। অন্য কীওয়ার্ড চেষ্টা করুন।',
  kind_subject: 'বিষয়', kind_topic: 'টপিক', kind_deck: 'ডেক', kind_card: 'কার্ড',
  kind_note: 'নোট', kind_countdown: 'কাউন্টডাউন',
  type_min: 'খুঁজতে অন্তত ২টি অক্ষর লিখুন।',
  export_done: 'ব্যাকআপ ডাউনলোড হয়েছে।',
  import_ok: 'ইমপোর্ট সফল — ডেটা প্রতিস্থাপিত হয়েছে।',
  import_bad: 'ইমপোর্ট ব্যর্থ: এটি বৈধ Student OS ব্যাকআপ নয়।',
  confirm_import: 'ইমপোর্ট করলে বর্তমান সব ডেটা প্রতিস্থাপিত হবে। চালিয়ে যাবেন?',
  confirm_clear: 'সব মডিউলের সব ডেটা মুছে ফেলবেন? এটি ফেরানো যাবে না।',
  cleared: 'সব ডেটা মুছে ফেলা হয়েছে।',
  level_up: '🎉 লেভেল আপ! আপনি এখন লেভেল {n}-এ।',
  on: '',
},
};

let lang = 'en';

function setLang(l) { lang = (l === 'bn') ? 'bn' : 'en'; }
function getLang() { return lang; }
function t(key) {
  const d = STRINGS[lang] || STRINGS.en;
  return (d[key] !== undefined) ? d[key] : (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key);
}
/* Localize digits (and only ASCII digits) when lang is bn. */
function n(x) {
  const s = String(x);
  if (lang !== 'bn') return s;
  return s.replace(/[0-9]/g, d => BN_DIGITS[+d]);
}
function fill(s, vars) {
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
}
/* YYYY-MM-DD → localized display, e.g. "12 Oct 2026" / "১২ অক্টো ২০২৬" */
const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BN_MONTHS = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
function fmtDate(ymd) {
  if (!ymd) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const months = lang === 'bn' ? BN_MONTHS : EN_MONTHS;
  return n(+m[3]) + ' ' + months[+m[2] - 1] + ' ' + n(m[1]);
}

const i18nApi = { STRINGS, setLang, getLang, t, n, fill, fmtDate };
if (typeof module !== 'undefined' && module.exports) module.exports = i18nApi;
if (typeof window !== 'undefined') { window.SOS = window.SOS || {}; window.SOS.i18n = i18nApi; }
