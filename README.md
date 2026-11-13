# Axis: AI-assisted assessment prototype

CSEN 909 Human Computer Interaction, Winter 2026, Milestone 3. Team Axis.

A coded HTML/CSS/JavaScript prototype of the student, teacher and (bonus) parent views for AI-powered assessment of Grade 1 to 5 handwritten exams. **All AI output is mocked**: OCR readings, confidence scores, candidate readings, suggested marks and learning gaps are hard-coded in `data.js`, as the course brief allows. The camera is simulated.

## Run it locally

No build step and no dependencies.

1. Download or clone this folder.
2. Open `index.html` in a current browser (Chrome, Edge, Firefox, Safari).

Optional local server: `python3 -m http.server 8000`, then open http://localhost:8000.

## Deploy (GitHub Pages)

1. Create a public repository and upload the contents of this folder to the root.
2. Repository **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Wait a minute, then open the URL GitHub shows. Test it in a private window before submitting.

## What to try (full workflow)

1. **Student** view: *Upload my exam* → choose subject, exam and language → *Scan paper* → tap *Take photo* twice (the second photo is blurry on purpose) → *Retake page 2* → *Submit paper*.
2. **Teacher** view: *Class set* → *Open* on Lina → work through the uncertain readings (Question 4 first, then 5, then 2) → *Approve selected* → *Continue to grading*.
3. **Finalize**: confirm marks, confirm feedback, confirm or dismiss each gap (dismissal needs a reason), review class patterns → *Review release summary* → *Publish result*.
4. **Student** view: *Results* shows only what the teacher released. **Parent** view shows the same result for the parent's own child.

Use the **Demo tools** button (bottom right) to skip ahead or reset. It is not part of the product design.

## Features that come from the teacher interview and Milestone 1

- Uncertain OCR readings first, ranked by how much they could change the grade.
- Original handwriting always beside the extracted text.
- Language-aware candidate readings (English or German exam), each with its mark effect and the new paper total.
- "Correct text" for readings the system did not offer.
- Approve remaining high-confidence readings in one step, only after the risky ones.
- Marks linked to rubric criteria and to the child's answer; editable rubric and partial credit per exam.
- Pause and resume a class set.
- Gaps and flags use verified answers only; dismiss a suggestion with a reason.
- Students see only teacher-confirmed results; class mistake patterns are anonymous.

## Keyboard shortcuts (teacher, OCR verification)

`1`–`3` pick a candidate reading · `Enter` confirm · `N` next uncertainty.

## Open a screen directly

Append `#role/screen` to the URL, for example `index.html#teacher/verify`, `#student/review`, `#parent/home`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell |
| `styles.css` | Design tokens and components |
| `data.js` | Mock exam, answers, candidates, rubric, history |
| `core.js` | State, grading logic, routing, modals |
| `student.js` | Student screens |
| `teacher.js` | Teacher and parent screens |
| `main.js` | Start-up |

## Known limitations

- Sign-in is not prototyped; the prototype opens on each home screen.
- Image-quality checking is simulated. Uploaded images are shown but not analysed.
- One exam (Fractions Check, 6 questions, 8 marks) and one live student (Lina). Other students in the class list are sample rows.
- State resets when the page is reloaded.
- Fonts load from Google Fonts when online; otherwise system fonts are used.
