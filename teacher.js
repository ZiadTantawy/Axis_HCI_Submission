'use strict';
/* Teacher view (queue, OCR verification, finalize, class insights) and parent view. */

const waitingCard = () => `<div class="wrap narrow"><section class="card center">${ic('clock', 36)}
  <p class="lead">Waiting for Lina to upload her exam</p>
  <p class="muted">You will see the submission here as soon as she sends it.</p>
  <button class="btn secondary" data-act="nav" data-arg="queue">Back to class set</button></section></div>`;

const unverifiedCard = () => `<div class="wrap narrow"><section class="card center">${ic('lock', 36)}
  <p class="lead">Verify the readings first</p>
  <p class="muted">Grading, learning gaps and flags only use answers you have verified. ${QS.length - verifiedCount()} of ${QS.length} answers are still unverified.</p>
  <button class="btn primary" data-act="nav" data-arg="verify">${ic('eye', 18)} Go to OCR verification</button></section></div>`;

const fmt = (a, b) => `${a}/${b} (${pct(a, b)}%)`;
const marksWord = n => n === 1 ? '1 mark' : `${n} marks`;

/* ---------- class set queue ---------- */
function linaStatus() {
  const st = S.stu.stage;
  if (st === 'none') return ['Waiting for upload', 'grey'];
  if (st === 'published') return ['Published', 'green'];
  if (allVerified()) return ['Verified · ready to finalize', 'teal'];
  const c = verifiedCount();
  return c ? [`OCR review in progress (${c} of ${QS.length} verified)`, 'purple'] : ['Needs OCR review', 'amber'];
}
SCREENS.teacher.queue = () => {
  const ls = linaStatus();
  const can = S.stu.stage !== 'none';
  const rows = [{ name: STUDENT.name, status: ls[0], tone: ls[1], live: true }, ...MOCK_CLASS].map(r => `<tr>
    <th scope="row">${r.name}${r.live ? '' : ' <span class="muted small">(sample)</span>'}</th>
    <td><span class="chip ${r.tone}">${r.status}</span></td>
    <td class="ta-r">${r.live ? `<button class="btn ${can ? 'purple' : 'secondary'}" data-act="openLina" ${can ? '' : 'aria-disabled="true"'}>${S.stu.stage === 'published' ? 'View' : 'Open'}</button>` : '<span class="muted small">Prototype: sample row</span>'}</td></tr>`).join('');
  const done = (S.stu.stage === 'published' ? 1 : 0) + 1;
  const p = S.t.paused;
  return `<div class="wrap">
    <h1>Grade 4A · Fractions Check</h1>
    <p class="muted">Mathematics · ${LANGNAME[S.stu.lang]} exam · ${done} of 5 published</p>
    ${p ? `<div class="banner teal" role="status">${ic('pause')}<div><strong>Class set paused.</strong> You stopped while checking Lina's answers. Your place is saved.
      <div class="row gap"><button class="btn teal" data-act="resume">${ic('arrow', 18)} Resume where I left off</button></div></div></div>` : ''}
    <section class="card"><h2>Submission queue</h2>
      <div class="tscroll"><table class="tbl"><thead><tr><th scope="col">Student</th><th scope="col">Status</th><th scope="col"><span class="sr">Action</span></th></tr></thead><tbody>${rows}</tbody></table></div>
      ${can ? '' : '<p class="hint">Lina has not uploaded yet. Switch to the Student view to upload, or use Demo tools to skip ahead.</p>'}
    </section>
    <section class="card"><h2>How you stay in control</h2><ul class="plain tight">
      <li>Uncertain readings come first, ranked by how much they could change the grade.</li>
      <li>The child's original handwriting always stays next to the extracted text.</li>
      <li>Students only see what you confirm and publish.</li></ul></section>
  </div>`;
};
A.openLina = () => go(allVerified() ? 'finalize' : 'verify');
A.resume = () => { const p = S.t.paused; S.t.paused = null; S.t.idx = p.idx || 0; go(p.screen); toast('Welcome back. Your place was saved.'); };

