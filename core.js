'use strict';
/* Core: state, helpers, routing, modals, toasts, event delegation. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const ICONS = {
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 19h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  bell: '<path d="M6 17v-6a6 6 0 0112 0v6l1.5 2h-15zM10 21h4"/>',
  chart: '<path d="M5 19V9M12 19V5M19 19v-7"/>',
  book: '<path d="M5 5h6a2 2 0 012 2v12a2 2 0 00-2-2H5zM19 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z"/>',
  flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  star: '<path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z"/>',
  warn: '<path d="M12 4l9 16H3zM12 10v4M12 17v.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  home: '<path d="M4 11l8-7 8 7v9H4zM10 20v-6h4v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  file: '<path d="M7 3h7l4 4v14H7zM14 3v4h4"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18 14.8c2 .6 3.5 2.3 3.5 5.2"/>',
  scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M7 12h10"/>',
  circleCheck: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/>',
  trend: '<path d="M4 17l5-5 4 4 7-8M15 8h5v5"/>',
  chat: '<path d="M5 5h14a1 1 0 011 1v10a1 1 0 01-1 1h-8l-4 3v-3H5a1 1 0 01-1-1V6a1 1 0 011-1z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2.2 2.2L15 10"/>'
};
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* Localised value: objects keyed by 'en' / 'de'. */
const L = (x, l) => (x && typeof x === 'object') ? x[l || S.stu.lang] : x;
const LANGNAME = { en: 'English', de: 'German' };

/* ---------- state ---------- */
function fresh() {
  return {
    role: 'student',
    screen: { student: 'home', teacher: 'queue', parent: 'home' },
    stu: { subject: 'Mathematics', exam: 'fractions', lang: 'de', pages: [], stage: 'none', captures: 0, pid: 0, sel: 0 },
    /* Student notifications: link opens a screen. Parent thread: from = teacher | parent | system. */
    notifs: {
      student: [{ id: 1, text: 'Your feedback for Exam 2 is ready.', read: true, time: 'Last week' }],
      parent: [{ id: 1, from: 'teacher', text: 'Welcome to Grade 4A! I will post Lina’s results here after I check them.', read: true, time: 'Last week' }]
    },
    newIds: [],
    practiced: {},
    t: null
  };
}
function initTeacher() {
  const rubric = {}, ver = {};
  QS.forEach(q => {
    rubric[q.id] = q.crit.map(c => ({ ...c }));
    ver[q.id] = { sel: 0, confirmed: false, customText: '', customMark: 0 };
  });
  S.t = {
    ver, rubric, idx: 0, bulk: {}, over: {},
    fb: DEFAULT_FEEDBACK, support: DEFAULT_SUPPORT, practice: [...DEFAULT_PRACTICE],
    marksOk: false, fbOk: false, dec: {}, patReviewed: false, pat: { p1: false, p2: false },
    paused: null, pub: null
  };
  QS.filter(q => q.conf >= 90).forEach(q => { S.t.bulk[q.id] = true; });
}
let S = fresh();
initTeacher();

/* ---------- grading helpers ---------- */
const rub = q => S.t.rubric[q.id];
const maxM = q => rub(q).reduce((a, c) => a + c.m, 0);
const metM = (q, met) => met.reduce((a, i) => a + (rub(q)[i] ? rub(q)[i].m : 0), 0);
function rMark(q, sel) {
  const v = S.t.ver[q.id];
  return sel === 'custom' ? Math.min(maxM(q), v.customMark) : metM(q, q.cands[sel].met);
}
function qMark(q) {
  if (S.t.over[q.id] != null) return clamp(S.t.over[q.id], 0, maxM(q));
  return rMark(q, S.t.ver[q.id].sel);
}
const totalMax = () => QS.reduce((a, q) => a + maxM(q), 0);
const total = () => QS.reduce((a, q) => a + qMark(q), 0);
const totalIf = (q, sel) => QS.reduce((a, x) => a + (x.id === q.id ? rMark(q, sel) : qMark(x)), 0);
function impact(q) {
  const m = q.cands.map((c, i) => rMark(q, i));
  return Math.max(...m) - Math.min(...m);
}
const uncertain = () => QS.filter(q => q.conf < 90).sort((a, b) => impact(b) - impact(a) || a.conf - b.conf);
const highConf = () => QS.filter(q => q.conf >= 90);
const allVerified = () => QS.every(q => S.t.ver[q.id].confirmed);
const verifiedCount = () => QS.filter(q => S.t.ver[q.id].confirmed).length;
const selFull = q => {
  const v = S.t.ver[q.id];
  return v.sel === 'custom' ? (v.customText || '(teacher-entered reading)') : L(q.cands[v.sel].full);
};
const inkHtml = (q, mark = true) =>
  esc(L(q.ink)).replace(/\[\[(.+?)\]\]/g, mark ? '<mark class="unc">$1</mark>' : '$1');
