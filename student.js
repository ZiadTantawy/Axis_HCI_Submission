'use strict';
/* Student view: home, choose & upload, review pages, status, results, practice, notifications. */

const SUBJECTS = { Mathematics: [{ id: 'fractions', name: 'Fractions Check' }], Science: [] };

/* ---------- shared bits ---------- */
function handwritingBlock(q, small, marks) {
  return `<div class="hw${small ? ' sm' : ''}" lang="${S.stu.lang}"><span class="hw-q">Q${q.n}</span><span class="hw-t">${inkHtml(q, !!marks)}</span></div>`;
}

function pageThumb(p, big) {
  let inner;
  if (p.kind === 'photo' || (p.src && p.kind !== 'pdf')) inner = `<img src="${esc(p.src)}" alt="Uploaded page">`;
  else if (p.kind === 'pdf') inner = `<div class="pdf">${ic('file', 34)}<span>${esc(p.name)}</span></div>`;
  else if (p.content === 1 || p.content === 2) {
    const qs = p.content === 1 ? QS.slice(0, 3) : QS.slice(3);
    inner = `<div class="sheet" lang="${S.stu.lang}"><div class="sheet-h">${S.stu.lang === 'de' ? 'Bruchrechnen' : 'Fractions Check'} · ${STUDENT.name}</div>` +
      qs.map(q => `<div class="sheet-l"><b>${q.n}.</b> ${inkHtml(q, false)}</div>`).join('') + '</div>';
  } else inner = `<div class="sheet"><div class="sheet-h">Extra page</div><div class="sheet-l">&nbsp;</div><div class="sheet-l">&nbsp;</div></div>`;
  const blur = p.blur ? ' blurred' : '';
  return `<div class="thumb${big ? ' big' : ''}${blur}">${inner}</div>`;
}

function progressBars(vals, labels) {
  const max = 100;
  return `<div class="bars" role="img" aria-label="Scores across exams: ${vals.map((v, i) => `${labels[i]} ${v} percent`).join(', ')}">` +
    vals.map((v, i) => `<div class="bar-c"><div class="bar-v">${v}%</div><div class="bar" style="height:${Math.max(8, v / max * 110)}px"></div><div class="bar-l">${esc(labels[i])}</div></div>`).join('') + '</div>';
}
function encourage(vals) {
  if (vals.length < 3) return 'Every exam shows us what to practise next.';
  return vals[2] >= vals[1] ? 'You are growing. Keep going!' : 'This one was tricky. Your practice list will help you grow.';
}

/* ---------- home ---------- */
SCREENS.student.home = () => {
  const st = S.stu.stage;
  const status = st === 'none' ? ['Not uploaded yet', 'grey', 'clock'] : st === 'submitted' ? ['Waiting for teacher review', 'amber', 'clock'] : ['Your result is ready', 'green', 'check'];
  const nts = S.notifs.student.slice(0, 2);
  const vals = PRIOR.map(p => p.pct).concat(S.t.pub ? [S.t.pub.pct] : []);
  const labels = PRIOR.map(p => p.label).concat(S.t.pub ? ['Exam 3'] : []);
  const cta = st === 'none' ? `<button class="btn primary big" data-act="nav" data-arg="exam">${ic('upload')} Upload my exam</button>`
    : st === 'submitted' ? `<button class="btn secondary big" data-act="nav" data-arg="exam">See where my exam is</button>`
      : `<button class="btn primary big" data-act="nav" data-arg="results">${ic('star')} See my results</button>`;
  return `<div class="wrap">
    <h1>Welcome back, ${STUDENT.name}!</h1>
    <div class="grid2">
      <section class="card"><h2>Assigned exam</h2>
        <p class="lead">Mathematics · ${STUDENT.grade}</p><p><strong>Fractions Check</strong></p>
        <p class="muted">Upload due Friday</p>${cta}</section>
      <section class="card"><h2>Submission status</h2>
        <p><span class="chip ${status[1]}">${ic(status[2], 16)} ${status[0]}</span></p>
        <p class="muted">${st === 'none' ? 'Take photos of your pages or upload a file.' : st === 'submitted' ? 'Your teacher is checking your exam. We will tell you when it is ready.' : 'Your teacher has checked your exam.'}</p></section>
    </div>
    <section class="card"><div class="row between"><h2>Notifications</h2><button class="btn ghost" data-act="nav" data-arg="notifs">See all</button></div>
      ${nts.map(n => `<p class="note-row">${ic('bell', 18)}<span>${esc(n.text)}</span></p>`).join('')}</section>
    <section class="card"><h2>My progress across exams</h2>${progressBars(vals, labels)}<p class="muted">${encourage(vals)}</p></section>
  </div>`;
};