/* ---------- OCR verification ---------- */
SCREENS.teacher.verify = () => {
  if (S.stu.stage === 'none') return waitingCard();
  const unc = uncertain(), n = unc.length;
  S.t.idx = clamp(S.t.idx, 0, n);
  const idx = S.t.idx;
  const left = unc.filter(q => !S.t.ver[q.id].confirmed).length;
  const hl = highConf(), hlDone = hl.every(q => S.t.ver[q.id].confirmed);
  const rail = unc.map((q, i) => {
    const ok = S.t.ver[q.id].confirmed;
    return `<li><button class="rail-b${i === idx ? ' on' : ''}" data-act="goIdx" data-arg="${i}" ${i === idx ? 'aria-current="step"' : ''}>
      <span class="rail-n">${ok ? ic('check', 16) : i + 1}</span>
      <span><strong>Question ${q.n}</strong><br><span class="small muted">${impactLabel(impact(q))} · ${q.conf}% sure</span></span>
      <span class="chip ${ok ? 'green' : 'amber'} sm">${ok ? 'Confirmed' : 'To review'}</span></button></li>`;
  }).join('') + `<li><button class="rail-b${idx === n ? ' on' : ''}" data-act="goIdx" data-arg="${n}" ${idx === n ? 'aria-current="step"' : ''}>
      <span class="rail-n">${hlDone ? ic('check', 16) : n + 1}</span>
      <span><strong>High-confidence readings</strong><br><span class="small muted">${hl.length} answers</span></span>
      <span class="chip ${hlDone ? 'green' : 'grey'} sm">${hlDone ? 'Approved' : left ? 'After the rest' : 'To approve'}</span></button></li>`;
  return `<div class="wrap wide">
    <div class="row between wrapr"><div><h1>Verify extracted answers</h1>
      <p class="muted">${STUDENT.name} · Fractions Check · ${LANGNAME[S.stu.lang]} exam</p></div>
      <div class="prog" role="status"><strong>${verifiedCount()} of ${QS.length}</strong> answers verified<div class="meter"><i style="width:${pct(verifiedCount(), QS.length)}%"></i></div></div></div>
    <p class="banner grey only-mobile">${ic('warn')}<span>Detailed OCR correction is easier on a laptop. You can review on your phone, but a larger screen shows the handwriting better.</span></p>
    <div class="vgrid"><aside aria-label="Review order"><h2 class="small-h">Review order</h2><ol class="rail">${rail}</ol>
      <div class="row gap"><button class="btn ghost" data-act="pauseSet">${ic('pause', 18)} Save and pause</button></div></aside>
      <section class="vmain" aria-live="polite">${idx < n ? verifyCard(unc[idx], idx, n) : bulkCard(left)}</section></div></div>`;
};

function verifyCard(q, i, n) {
  const v = S.t.ver[q.id], sel = v.sel, imp = impact(q), mx = totalMax();
  const tot = totalIf(q, sel), base = totalIf(q, 0), changed = sel !== 0 && tot !== base;
  const cands = q.cands.map((c, ci) => {
    const m = rMark(q, ci);
    return `<div class="cand${sel === ci ? ' on' : ''}"><input type="radio" id="cand-${ci}" name="cand" value="${ci}" data-chg="cand" ${sel === ci ? 'checked' : ''}>
      <label for="cand-${ci}"><span class="cv">${esc(L(c.v))}</span>${c.note ? `<span class="cn">${esc(L(c.note))}</span>` : ''}
        <span class="cm">${marksWord(m)}</span><span class="ct">Paper total ${totalIf(q, ci)}/${mx}</span><span class="cp">${c.p}% likely${ci === 0 ? ' · first guess' : ''}</span>
        <span class="key" aria-hidden="true">${ci + 1}</span></label></div>`;
  }).join('');
  const custom = `<div class="cand${sel === 'custom' ? ' on' : ''}"><input type="radio" id="cand-custom" name="cand" value="custom" data-chg="cand" ${sel === 'custom' ? 'checked' : ''}>
      <label for="cand-custom"><span class="cv">Other</span><span class="cn">Type what the child wrote</span></label></div>`;
  const customBox = sel === 'custom' ? `<div class="custom"><label for="customText">Correct text</label><input id="customText" data-inp="customText" value="${esc(v.customText)}" placeholder="Type the reading exactly as written">
      <label for="customMark">Marks for this reading</label><select id="customMark" data-chg="customMark">${Array.from({ length: maxM(q) + 1 }, (_, k) => `<option value="${k}" ${k === v.customMark ? 'selected' : ''}>${marksWord(k)}</option>`).join('')}</select></div>` : '';
  const tone = imp >= 2 ? 'amber' : imp === 1 ? 'blue' : 'grey';
  return `<div class="banner ${tone}">${ic(imp ? 'flag' : 'clock')}<div><strong>Priority: ${impactLabel(imp)}</strong> · Question ${q.n} of ${QS.length} · review ${i + 1} of ${n}
      ${imp === 0 ? '<br><span class="small">No reading here changes a mark, so this is low priority. You can accept the first guess.</span>' : ''}</div></div>
    <div class="card"><p class="qprompt" lang="${S.stu.lang}"><span class="muted small">Question ${q.n}</span><br>${esc(L(q.prompt))}</p>
      <div class="grid2 side">
        <div class="panel"><h3>Original handwriting <span class="chip grey sm">always shown</span></h3>${handwritingBlock(q, false, true)}<p class="small muted">The dashed box is the part the system is unsure about.</p></div>
        <div class="panel"><h3>Extracted answer ${v.confirmed ? '<span class="chip green sm">Confirmed</span>' : ''}</h3>
          <div class="ext" id="extractedText" lang="${S.stu.lang}">${esc(sel === 'custom' ? (v.customText || '…') : L(q.cands[sel].full))}</div>
          <p class="small muted">System confidence: ${q.conf}%</p>
          ${sel === 'custom' ? '' : `<button class="btn ghost" data-act="customOn">${ic('pencil', 16)} Correct text</button>`}</div></div>
      <h3>Candidate readings and mark effect</h3>
      <fieldset class="cands"><legend class="sr">Candidate readings for question ${q.n}</legend>${cands}${custom}</fieldset>${customBox}
      <div class="effect${changed ? ' hl' : ''}" role="status">${changed ? `${ic('warn', 18)} This reading changes the paper total from <strong>${fmt(base, mx)}</strong> to <strong>${fmt(tot, mx)}</strong>.` : `Paper total with this reading: <strong>${fmt(tot, mx)}</strong>.`}</div>
      <p class="small muted">The original handwriting is never replaced. If the text hides a mistake the child made, choose “Correct text”. Shortcuts: 1–${q.cands.length} pick a reading, Enter confirms, N skips.</p>
      <div class="row gap wrapr"><button class="btn purple big" data-act="confirmReading">${ic('check')} Confirm reading</button>
        <button class="btn secondary big" data-act="nextUnc">Next uncertainty ${ic('arrow')}</button></div></div>`;
}