const impactLabel = n => n >= 2 ? 'High impact' : n === 1 ? 'Medium impact' : 'No effect on marks';

/* Learning gaps are computed from VERIFIED answers only. A gap only raises a red flag
   when the same mistake repeats across exams; a first-time mistake is a gap without a flag. */
function gaps() {
  if (!allVerified()) return [];
  const q4 = QS[3], q6 = QS[5];
  const arr = [{
    id: 'g1', title: 'Compares fractions using only the top numbers', skill: 'Fractions',
    flagged: true, flag: 'Needs extra support in fractions',
    why: `Same mistake in ${HISTORY.length + 1} exams.`,
    ev: [
      ...HISTORY.map(h => ({ lab: h.exam, txt: h.text })),
      { lab: 'This exam · Q6', txt: L(q6.cands[0].full), now: true }
    ]
  }];
  if (qMark(q4) < maxM(q4)) {
    arr.push({
      id: 'g2', title: 'Mixes up numerator and denominator', skill: 'Naming the denominator',
      flagged: false, why: 'First time, so no flag is suggested.',
      ev: [{ lab: 'This exam · Q4 (reading you confirmed)', txt: selFull(q4), now: true }]
    });
  }
  return arr;
}
const confirmedGaps = () => gaps().filter(g => S.t.dec[g.id] && S.t.dec[g.id].s === 'confirmed');

/* ---------- routing ---------- */
const SCREENS = { student: {}, teacher: {}, parent: {} };
const NAV = {
  student: [['home', 'Home', 'home'], ['exam', 'My exam', 'pencil'], ['results', 'Results', 'star'], ['notifs', 'Notifications', 'bell']],
  teacher: [['queue', 'Class set', 'users'], ['verify', 'Verify OCR', 'scan'], ['finalize', 'Finalize', 'circleCheck'], ['insights', 'Class insights', 'chart']],
  parent: [['home', 'Progress', 'trend'], ['messages', 'Messages', 'chat']]
};
const ROLENAME = { student: 'Student', teacher: 'Teacher', parent: 'Parent' };

function unreadCount(role) {
  const k = role === 'parent' ? 'parent' : 'student';
  return S.notifs[k].filter(n => !n.read).length;
}

const roleSwitch = () => `<div class="seg" role="group" aria-label="Prototype: switch between views">${['student', 'teacher', 'parent'].map(x =>
  `<button class="seg-b${x === S.role ? ' on' : ''}" data-act="role" data-arg="${x}" aria-pressed="${x === S.role}">${ROLENAME[x]}</button>`).join('')}</div>`;

