# Dual Grading Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the student-trace preview entry with synchronized by-question and by-student grading modes, and simplify the result rail to four lines.

**Architecture:** Keep both workspaces in `grading-by-question-demo.html` and share the existing `questions[].students[]` objects. The by-student view derives a cross-question projection keyed by unique student name; writes update the original student object so the existing by-question renderer reflects changes without a second state store.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner

---

### Task 1: Specify the dual-mode contract with failing tests

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add source-level behavior tests**

Append:

```js
test('grading page switches between synchronized question and student modes', () => {
  assert.doesNotMatch(gradingPage, /student-trace-preview\.html/);
  assert.match(gradingPage, /data-grading-view="question"[^>]*aria-selected="true"/);
  assert.match(gradingPage, /data-grading-view="student"/);
  assert.match(gradingPage, /id="questionWorkspace"/);
  assert.match(gradingPage, /id="studentWorkspace"[^>]*hidden/);
  assert.match(gradingPage, /function setGradingView/);
  assert.match(gradingPage, /student\.result = result/);
  assert.match(gradingPage, /renderAll\(\)/);
});

test('student grading mode provides a roster, centered paper, and structured tools', () => {
  assert.match(gradingPage, /id="studentList"/);
  assert.match(gradingPage, /id="studentPaper"/);
  assert.match(gradingPage, /id="studentQuestionTools"/);
  assert.match(gradingPage, /id="confirmStudent"/);
  assert.match(gradingPage, /data-student-result/);
  assert.match(gradingPage, /data-student-score/);
  assert.match(gradingPage, /function renderStudentWorkspace/);
});

test('grading result rail contains only four functional lines', () => {
  assert.equal((gradingPage.match(/data-result-target=/g) || []).length, 4);
  assert.doesNotMatch(gradingPage, /\.result-rail::before/);
  assert.doesNotMatch(gradingPage, /repeating-linear-gradient\(to bottom, #cbd2de/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/collection-pages.test.cjs`

Expected: three new tests fail because the preview link still exists, no student workspace exists, and the rail still has a repeating tick background.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/collection-pages.test.cjs
git commit -m "test: specify synchronized grading modes"
```

### Task 2: Build the mode switch and student workspace

**Files:**
- Modify: `grading-by-question-demo.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Replace the preview link and add workspace markup**

Replace `.top-actions` with:

```html
<div class="top-actions">
  <div class="grading-mode-switch" role="tablist" aria-label="批改方式">
    <button class="grading-mode-button active" type="button" role="tab" data-grading-view="question" aria-selected="true">按题批改</button>
    <button class="grading-mode-button" type="button" role="tab" data-grading-view="student" aria-selected="false">按学生批改</button>
  </div>
</div>
```

Add `id="questionWorkspace"` to the existing `.workspace`, then append:

```html
<section class="student-workspace" id="studentWorkspace" aria-label="按学生批改" hidden>
  <aside class="student-roster">
    <div class="student-roster__head"><strong>学生列表</strong><span id="studentProgress"></span></div>
    <nav class="student-list" id="studentList" aria-label="选择学生"></nav>
  </aside>
  <main class="student-paper-stage" aria-label="当前学生作业">
    <article class="student-paper" id="studentPaper"></article>
  </main>
  <aside class="student-tool-panel" aria-label="结构化批改工具">
    <header class="student-tool-head"><div><span>结构化批改</span><strong id="studentToolName"></strong></div><span id="studentToolSummary"></span></header>
    <div class="student-question-tools" id="studentQuestionTools"></div>
    <footer class="student-tool-footer"><button class="button primary" id="confirmStudent" type="button">确认本学生批改</button></footer>
  </aside>
</section>
```

- [ ] **Step 2: Simplify the result rail**

Delete the entire `.result-rail::before` rule. Make the container transparent and borderless while retaining its absolute positioning and four button rows:

```css
.result-rail {
  position: absolute;
  z-index: 12;
  top: 68px;
  right: 12px;
  bottom: 70px;
  width: 38px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-end;
  padding: 10px 0;
  pointer-events: none;
}
.result-rail__button { pointer-events: auto; }
```

- [ ] **Step 3: Style the switch and three-column student workspace**

Add cohesive styles based on the existing variables:

```css
.grading-mode-switch { display:inline-flex; padding:3px; border:1px solid var(--line); border-radius:11px; background:#f3f6fc; }
.grading-mode-button { min-height:30px; padding:0 13px; border:0; border-radius:8px; background:transparent; color:var(--muted); font-weight:800; cursor:pointer; }
.grading-mode-button.active { color:#fff; background:var(--brand-dark); box-shadow:0 5px 12px rgba(48,69,126,.18); }
.student-workspace { min-height:0; display:grid; grid-template-columns:190px minmax(620px,1fr) 360px; }
.student-workspace[hidden] { display:none; }
.student-roster { min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr); border-right:1px solid var(--line); background:rgba(247,249,253,.95); }
.student-roster__head { display:flex; justify-content:space-between; padding:18px 14px 10px; }
.student-list { overflow:auto; padding:0 10px 16px; }
.student-list-item { width:100%; display:grid; grid-template-columns:1fr auto; gap:6px; margin:4px 0; padding:11px; border:1px solid transparent; border-radius:12px; background:transparent; text-align:left; cursor:pointer; }
.student-list-item.active { border-color:#cdd6ff; background:var(--brand-soft); box-shadow:inset 3px 0 0 var(--brand); }
.student-paper-stage { min-width:0; overflow:auto; display:flex; justify-content:center; align-items:flex-start; padding:24px; background:#e9eef6; }
.student-paper { width:min(720px,100%); min-height:980px; padding:34px 42px; border:1px solid #e6ddce; border-radius:10px; background:repeating-linear-gradient(to bottom,transparent 0 39px,rgba(75,90,120,.05) 39px 40px),#fffdfa; box-shadow:0 22px 55px rgba(35,45,78,.16); }
.student-paper-question { position:relative; margin:0 0 26px; padding:0 54px 18px 0; border-bottom:1px dashed rgba(120,130,150,.24); }
.student-paper-mark { position:absolute; top:4px; right:2px; width:38px; height:38px; }
.student-tool-panel { min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr) auto; border-left:1px solid var(--line); background:#fff; }
.student-tool-head { display:flex; justify-content:space-between; padding:16px; border-bottom:1px solid var(--line); }
.student-question-tools { overflow:auto; padding:10px 14px 18px; }
.student-question-tool { padding:14px 0; border-bottom:1px solid var(--line); }
.student-result-options { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-top:10px; }
.student-result-option { min-height:30px; border:1px solid var(--line); border-radius:8px; background:#fff; color:var(--muted); cursor:pointer; font-size:11px; font-weight:800; }
.student-result-option.active { color:var(--brand-dark); border-color:#aebdf3; background:var(--brand-soft); }
.student-tool-footer { padding:12px 14px; border-top:1px solid var(--line); }
.student-tool-footer .button { width:100%; }
```

At the existing responsive breakpoints, set `.student-workspace { min-width:1050px; }` so narrow screens scroll instead of crushing the paper.

- [ ] **Step 4: Add shared-state student renderers**

After the existing DOM bindings, define:

```js
const questionWorkspace = document.getElementById("questionWorkspace");
const studentWorkspace = document.getElementById("studentWorkspace");
const studentList = document.getElementById("studentList");
const studentProgress = document.getElementById("studentProgress");
const studentPaper = document.getElementById("studentPaper");
const studentQuestionTools = document.getElementById("studentQuestionTools");
const studentToolName = document.getElementById("studentToolName");
const studentToolSummary = document.getElementById("studentToolSummary");
const confirmStudent = document.getElementById("confirmStudent");

let gradingView = "question";
const studentCompletion = new Set();
const studentNames = [...new Set(questions.flatMap((question) => question.students.map((student) => student.name)))];
let activeStudentName = studentNames[0] || "";

function studentAttempt(question, name = activeStudentName) {
  return question.students.find((student) => student.name === name) || null;
}

function studentAccuracy(name) {
  const attempts = questions.map((question) => studentAttempt(question, name)).filter(Boolean);
  if (!attempts.length) return 0;
  const points = attempts.reduce((total, student) => total + (student.result === "correct" ? 1 : student.result === "partial" ? .5 : 0), 0);
  return Math.round(points / attempts.length * 100);
}

function renderStudentList() {
  studentProgress.textContent = `${studentCompletion.size}/${studentNames.length} 已确认`;
  studentList.innerHTML = studentNames.map((name) => `<button class="student-list-item ${name === activeStudentName ? "active" : ""}" type="button" data-student-name="${name}"><span><strong>${name}</strong><small>${studentCompletion.has(name) ? "已确认" : "未确认"}</small></span><b>${studentAccuracy(name)}%</b></button>`).join("");
}

function renderStudentPaper() {
  studentPaper.innerHTML = `<header class="student-paper-head"><div><span>${className}</span><span>姓名：${activeStudentName}</span></div><h2>${taskTitle}</h2></header>${questions.map((question) => {
    const student = studentAttempt(question);
    return `<section class="student-paper-question"><strong>第 ${question.id} 题 · ${question.title}</strong><p>${question.type}</p><div class="student-paper-answer">学生作答：${student?.answer || "暂无作答"}</div>${student && student.result !== "ungraded" ? `<span class="student-paper-mark"><span class="mark-icon ${student.result}"></span></span>` : ""}</section>`;
  }).join("")}`;
}

function renderStudentTools() {
  studentToolName.textContent = activeStudentName;
  studentToolSummary.textContent = `正确率 ${studentAccuracy(activeStudentName)}%`;
  studentQuestionTools.innerHTML = questions.map((question) => {
    const student = studentAttempt(question);
    if (!student) return `<section class="student-question-tool"><strong>第 ${question.id} 题</strong><p>暂无作答</p></section>`;
    if (isExam) return `<section class="student-question-tool"><strong>第 ${question.id} 题</strong><p>${student.answer}</p><label>得分 <input type="number" min="0" max="${maxScore(question)}" step="0.5" value="${scoreInputValue(student, question)}" data-student-score data-question-id="${question.id}"> / ${maxScore(question)}</label></section>`;
    return `<section class="student-question-tool"><strong>第 ${question.id} 题</strong><p>${student.answer}</p><div class="student-result-options">${order.map((result) => `<button class="student-result-option ${student.result === result ? "active" : ""}" type="button" data-student-result="${result}" data-question-id="${question.id}">${labels[result].name}</button>`).join("")}</div></section>`;
  }).join("");
}

function renderStudentWorkspace() {
  renderStudentList();
  renderStudentPaper();
  renderStudentTools();
}
```