function bulkCard(left) {
  const hl = highConf();
  const first = uncertain().findIndex(q => !S.t.ver[q.id].confirmed);
  if (left > 0) {
    return `<div class="card center">${ic('lock', 34)}<p class="lead">Finish the uncertain readings first</p>
      <p class="muted">${left} uncertain ${left === 1 ? 'reading is' : 'readings are'} still open. After that, you can approve the rest in one step.</p>
      <button class="btn purple" data-act="goIdx" data-arg="${first}">Go to the next uncertain reading</button></div>`;
  }
  const all = hl.every(q => S.t.ver[q.id].confirmed);
  const chosen = hl.filter(q => S.t.bulk[q.id] && !S.t.ver[q.id].confirmed).length;
  const rows = hl.map(q => {
    const ok = S.t.ver[q.id].confirmed;
    return `<li class="brow"><div class="bchk">${ok ? `<span class="chip green sm">${ic('check', 14)} Approved</span>` :
      `<input type="checkbox" id="bk-${q.id}" data-chg="bulkChk" data-arg="${q.id}" ${S.t.bulk[q.id] ? 'checked' : ''}><label for="bk-${q.id}"><span class="sr">Approve question ${q.n}</span></label>`}</div>
      <div class="bq"><strong>Question ${q.n}</strong> <span class="muted small">${q.conf}% sure</span></div>
      <div>${handwritingBlock(q, true)}</div><div class="ext sm" lang="${S.stu.lang}">${esc(L(q.cands[0].full))}</div></li>`;
  }).join('');
  return `<div class="card"><div class="banner teal">${ic('shield')}<div><strong>${all ? 'All answers verified' : 'Approve the remaining high-confidence readings'}</strong><br>${all ? 'You can now grade this paper.' : 'Look at each original next to the extracted text. Untick any you want to check yourself.'}</div></div>
    <ul class="blist">${rows}</ul>
    <div class="row gap wrapr">${all ? '' : `<button class="btn teal big" data-act="bulkApprove" ${chosen ? '' : 'aria-disabled="true"'}>${ic('check')} Approve selected (${chosen})</button>`}
      <button class="btn ${all ? 'primary' : 'secondary'} big" data-act="toFinalize" ${allVerified() ? '' : 'aria-disabled="true"'}>Continue to grading ${ic('arrow')}</button></div>
    ${allVerified() ? '' : '<p class="hint">Continue unlocks when every answer is verified.</p>'}</div>`;
}