/* Student: header + bottom tab bar (phone pattern). Teacher and parent: left sidebar (laptop pattern). */
function topbar() {
  const r = S.role, cur = S.screen[r];
  const tabs = NAV[r].map(([id, label, icon]) => {
    const active = (r === 'student' && id === 'exam' && ['exam', 'review', 'status'].includes(cur)) || (r === 'student' && id === 'results' && cur === 'practice') || cur === id;
    const n = ((r === 'student' && id === 'notifs') || (r === 'parent' && id === 'messages')) ? unreadCount(r) : 0;
    const badge = n ? `<span class="badge" aria-label="${n} unread">${n}</span>` : '';
    const cur_ = active ? 'aria-current="page"' : '';
    return r === 'student'
      ? `<button class="tab${active ? ' on' : ''}" data-act="nav" data-arg="${id}" ${cur_}><span class="pill">${ic(icon, 20)}${badge}</span><span>${label}</span></button>`
      : `<button class="tab${active ? ' on' : ''}" data-act="nav" data-arg="${id}" ${cur_}>${ic(icon, 20)}<span>${label}</span>${badge}</button>`;
  }).join('');
  const brand = `<div class="brand"><span class="logo" aria-hidden="true">A</span><span>Axis</span><span class="role-chip">${ROLENAME[r]}</span></div>`;
  if (r === 'student') {
    return `<div class="tb-in">${brand}<div class="tb-r">${roleSwitch()}<span class="avatar" aria-label="Signed in as ${STUDENT.name}">${STUDENT.name[0]}</span></div></div>
      <nav class="tabbar" aria-label="Student navigation">${tabs}</nav>`;
  }
  const who = r === 'teacher' ? TEACHER : PARENT;
  const sec = r === 'teacher' ? `Grade ${STUDENT.cls} · Mathematics` : `My child · ${STUDENT.name}, ${STUDENT.cls}`;
  return `<div class="side-in">${brand}
      <div class="side-sec">${sec}</div>
      <nav class="vtabs" aria-label="${ROLENAME[r]} navigation">${tabs}</nav>
      <div class="side-foot">
        <div class="profile"><span class="avatar solid" aria-hidden="true">${who.initials}</span><div><strong>${who.name}</strong><span>${who.role}</span></div></div>
        <div class="side-sec">Prototype · view as</div>${roleSwitch()}
      </div></div>`;
}

function render(nav) {
  const ae = document.activeElement;
  let key = null;
  if (!nav && ae && ae !== document.body && $('#main').contains(ae)) {
    key = { id: ae.id, act: ae.dataset && ae.dataset.act, arg: ae.dataset && ae.dataset.arg, ss: ae.selectionStart, se: ae.selectionEnd };
  }
  document.body.dataset.role = S.role;
  document.body.classList.toggle('has-side', S.role !== 'student');
  $('#topbar').innerHTML = topbar();
  const fn = SCREENS[S.role][S.screen[S.role]] || SCREENS[S.role][Object.keys(SCREENS[S.role])[0]];
  $('#main').innerHTML = fn();
  if (key) {
    let n = key.id ? document.getElementById(key.id) : null;
    if (!n && key.act) n = $(`#main [data-act="${key.act}"][data-arg="${key.arg === undefined ? '' : key.arg}"]`) || (key.arg === undefined ? $(`#main [data-act="${key.act}"]`) : null);
    if (n) {
      n.focus({ preventScroll: true });
      if (key.ss != null && n.setSelectionRange) { try { n.setSelectionRange(key.ss, key.se); } catch (e) { /* not a text field */ } }
    }
  }
  if (nav) { window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); }
}

function go(screen, role) {
  if (role) S.role = role;
  S.screen[S.role] = screen;
  if (S.role === 'student' && screen === 'notifs') {
    S.newIds = S.notifs.student.filter(n => !n.read).map(n => n.id);
    S.notifs.student.forEach(n => { n.read = true; });
  }
  if (S.role === 'parent' && screen === 'messages') {
    S.newIds = S.notifs.parent.filter(n => !n.read).map(n => n.id);
    S.notifs.parent.forEach(n => { n.read = true; });
  }
  try { history.replaceState(null, '', '#' + S.role + '/' + screen); } catch (e) { /* file:// restrictions */ }
  render(true);
}