- [ ] **Step 5: Add interaction bindings and synchronization**

Add delegated events and mode switching:

```js
function updateStudentResult(questionId, result) {
  const question = questions.find((item) => item.id === Number(questionId));
  const student = question?.students.find((item) => item.name === activeStudentName);
  if (!student || !labels[result]) return;
  student.result = result;
  if (isExam) student.score = defaultScoreForResult(result, question);
  renderStudentWorkspace();
}

function setGradingView(view) {
  gradingView = view === "student" ? "student" : "question";
  questionWorkspace.hidden = gradingView !== "question";
  studentWorkspace.hidden = gradingView !== "student";
  document.querySelectorAll("[data-grading-view]").forEach((button) => {
    const active = button.dataset.gradingView === gradingView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (gradingView === "question") renderAll();
  else renderStudentWorkspace();
}

studentList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-student-name]");
  if (!button) return;
  activeStudentName = button.dataset.studentName;
  renderStudentWorkspace();
});

studentQuestionTools.addEventListener("click", (event) => {
  const button = event.target.closest("[data-student-result]");
  if (button) updateStudentResult(button.dataset.questionId, button.dataset.studentResult);
});

studentQuestionTools.addEventListener("change", (event) => {
  const input = event.target.closest("[data-student-score]");
  if (!input) return;
  const question = questions.find((item) => item.id === Number(input.dataset.questionId));
  const student = question?.students.find((item) => item.name === activeStudentName);
  if (!student) return;
  const score = Math.max(0, Math.min(maxScore(question), Math.round(Number(input.value) * 2) / 2));
  student.score = score;
  student.result = score === maxScore(question) ? "correct" : score === 0 ? "wrong" : "partial";
  renderStudentWorkspace();
});

confirmStudent.addEventListener("click", () => {
  studentCompletion.add(activeStudentName);
  const next = studentNames.find((name) => !studentCompletion.has(name));
  if (next) activeStudentName = next;
  renderStudentWorkspace();
});

document.querySelectorAll("[data-grading-view]").forEach((button) => button.addEventListener("click", () => setGradingView(button.dataset.gradingView)));
setGradingView("question");
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node --test tests/collection-pages.test.cjs`

Expected: all page tests pass.

- [ ] **Step 7: Run syntax and full regression checks**

Run: `node -e 'const fs=require("node:fs"); const html=fs.readFileSync("grading-by-question-demo.html","utf8"); const scripts=[...html.matchAll(/<script(?:[^>]*)>([\\s\\S]*?)<\\/script>/g)]; new Function(scripts.at(-1)[1]);' && node --test tests/*.test.cjs && git diff --check`

Expected: exit 0; 0 failed tests; no whitespace errors.

- [ ] **Step 8: Commit the implementation**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: add synchronized student grading mode"
```