function selectCand(v) {
  const q = uncertain()[S.t.idx];
  if (!q) return;
  const ver = S.t.ver[q.id];
  ver.sel = v === 'custom' ? 'custom' : +v;
  ver.confirmed = false; S.t.marksOk = false;
  render();
}
C.cand = el => selectCand(el.value);
C.customMark = el => { const q = uncertain()[S.t.idx]; S.t.ver[q.id].customMark = +el.value; S.t.ver[q.id].confirmed = false; S.t.marksOk = false; render(); };
I.customText = el => {
  const q = uncertain()[S.t.idx]; if (!q) return;
  S.t.ver[q.id].customText = el.value; S.t.ver[q.id].confirmed = false; S.t.marksOk = false;
  const x = $('#extractedText'); if (x) x.textContent = el.value || '…';
};
A.customOn = () => selectCand('custom');
A.goIdx = el => { S.t.idx = +el.dataset.arg; render(); };
function nextOpen(from) {
  const unc = uncertain();
  for (let k = 1; k <= unc.length; k++) {
    const j = (from + k) % unc.length;
    if (!S.t.ver[unc[j].id].confirmed && j !== from) return j;
  }
  return unc.length;
}
A.confirmReading = () => {
  const unc = uncertain(), q = unc[S.t.idx];
  if (!q) return;
  const v = S.t.ver[q.id];
  if (v.sel === 'custom' && !v.customText.trim()) { toast('Type the reading first, or pick one of the candidates.'); return; }
  v.confirmed = true; S.t.marksOk = false;
  S.t.idx = nextOpen(S.t.idx);
  render();
  toast(`Question ${q.n} confirmed.`);
};
A.nextUnc = () => {
  const unc = uncertain();
  if (S.t.idx >= unc.length) return;
  const open = unc.map((q, i) => i).filter(i => !S.t.ver[unc[i].id].confirmed && i !== S.t.idx);
  const after = open.find(i => i > S.t.idx);
  S.t.idx = after !== undefined ? after : (open.length ? open[0] : unc.length);
  render();
};
C.bulkChk = el => { S.t.bulk[el.dataset.arg] = el.checked; render(); };
A.bulkApprove = () => {
  let k = 0;
  highConf().forEach(q => { if (S.t.bulk[q.id] && !S.t.ver[q.id].confirmed) { S.t.ver[q.id].confirmed = true; k++; } });
  S.t.marksOk = false;
  render();
  toast(`${k} high-confidence ${k === 1 ? 'reading' : 'readings'} approved.`);
};
A.toFinalize = () => go('finalize');
A.pauseSet = () => { S.t.paused = { screen: 'verify', idx: S.t.idx }; go('queue'); toast('Class set paused. Your place is saved.'); };
function verifyKeys(e) {
  if (S.role !== 'teacher' || S.screen.teacher !== 'verify' || $('#modal-root').innerHTML) return;
  const t = e.target;
  if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== 'radio' && t.type !== 'checkbox') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const q = uncertain()[S.t.idx];
  if (!q) return;
  if (/^[1-9]$/.test(e.key)) { const i = +e.key - 1; if (i < q.cands.length) { e.preventDefault(); selectCand(i); } }
  else if (e.key === 'Enter' && !(t && t.tagName === 'BUTTON')) { e.preventDefault(); A.confirmReading(); }
  else if (e.key.toLowerCase() === 'n' && !(t && t.tagName === 'BUTTON')) { A.nextUnc(); }
}