/* ---------- toast & modal ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
}

let lastFocus = null;
function openModal({ title, body, actions = [], wide = false }) {
  closeModal(true);
  lastFocus = document.activeElement;
  const foot = actions.map(a =>
    `<button class="btn ${a.kind || 'secondary'}" data-act="${a.act}" ${a.arg !== undefined ? `data-arg="${esc(a.arg)}"` : ''}>${esc(a.label)}</button>`).join('');
  $('#modal-root').innerHTML = `<div class="overlay" data-act="overlay">
    <div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <div class="m-head"><h2 id="m-title">${esc(title)}</h2><button class="icon-btn" data-act="closeModal" aria-label="Close">${ic('x')}</button></div>
      <div class="m-body">${body}</div>
      ${foot ? `<div class="m-foot">${foot}</div>` : ''}
    </div></div>`;
  const first = $('#modal-root .m-body input, #modal-root .m-body textarea, #modal-root .m-foot .btn.primary, #modal-root .m-foot .btn');
  (first || $('#modal-root .icon-btn')).focus();
}
function closeModal(silent) {
  const had = $('#modal-root').innerHTML !== '';
  $('#modal-root').innerHTML = '';
  if (had && !silent && lastFocus && document.contains(lastFocus)) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
}

/* ---------- event delegation ---------- */
const A = {}, C = {}, I = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'overlay' && e.target !== el) return;
  if (el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
  const f = A[el.dataset.act];
  if (f) f(el, e);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-chg]');
  if (el && C[el.dataset.chg]) C[el.dataset.chg](el, e);
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-inp]');
  if (el && I[el.dataset.inp]) I[el.dataset.inp](el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#modal-root').innerHTML) { closeModal(); return; }
  if (e.key === 'Tab' && $('#modal-root').innerHTML) {
    const f = $$('#modal-root button, #modal-root input, #modal-root textarea, #modal-root select');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  if (typeof verifyKeys === 'function') verifyKeys(e);
});

A.closeModal = () => closeModal();
A.overlay = () => closeModal();
A.nav = el => go(el.dataset.arg);
A.role = el => go(S.screen[el.dataset.arg], el.dataset.arg);

/* ---------- demo tools ---------- */
function demoPanel() {
  return `<div class="demo-head"><strong>Demo tools</strong><button class="icon-btn" data-act="demoToggle" aria-label="Close demo tools">${ic('x', 16)}</button></div>
    <p class="muted small">Shortcuts for presenting or testing. Not part of the product UI.</p>
    <div class="lbl">View as</div>${roleSwitch()}
    <button class="btn secondary block" data-act="seedSubmitted">Skip: Lina has submitted her exam</button>
    <button class="btn secondary block" data-act="seedPublished">Skip: teacher finished, result published</button>
    <button class="btn ghost block" data-act="reset">Reset demo</button>`;
}
A.demoToggle = () => {
  const p = $('#demo-panel');
  p.hidden = !p.hidden;
  $('#demo-btn').setAttribute('aria-expanded', String(!p.hidden));
  if (!p.hidden) { p.innerHTML = demoPanel(); }
};
A.reset = () => { S = fresh(); initTeacher(); $('#demo-panel').hidden = true; closeModal(true); go('home', 'student'); toast('Demo reset.'); };
function seedSubmitted() {
  if (S.stu.stage === 'none') {
    S.stu.pages = [
      { id: ++S.stu.pid, kind: 'sample', content: 1, blur: false, kept: false },
      { id: ++S.stu.pid, kind: 'sample', content: 2, blur: false, kept: false }
    ];
    S.stu.stage = 'submitted';
    S.notifs.student.unshift({ id: Date.now(), text: 'Your exam was sent. We will tell you when feedback is ready.', read: false, time: 'Just now' });
  }
}
A.seedSubmitted = () => { seedSubmitted(); $('#demo-panel').hidden = true; go('queue', 'teacher'); toast('Lina has submitted. You are in the teacher view.'); };
A.seedPublished = () => {
  seedSubmitted();
  QS.forEach(q => { S.t.ver[q.id].confirmed = true; });
  S.t.marksOk = true; S.t.fbOk = true; S.t.patReviewed = true; S.t.pat = { p1: true, p2: true };
  S.t.dec.g1 = { s: 'confirmed' };
  doPublish(true);
  $('#demo-panel').hidden = true;
  go('results', 'student');
  toast('Result published. You are in the student view.');
};