/* ---------- choose & upload ---------- */
SCREENS.student.exam = () => {
  if (S.stu.stage !== 'none') return SCREENS.student.status();
  const s = S.stu, exams = SUBJECTS[s.subject] || [];
  const ready = exams.length > 0;
  const subj = Object.keys(SUBJECTS).map(x => `<option ${x === s.subject ? 'selected' : ''}>${x}</option>`).join('');
  const ex = ready ? exams.map(e => `<option value="${e.id}" ${e.id === s.exam ? 'selected' : ''}>${e.name}</option>`).join('') : '<option>No exam assigned yet</option>';
  const langs = ['en', 'de'].map(l => `<label class="seg-r"><input type="radio" name="lang" value="${l}" data-chg="lang" ${s.lang === l ? 'checked' : ''}><span>${LANGNAME[l]}</span></label>`).join('');
  return `<div class="wrap narrow">
    <h1>Choose and upload exam</h1>
    <section class="card form">
      <label for="subject">Subject</label><select id="subject" data-chg="subject">${subj}</select>
      <label for="exam">Assigned exam</label><select id="exam" ${ready ? '' : 'disabled'}>${ex}</select>
      ${ready ? '' : '<p class="hint">Your teacher has not assigned a Science exam yet. Choose Mathematics to continue.</p>'}
      <fieldset class="fs"><legend>Exam language</legend><div class="seg-g">${langs}</div></fieldset>
      <div class="inputs"><h2>Choose input</h2>
        <div class="grid2">
          <button class="btn secondary big" data-act="openScan" ${ready ? '' : 'aria-disabled="true"'}>${ic('camera')} Scan paper</button>
          <button class="btn secondary big" data-act="pickFile" ${ready ? '' : 'aria-disabled="true"'}>${ic('upload')} Upload PDF / images</button>
        </div>
        <p class="muted small">Pages you add will appear on the next step, where we check they are clear.</p></div>
      <button class="btn primary big" data-act="toReview" ${ready ? '' : 'aria-disabled="true"'}>Continue to page review ${ic('arrow')}</button>
    </section></div>`;
};
C.lang = el => { S.stu.lang = el.value; render(); };
C.subject = el => { S.stu.subject = el.value; render(); };
A.toReview = () => go('review');
A.pickFile = () => $('#file').click();
C.file = el => {
  const files = [...el.files];
  if (!files.length) return;
  files.forEach(f => {
    if (f.type === 'application/pdf') S.stu.pages.push({ id: ++S.stu.pid, kind: 'pdf', name: f.name, blur: false, kept: false });
    else if (f.type.startsWith('image/')) S.stu.pages.push({ id: ++S.stu.pid, kind: 'photo', src: URL.createObjectURL(f), blur: false, kept: false });
  });
  el.value = '';
  toast(files.length + (files.length === 1 ? ' page added.' : ' pages added.'));
  go('review');
};

/* scan (simulated camera) */
A.openScan = () => {
  openModal({
    title: 'Scan paper',
    body: `<div class="viewfinder" aria-hidden="true"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><span>Fit the whole page inside the corners</span></div>
      <ul class="tips"><li>Hold the camera steady</li><li>Make sure there is enough light</li><li>Keep all four corners in the picture</li></ul>
      <p class="muted small">Prototype: the camera is simulated. Each tap adds a sample page.</p>
      <p id="scan-count" class="muted" role="status">${S.stu.pages.length} pages so far</p>`,
    actions: [{ label: 'Take photo', act: 'capture', kind: 'primary' }, { label: 'Done', act: 'scanDone' }]
  });
};
A.capture = () => {
  S.stu.captures++;
  const c = S.stu.captures;
  S.stu.pages.push({ id: ++S.stu.pid, kind: 'sample', content: c <= 2 ? c : 3, blur: c === 2, kept: false });
  const n = $('#scan-count'); if (n) n.textContent = S.stu.pages.length + ' pages so far';
};
A.scanDone = () => { closeModal(true); go('review'); };