/* ---------- finalize ---------- */
SCREENS.teacher.finalize = () => {
  if (S.stu.stage === 'none') return waitingCard();
  if (!allVerified()) return unverifiedCard();
  const mx = totalMax(), tot = total();
  if (S.stu.stage === 'published') {
    const p = S.t.pub;
    return `<div class="wrap narrow"><section class="card center">${ic('check', 40)}<h1>Result published</h1>
      <p class="lead">Lina sees ${p.pts}/${p.max} (${p.pct}%) and the feedback you confirmed. Her parent was notified.</p>
      <div class="row gap center-r"><button class="btn secondary" data-act="nav" data-arg="insights">Open class insights</button><button class="btn ghost" data-act="nav" data-arg="queue">Back to class set</button></div></section></div>`;
  }
  const gl = gaps();
  const rows = QS.map(q => {
    const v = S.t.ver[q.id], mark = qMark(q), base = rMark(q, v.sel), m = maxM(q), ov = S.t.over[q.id] != null && S.t.over[q.id] !== base;
    const crit = rub(q).map((c, i) => `<li>${v.sel === 'custom' ? '–' : (q.cands[v.sel].met.includes(i) ? `<span class="ok">${ic('check', 14)}<span class="sr">Met</span></span>` : `<span class="no">${ic('x', 14)}<span class="sr">Not met</span></span>`)} ${esc(c.t)} <span class="muted">(${marksWord(c.m)})</span></li>`).join('');
    return `<div class="rrow"><div class="rq"><strong>Q${q.n}</strong><br><span class="small muted" lang="${S.stu.lang}">${esc(L(q.prompt))}</span></div>
      <div><div class="lbl">Original answer</div>${handwritingBlock(q, true)}<div class="lbl">Verified reading</div><div class="ext sm" lang="${S.stu.lang}">${esc(selFull(q))}</div></div>
      <div><div class="lbl">Rubric evidence</div><ul class="crit">${crit}</ul></div>
      <div class="rmk"><div class="lbl">Mark${ov ? ' <span class="chip amber sm">Changed by you</span>' : ''}</div>
        <div class="stepper"><button class="icon-btn" data-act="markStep" data-arg="${q.id}|-1" aria-label="Decrease mark for question ${q.n}" ${mark <= 0 ? 'aria-disabled="true"' : ''}>−</button><output aria-label="Mark for question ${q.n}">${mark} / ${m}</output><button class="icon-btn" data-act="markStep" data-arg="${q.id}|1" aria-label="Increase mark for question ${q.n}" ${mark >= m ? 'aria-disabled="true"' : ''}>+</button></div>
        <div class="small muted">From rubric: ${base}</div></div></div>`;
  }).join('');
  const gapCards = gl.map(g => {
    const d = S.t.dec[g.id];
    return `<div class="gap-c"><div class="row between wrapr"><div><strong>${esc(g.title)}</strong><br><span class="muted small">Suggested support flag: ${esc(g.flag)}</span></div>
      ${d ? `<span class="chip ${d.s === 'confirmed' ? 'green' : 'grey'}">${d.s === 'confirmed' ? 'Confirmed' : 'Dismissed: ' + esc(d.reason)}</span>` : '<span class="chip amber">Needs your decision</span>'}</div>
      <ul class="ev">${g.ev.map(e => `<li><span class="chip blue sm">${esc(e.lab)}</span> ${esc(e.txt)} <span class="chip green sm">${ic('check', 12)} Verified</span></li>`).join('')}</ul>
      <div class="row gap wrapr"><button class="btn ${d && d.s === 'confirmed' ? 'green' : 'secondary'}" data-act="decide" data-arg="${g.id}|confirmed">${ic('check', 16)} Confirm</button>
        <button class="btn secondary" data-act="openDismiss" data-arg="${g.id}">Dismiss with reason</button>
        ${d ? `<button class="btn ghost" data-act="decide" data-arg="${g.id}|undo">Undo</button>` : ''}</div></div>`;
  }).join('');
  const gapsDecided = gl.every(g => S.t.dec[g.id]);
  const checks = [['Uncertain readings verified', true], ['Marks and grade confirmed', S.t.marksOk], ['Feedback and practice list confirmed', S.t.fbOk], ['Gap suggestions confirmed or dismissed', gapsDecided], ['Class mistake patterns reviewed', S.t.patReviewed]];
  const ready = checks.every(c => c[1]);
  const anyConf = Object.values(S.t.dec).some(d => d && d.s === 'confirmed');
  return `<div class="wrap wide">
    <h1>Finalize result</h1>
    <section class="card sum"><div><span class="muted">Verified paper · suggested grade</span><div class="big-n">${tot} / ${mx}</div><span class="muted">${pct(tot, mx)}%</span></div>
      <div class="row gap wrapr"><button class="btn secondary" data-act="editRubric">${ic('pencil', 18)} Edit rubric and partial credit</button>
        <button class="btn ${S.t.marksOk ? 'green' : 'teal'}" data-act="confirmMarks">${ic('check', 18)} ${S.t.marksOk ? 'Marks confirmed' : 'Confirm marks and grade'}</button></div></section>
    <section class="card"><h2>Rubric evidence</h2><p class="muted small">Each mark is linked to the rubric criterion and to what the child wrote. Change a mark with − and +.</p><div class="rtab">${rows}</div></section>
    <section class="card"><h2>Feedback and practice list</h2>
      <label for="fbText">Feedback for ${STUDENT.name} (child-friendly)</label><textarea id="fbText" data-inp="fb" rows="2">${esc(S.t.fb)}</textarea>
      <label for="supText">Support note ${anyConf ? '' : '<span class="muted small">(shown to the student only after you confirm a flag)</span>'}</label><textarea id="supText" data-inp="support" rows="2">${esc(S.t.support)}</textarea>
      <div class="lbl">Practice list</div>
      <ul class="pl">${S.t.practice.map((x, i) => `<li><span>${esc(x)}</span><button class="icon-btn" data-act="rmPractice" data-arg="${i}" aria-label="Remove ${esc(x)}">${ic('x', 16)}</button></li>`).join('') || '<li class="muted">No items yet.</li>'}</ul>
      <div class="row gap wrapr"><label class="sr" for="newPractice">New practice item</label><input id="newPractice" placeholder="Add a skill to practise"><button class="btn secondary" data-act="addPractice">${ic('plus', 16)} Add</button></div>
      <button class="btn ${S.t.fbOk ? 'green' : 'teal'}" data-act="confirmFb">${ic('check', 18)} ${S.t.fbOk ? 'Feedback confirmed' : 'Confirm feedback and practice list'}</button></section>
    <section class="card"><h2>Gaps and flags</h2><p class="muted small">Based on verified answers only (${verifiedCount()} of ${QS.length}).</p>${gapCards}</section>
    <section class="card"><div class="row between wrapr"><div><h2>Anonymous class mistake patterns</h2><p class="muted small">Students see these without names, answers or grades.</p></div>
      <button class="btn ${S.t.patReviewed ? 'green' : 'secondary'}" data-act="reviewPatterns">${S.t.patReviewed ? ic('check', 18) + ' Reviewed' : 'Review and approve'}</button></div></section>
    <section class="card release"><h2>Release</h2><ul class="checks">${checks.map(c => `<li class="${c[1] ? 'ok' : ''}">${c[1] ? ic('check', 16) : '<span class="circ"></span>'} ${c[0]}</li>`).join('')}</ul>
      <button class="btn primary big" data-act="releaseSummary" ${ready ? '' : 'aria-disabled="true"'}>Review release summary and publish ${ic('arrow')}</button>
      ${ready ? '' : '<p class="hint">Complete the steps above to publish. Nothing reaches the student before then.</p>'}</section>
  </div>`;
};
A.markStep = el => {
  const [id, d] = el.dataset.arg.split('|'), q = QS.find(x => x.id === id);
  const next = clamp(qMark(q) + (+d), 0, maxM(q));
  if (next === rMark(q, S.t.ver[id].sel)) delete S.t.over[id]; else S.t.over[id] = next;
  S.t.marksOk = false; render();
};
A.confirmMarks = () => { S.t.marksOk = true; render(); toast('Marks and grade confirmed.'); };
A.confirmFb = () => {
  if (!S.t.fb.trim()) { toast('Add some feedback for the student first.'); return; }
  S.t.fbOk = true; render(); toast('Feedback and practice list confirmed.');
};
I.fb = el => { S.t.fb = el.value; S.t.fbOk = false; render(); };
I.support = el => { S.t.support = el.value; S.t.fbOk = false; render(); };
A.addPractice = () => {
  const v = ($('#newPractice').value || '').trim();
  if (!v) { toast('Type a skill to add.'); return; }
  S.t.practice.push(v); S.t.fbOk = false; render();
};
A.rmPractice = el => { S.t.practice.splice(+el.dataset.arg, 1); S.t.fbOk = false; render(); };

A.editRubric = () => {
  const body = QS.map(q => `<fieldset class="rfs"><legend>Question ${q.n}</legend>` + rub(q).map((c, i) =>
    `<div class="rline"><label class="sr" for="rt-${q.id}-${i}">Criterion</label><input id="rt-${q.id}-${i}" value="${esc(c.t)}">
     <label class="sr" for="rm-${q.id}-${i}">Marks</label><input id="rm-${q.id}-${i}" type="number" min="0" max="5" value="${c.m}"></div>`).join('') + '</fieldset>').join('');
  openModal({
    wide: true, title: 'Edit rubric and partial credit',
    body: `<p class="muted">Each criterion earns its own marks, so a question can give partial credit. Changes apply to this exam only.</p>${body}`,
    actions: [{ label: 'Save rubric', act: 'saveRubric', kind: 'primary' }, { label: 'Cancel', act: 'closeModal' }]
  });
};
A.saveRubric = () => {
  const next = {};
  for (const q of QS) {
    next[q.id] = [];
    for (let i = 0; i < rub(q).length; i++) {
      const t = $(`#rt-${q.id}-${i}`).value.trim(), m = parseInt($(`#rm-${q.id}-${i}`).value, 10);
      if (!t || isNaN(m) || m < 0 || m > 5) { toast(`Check question ${q.n}: add a criterion and marks from 0 to 5.`); return; }
      next[q.id].push({ t, m });
    }
  }
  S.t.rubric = next; S.t.over = {}; S.t.marksOk = false;
  closeModal(true); render(); toast('Rubric saved. Marks were recalculated.');
};

A.decide = el => {
  const [id, s] = el.dataset.arg.split('|');
  if (s === 'undo') delete S.t.dec[id]; else S.t.dec[id] = { s };
  render();
  if (s === 'confirmed') toast('Flag confirmed.');
};
A.openDismiss = el => {
  const id = el.dataset.arg;
  openModal({
    title: 'Dismiss this suggestion',
    body: `<p class="muted">Choose a reason. It is saved with the decision and the student never sees it.</p>
      <fieldset class="reasons"><legend class="sr">Reason</legend>${REASONS.map((r, i) => `<label class="rr"><input type="radio" name="reason" value="${esc(r)}" ${i === 0 ? 'checked' : ''}> ${esc(r)}</label>`).join('')}</fieldset>
      <label for="reasonText">Note (optional)</label><input id="reasonText" placeholder="Add a short note">`,
    actions: [{ label: 'Dismiss', act: 'saveDismiss', arg: id, kind: 'primary' }, { label: 'Cancel', act: 'closeModal' }]
  });
};
A.saveDismiss = el => {
  const r = ($('input[name=reason]:checked') || {}).value || 'Other', note = ($('#reasonText').value || '').trim();
  S.t.dec[el.dataset.arg] = { s: 'dismissed', reason: note ? `${r} (${note})` : r };
  closeModal(true); render(); toast('Suggestion dismissed with your reason.');
};
A.reviewPatterns = () => openModal({
  title: 'Anonymous class mistake patterns',
  body: `<p class="muted">Tick the patterns to share with the class. Students see the explanation only, with no names, answers or grades.</p>
    ${PATTERNS.map(p => `<label class="pchk"><input type="checkbox" id="pp-${p.id}" ${S.t.pat[p.id] ? 'checked' : ''}><span><strong>${esc(p.teacher)}</strong> <span class="muted small">(${p.count} in the class)</span><br><span class="small">Student sees: ${esc(p.explain)}</span></span></label>`).join('')}`,
  actions: [{ label: 'Save', act: 'savePatterns', kind: 'primary' }, { label: 'Cancel', act: 'closeModal' }]
});
A.savePatterns = () => {
  PATTERNS.forEach(p => { S.t.pat[p.id] = $('#pp-' + p.id).checked; });
  S.t.patReviewed = true; closeModal(true); render(); toast('Patterns saved.');
};
A.releaseSummary = () => {
  const anyConf = Object.values(S.t.dec).some(d => d && d.s === 'confirmed');
  const sup = anyConf && S.t.support.trim();
  const pats = PATTERNS.filter(p => S.t.pat[p.id]);
  openModal({
    wide: true, title: 'Release summary',
    body: `<div class="grid2"><div><h3>${STUDENT.name} and her parent will see</h3><ul class="plain tight">
      <li>Grade: <strong>${fmt(total(), totalMax())}</strong></li><li>Feedback: ${esc(S.t.fb)}</li>${sup ? `<li>Support note: ${esc(S.t.support)}</li>` : ''}
      <li>Practice list: ${S.t.practice.length ? S.t.practice.map(esc).join(', ') : 'none'}</li>
      <li>Class patterns: ${pats.length ? pats.map(p => esc(p.title)).join(', ') : 'none'}</li></ul></div>
      <div><h3>Stays hidden from students</h3><ul class="plain tight"><li>OCR confidence and candidate readings</li><li>Suggestions you have not approved</li><li>Dismissed flags and your reasons</li><li>Other children's answers and grades</li></ul></div></div>`,
    actions: [{ label: 'Publish result', act: 'publish', kind: 'primary' }, { label: 'Back', act: 'closeModal' }]
  });
};
function doPublish(silent) {
  const anyConf = Object.values(S.t.dec).some(d => d && d.s === 'confirmed');
  S.t.pub = {
    pts: total(), max: totalMax(), pct: pct(total(), totalMax()), fb: S.t.fb,
    support: (anyConf && S.t.support.trim()) ? S.t.support.trim() : '',
    practice: [...S.t.practice],
    patterns: PATTERNS.filter(p => S.t.pat[p.id]).map(p => ({ title: p.title, explain: p.explain }))
  };
  S.stu.stage = 'published';
  S.notifs.student.unshift({ id: Date.now(), text: 'Your exam feedback is ready.', read: false, time: 'Just now' });
  S.notifs.parent.unshift({ id: Date.now() + 1, text: `${STUDENT.name}'s exam feedback is ready.`, read: false, time: 'Just now' });
  if (!silent) { closeModal(true); render(); toast('Published. Lina and her parent have been notified.'); }
}
A.publish = () => doPublish(false);