/* ---------- review pages ---------- */
SCREENS.student.review = () => {
  if (S.stu.stage !== 'none') return SCREENS.student.status();
  const s = S.stu, pages = s.pages;
  s.sel = clamp(s.sel, 0, Math.max(0, pages.length - 1));
  const blurry = pages.filter(p => p.blur && !p.kept);
  const cards = pages.map((p, i) => {
    const bad = p.blur && !p.kept;
    return `<button class="pg${i === s.sel ? ' on' : ''}" data-act="selPage" data-arg="${i}" aria-pressed="${i === s.sel}" aria-label="Page ${i + 1}${bad ? ', may be blurry' : ''}">
      ${pageThumb(p)}<span class="pg-n">Page ${i + 1}</span>
      <span class="chip ${bad ? 'amber' : 'green'}">${bad ? ic('warn', 14) + ' May be blurry' : ic('check', 14) + (p.blur ? ' Kept' : ' Looks good')}</span></button>`;
  }).join('');
  const first = blurry[0];
  const fi = first ? pages.indexOf(first) + 1 : 0;
  const alert = first ? `<div class="banner amber" role="alert">${ic('warn')}<div><strong>Quality check: Page ${fi} may be blurry.</strong><br>Retake it or keep this page.
      <div class="row gap"><button class="btn secondary" data-act="retake" data-arg="${pages.indexOf(first)}">${ic('camera', 18)} Retake page ${fi}</button><button class="btn ghost" data-act="keepPage" data-arg="${pages.indexOf(first)}">Keep this page</button></div></div></div>` : '';
  const empty = !pages.length;
  const canSubmit = !empty && !blurry.length;
  const why = empty ? 'Add at least one page to continue.' : blurry.length ? `Retake or keep page ${fi} to continue.` : '';
  return `<div class="wrap">
    <button class="btn ghost" data-act="nav" data-arg="exam">${ic('back', 18)} Back</button>
    <h1>Review exam pages</h1>
    ${alert}
    <section class="card">
      <div class="pages">${cards}
        <button class="pg add" data-act="addPage" aria-label="Add page">${ic('plus', 30)}<span class="pg-n">Add page</span></button></div>
      ${empty ? '<p class="muted">No pages yet. Add a page with the camera or upload a file.</p>' : ''}
      <div class="row gap wrapr" role="group" aria-label="Page tools for page ${s.sel + 1}">
        <button class="btn secondary" data-act="movePage" data-arg="-1" ${empty || s.sel === 0 ? 'aria-disabled="true"' : ''}>Move earlier</button>
        <button class="btn secondary" data-act="movePage" data-arg="1" ${empty || s.sel >= pages.length - 1 ? 'aria-disabled="true"' : ''}>Move later</button>
        <button class="btn secondary" data-act="retake" data-arg="${s.sel}" ${empty ? 'aria-disabled="true"' : ''}>${ic('camera', 18)} Retake</button>
        <button class="btn secondary" data-act="removePage" data-arg="${s.sel}" ${empty ? 'aria-disabled="true"' : ''}>${ic('trash', 18)} Remove</button>
      </div>
    </section>
    <div class="row gap wrapr sticky-actions">
      <button class="btn secondary big" data-act="previewAll" ${empty ? 'aria-disabled="true"' : ''}>${ic('eye')} Preview all pages</button>
      <button class="btn primary big" data-act="submitPaper" ${canSubmit ? '' : 'aria-disabled="true"'}>Submit paper ${ic('arrow')}</button>
    </div>
    ${why ? `<p class="hint" role="status">${why}</p>` : ''}
  </div>`;
};
A.selPage = el => { S.stu.sel = +el.dataset.arg; render(); };
A.keepPage = el => { S.stu.pages[+el.dataset.arg].kept = true; render(); toast('Page kept.'); };
A.retake = el => {
  const p = S.stu.pages[+el.dataset.arg];
  if (!p) return;
  p.blur = false; p.kept = false;
  if (p.kind === 'photo' || p.kind === 'pdf') { p.kind = 'sample'; p.content = 3; }
  render(); toast('Page retaken. It looks good now.');
};
A.movePage = el => {
  const i = S.stu.sel, j = i + (+el.dataset.arg), ps = S.stu.pages;
  if (j < 0 || j >= ps.length) return;
  [ps[i], ps[j]] = [ps[j], ps[i]]; S.stu.sel = j; render();
  toast('Page moved to position ' + (j + 1) + '.');
};
A.removePage = el => {
  const i = +el.dataset.arg;
  openModal({
    title: 'Remove this page?',
    body: `<p>Page ${i + 1} will be taken out of your exam. You can add it again later.</p>`,
    actions: [{ label: 'Remove page', act: 'confirmRemove', arg: i, kind: 'primary' }, { label: 'Keep it', act: 'closeModal' }]
  });
};
A.confirmRemove = el => { S.stu.pages.splice(+el.dataset.arg, 1); closeModal(true); render(); toast('Page removed.'); };
A.addPage = () => openModal({
  title: 'Add a page',
  body: '<div class="grid2"><button class="btn secondary big" data-act="openScan">' + ic('camera') + ' Scan paper</button><button class="btn secondary big" data-act="pickFile">' + ic('upload') + ' Upload file</button></div>'
});
A.previewAll = () => {
  const ps = S.stu.pages;
  openModal({
    wide: true, title: 'Preview all pages',
    body: `<p class="muted">Is every page easy to read? Check that nothing is cut off.</p><div class="preview">${ps.map((p, i) => `<figure>${pageThumb(p, true)}<figcaption>Page ${i + 1}</figcaption></figure>`).join('')}</div>`,
    actions: [{ label: 'Back to pages', act: 'closeModal' }, { label: 'Submit paper', act: 'submitPaper', kind: 'primary' }]
  });
};
A.submitPaper = () => {
  const ps = S.stu.pages;
  if (!ps.length || ps.some(p => p.blur && !p.kept)) { closeModal(true); toast('Please retake or keep the blurry page first.'); render(); return; }
  S.stu.stage = 'submitted';
  S.notifs.student.unshift({ id: Date.now(), text: 'Your exam was sent. We will tell you when feedback is ready.', read: true, time: 'Just now' });
  closeModal(true);
  go('status');
  toast('Exam submitted. Well done!');
};