/* ---------- class insights ---------- */
SCREENS.teacher.insights = () => {
  const gl = gaps(), verified = allVerified();
  const flags = [];
  if (S.stu.stage === 'none') flags.push({ id: 'wait', who: STUDENT.name, text: 'Waiting for her exam.', wait: true });
  else if (!verified) flags.push({ id: 'wait', who: STUDENT.name, text: `${QS.length - verifiedCount()} answers are unverified, so they cannot raise a flag yet.`, wait: true });
  else gl.forEach(g => flags.push({ id: g.id, who: STUDENT.name, text: g.flag }));
  flags.push({ id: 'f2', who: 'Omar', text: 'Needs support: mixing numerator and denominator (2 verified exams)', sample: true });
  const open = flags.filter(f => !f.wait && !S.t.dec[f.id]).length;
  const groups = PATTERNS.map(p => `<li class="grp"><div><strong>${p.count}:</strong> ${esc(p.teacher.toLowerCase())}<br><span class="small muted">${S.t.pat[p.id] ? 'Shared with students (anonymous)' : 'Not shared with students'}</span></div>
      <button class="btn ${S.t.pat[p.id] ? 'green' : 'secondary'}" data-act="togglePattern" data-arg="${p.id}" aria-pressed="${!!S.t.pat[p.id]}">${S.t.pat[p.id] ? ic('check', 16) + ' Shared' : 'Approve to share'}</button></li>`).join('');
  const fl = flags.map(f => {
    const d = S.t.dec[f.id];
    return `<li class="flag"><div><strong>${f.who}</strong>${f.sample ? ' <span class="muted small">(sample)</span>' : ''}<br><span class="small">${esc(f.text)}</span></div>
      ${f.wait ? '<span class="chip grey">Not counted</span>' : d ? `<span class="chip ${d.s === 'confirmed' ? 'green' : 'grey'}">${d.s === 'confirmed' ? 'Confirmed' : 'Dismissed: ' + esc(d.reason)}</span>` :
        `<div class="row gap wrapr"><button class="btn secondary" data-act="decide" data-arg="${f.id}|confirmed">Confirm</button><button class="btn secondary" data-act="openDismiss" data-arg="${f.id}">Dismiss with reason</button></div>`}</li>`;
  }).join('');
  return `<div class="wrap wide">
    <h1>Class insights</h1>
    <div class="row gap wrapr"><span class="chip blue">Class: Grade ${STUDENT.cls}</span><span class="chip blue">Topic: Fractions</span></div>
    <section class="card"><h2>Shared misconception groups</h2><ul class="list">${groups}</ul></section>
    <section class="card"><h2>Recurring-error history</h2><p class="muted small">Only verified answers appear here.</p>
      <button class="btn secondary" data-act="openHistory">Open ${STUDENT.name}'s evidence across exams ${ic('arrow', 16)}</button></section>
    <section class="card"><h2>Support review</h2><p class="muted small">${open} suggested ${open === 1 ? 'flag' : 'flags'} to confirm or dismiss. Unverified answers cannot raise a flag.</p><ul class="list">${fl}</ul></section>
    <button class="btn teal big" data-act="compose">${ic('send', 18)} Send teacher comment or notification</button>
  </div>`;
};
A.togglePattern = el => { S.t.pat[el.dataset.arg] = !S.t.pat[el.dataset.arg]; S.t.patReviewed = true; render(); };
A.openHistory = () => {
  const cur = allVerified()
    ? `<li><span class="chip blue sm">Exam 3 · Q6</span> ${esc(L(QS[5].cands[0].full))} <span class="chip green sm">${ic('check', 12)} Verified</span></li>`
    : `<li><span class="chip blue sm">Exam 3</span> Not counted until all answers are verified <span class="chip grey sm">Unverified</span></li>`;
  openModal({
    title: `${STUDENT.name}: evidence across exams`,
    body: `<ul class="ev big">${cur}${HISTORY.slice().reverse().map(h => `<li><span class="chip blue sm">${esc(h.exam)}</span> ${esc(h.text)} <span class="chip green sm">${ic('check', 12)} Verified</span></li>`).join('')}</ul>
      <p class="muted small">Use this in parent meetings: each line links back to a verified answer.</p>`,
    actions: [{ label: 'Close', act: 'closeModal', kind: 'primary' }]
  });
};
A.compose = () => openModal({
  title: 'Send comment or notification',
  body: `<fieldset class="reasons"><legend>Send to</legend>
      <label class="rr"><input type="checkbox" id="to-s" checked> ${STUDENT.name} (student)</label>
      <label class="rr"><input type="checkbox" id="to-p" checked> ${PARENT_NAME}</label></fieldset>
    <label for="cmsg">Message</label><textarea id="cmsg" rows="3">Well done on your exam. Please try the fraction practice this week.</textarea>`,
  actions: [{ label: 'Send', act: 'sendComment', kind: 'primary' }, { label: 'Cancel', act: 'closeModal' }]
});
A.sendComment = () => {
  const msg = $('#cmsg').value.trim(), s = $('#to-s').checked, p = $('#to-p').checked;
  if (!msg) { toast('Write a message first.'); return; }
  if (!s && !p) { toast('Choose who should get it.'); return; }
  if (s) S.notifs.student.unshift({ id: Date.now(), text: 'Teacher: ' + msg, read: false, time: 'Just now' });
  if (p) S.notifs.parent.unshift({ id: Date.now() + 1, text: 'Teacher: ' + msg, read: false, time: 'Just now' });
  closeModal(true); render(); toast('Sent.');
};

/* ---------- parent view ---------- */
SCREENS.parent.home = () => {
  const p = S.t.pub;
  const vals = PRIOR.map(x => x.pct).concat(p ? [p.pct] : []), labels = PRIOR.map(x => x.label).concat(p ? ['Exam 3'] : []);
  return `<div class="wrap">
    <h1>${STUDENT.name}'s progress</h1>
    <p class="note-row">${ic('shield', 18)}<span>You see only your own child's information.</span></p>
    ${p ? `<section class="card grade"><div><span class="muted">Teacher-confirmed grade · Fractions Check</span><div class="big-n">${p.pct}%</div><span class="muted">${p.pts} out of ${p.max}</span></div>${ic('check', 40)}</section>
      <div class="grid2"><section class="card"><h2>Teacher feedback</h2><p>${esc(p.fb)}</p>${p.support ? `<p class="support">${ic('user', 18)} ${esc(p.support)}</p>` : ''}</section>
      <section class="card"><h2>Practice at home</h2>${p.practice.length ? `<ol class="plain">${p.practice.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '<p class="muted">Nothing to add this time.</p>'}</section></div>`
    : `<section class="card center">${ic('clock', 32)}<p class="lead">No new result yet</p><p class="muted">${S.stu.stage === 'submitted' ? `${STUDENT.name}'s latest exam is with the teacher.` : `${STUDENT.name}'s latest exam has not been sent yet.`}</p></section>`}
    <section class="card"><h2>Progress across exams</h2>${progressBars(vals, labels)}<p class="muted">${encourage(vals)}</p></section>
    <section class="card"><h2>Biweekly report</h2><p class="muted">Grades, submissions and attendance. Your teacher sends it every two weeks.</p></section>
  </div>`;
};
SCREENS.parent.messages = () => `<div class="wrap narrow"><h1>Messages</h1><section class="card">
  ${S.notifs.parent.map(n => `<div class="note-row big-row">${ic('bell', 20)}<div><span>${esc(n.text)}</span><br><span class="muted small">${esc(n.time)}</span></div>${S.newIds.includes(n.id) ? '<span class="chip blue">New</span>' : ''}</div>`).join('')}</section></div>`;