/* ---------- status ---------- */
SCREENS.student.status = () => {
  const st = S.stu.stage;
  const checking = st === 'submitted' && verifiedCount() > 0;
  const steps = [
    ['Sent', 'Your exam is with your teacher.', true],
    ['Teacher is checking', 'Your teacher reads your answers and adds feedback.', st === 'published' || checking || st === 'submitted'],
    ['Result ready', 'You can see your grade and feedback.', st === 'published']
  ];
  const cur = st === 'published' ? 2 : checking ? 1 : 0;
  return `<div class="wrap narrow"><h1>Where is my exam?</h1>
    <section class="card"><ol class="steps">${steps.map((x, i) => `<li class="${i < cur ? 'done' : i === cur ? 'now' : ''}"><span class="dot">${i < cur || (i === cur && st === 'published') ? ic('check', 16) : i + 1}</span><div><strong>${x[0]}</strong><br><span class="muted">${x[1]}</span></div></li>`).join('')}</ol>
      ${st === 'published' ? `<button class="btn primary big" data-act="nav" data-arg="results">${ic('star')} See my results</button>` : '<p class="muted">We will send you a notification when it is ready.</p>'}</section>
    <section class="card"><h2>What I sent</h2><div class="pages sm">${S.stu.pages.map((p, i) => `<div class="pg static">${pageThumb(p)}<span class="pg-n">Page ${i + 1}</span></div>`).join('')}</div></section></div>`;
};

/* ---------- results (teacher-confirmed only) ---------- */
SCREENS.student.results = () => {
  const p = S.t.pub;
  if (S.stu.stage !== 'published' || !p) {
    return `<div class="wrap narrow"><h1>My results</h1><section class="card center">${ic('lock', 36)}
      <p class="lead">Your results are not ready yet.</p>
      <p class="muted">${S.stu.stage === 'none' ? 'Upload your exam first.' : 'Your teacher is still checking your exam. We will tell you when it is ready.'}</p>
      <button class="btn secondary" data-act="nav" data-arg="${S.stu.stage === 'none' ? 'exam' : 'home'}">${S.stu.stage === 'none' ? 'Upload my exam' : 'Back to home'}</button></section></div>`;
  }
  const vals = PRIOR.map(x => x.pct).concat([p.pct]);
  const labels = PRIOR.map(x => x.label).concat(['Exam 3']);
  return `<div class="wrap">
    <h1>My results</h1>
    <section class="card grade"><div><span class="muted">Teacher-confirmed grade</span><div class="big-n">${p.pct}%</div><span class="muted">${p.pts} out of ${p.max}</span></div>${ic('check', 40)}</section>
    <section class="card"><h2>Feedback</h2><p class="lead">${esc(p.fb)}</p>${p.support ? `<p class="support">${ic('user', 18)} ${esc(p.support)}</p>` : ''}</section>
    <div class="grid2">
      <section class="card"><h2>My revision list</h2>${p.practice.length ? `<ol class="plain">${p.practice.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '<p class="muted">Nothing to add this time.</p>'}</section>
      <section class="card"><h2>Class common mistakes</h2>${p.patterns.length ? p.patterns.map(x => `<div class="pat"><strong>${esc(x.title)}</strong><p class="muted">${esc(x.explain)}</p></div>`).join('') : '<p class="muted">Your teacher has not added any yet.</p>'}
        <p class="small muted">${ic('shield', 14)} These are shared without names or answers.</p></section>
    </div>
    <section class="card"><h2>My progress</h2>${progressBars(vals, labels)}<p class="muted">${encourage(vals)}</p></section>
    <button class="btn primary big" data-act="nav" data-arg="practice">Choose a skill to practise next ${ic('arrow')}</button>
  </div>`;
};

SCREENS.student.practice = () => {
  const p = S.t.pub;
  const items = p ? p.practice : [];
  const done = items.filter(x => S.practiced[x]).length;
  return `<div class="wrap narrow"><button class="btn ghost" data-act="nav" data-arg="results">${ic('back', 18)} Back to results</button>
    <h1>Practise next</h1>
    <section class="card">${items.length ? `<p class="lead">${done} of ${items.length} skills practised</p><ul class="practice">${items.map((x, i) => `<li><span>${esc(x)}</span><button class="btn ${S.practiced[x] ? 'green' : 'secondary'}" data-act="practised" data-arg="${i}" aria-pressed="${!!S.practiced[x]}">${S.practiced[x] ? ic('check', 18) + ' Practised' : 'Mark as practised'}</button></li>`).join('')}</ul>` : '<p class="muted">Your practice list will appear here after your teacher confirms your result.</p>'}</section></div>`;
};
A.practised = el => {
  const x = S.t.pub.practice[+el.dataset.arg];
  S.practiced[x] = !S.practiced[x];
  render();
  if (S.practiced[x]) toast('Great work. Keep it up!');
};

/* ---------- notifications ---------- */
SCREENS.student.notifs = () => `<div class="wrap narrow"><h1>Notifications</h1><section class="card">
  ${S.notifs.student.length ? S.notifs.student.map(n => `<div class="note-row big-row">${ic('bell', 20)}<div><span>${esc(n.text)}</span><br><span class="muted small">${esc(n.time)}</span></div>${S.newIds.includes(n.id) ? '<span class="chip blue">New</span>' : ''}</div>`).join('') : '<p class="muted">Nothing new.</p>'}</section></div>`;
