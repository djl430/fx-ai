# First Homework Answer Peek Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a compact standard-answer card beside the hovered or focused question while grading the first homework directly on the student paper.

**Architecture:** Render one answer note inside every direct-grading question so CSS can position it relative to that question without scroll calculations. Use hover/focus selectors for normal visibility and a short-lived `.is-answer-pinned` class after result changes. Keep the feature task-scoped through the existing `usesPaperDirectGrading` branch.

**Tech Stack:** Standalone HTML/CSS/JavaScript demo, Node.js built-in test runner, CommonJS source assertions.

---

## File Structure

- Modify `grading-by-question-demo.html`: answer-card markup, left-gutter and narrow-screen styles, temporary pinning, keyboard focus restoration.
- Modify `tests/collection-pages.test.cjs`: contract coverage for task scoping, answer contents, hover/focus/pinned visibility, timeout, and keyboard focus.

### Task 1: Add failing answer-peek tests

**Files:**
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add focused source-contract tests**

```js
test('first homework shows a standard answer card beside the active paper question', () => {
  assert.match(gradingPage, /function studentAnswerPeekMarkup/);
  assert.match(gradingPage, /class="student-answer-peek"/);
  assert.match(gradingPage, />标准答案</);
  assert.match(gradingPage, /role="note"/);
  assert.match(gradingPage, /aria-describedby="studentAnswerPeek-/);
  assert.match(gradingPage, /开口向上/);
  assert.match(gradingPage, /对称轴 x = 2/);
  assert.match(gradingPage, /顶点（2，−1）/);
});

test('answer peek follows hover focus and recent paper grading', () => {
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:hover \.student-answer-peek/);
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:focus-visible \.student-answer-peek/);
  assert.match(gradingPage, /\.student-paper-question\.is-answer-pinned \.student-answer-peek/);
  assert.match(gradingPage, /function pinStudentPaperAnswer/);
  assert.match(gradingPage, /setTimeout\([\s\S]*1600/);
  assert.match(gradingPage, /focus\(\{ preventScroll: true \}\)/);
  assert.match(gradingPage, /@media \(max-width: 1400px\)[\s\S]*\.student-answer-peek/);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern='standard answer card|answer peek follows' tests/collection-pages.test.cjs`

Expected: two failures because the answer-card renderer, styles, pinning function, and focus restoration do not exist.

### Task 2: Render and position the answer cards

**Files:**
- Modify: `grading-by-question-demo.html:1037-1160`
- Modify: `grading-by-question-demo.html:1937-2030`

- [ ] **Step 1: Add desktop and narrow-screen answer-card CSS**

```css
.student-answer-peek {
  position: absolute;
  top: 0;
  right: calc(100% + 22px);
  z-index: 8;
  width: 188px;
  padding: 13px 14px;
  border: 1px solid #d8dfef;
  border-radius: 12px;
  color: #34405a;
  background: rgba(255,255,255,.98);
  box-shadow: 0 14px 34px rgba(39,57,99,.16);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity .14s ease, transform .14s ease;
}
.student-answer-peek::after { content: ""; position: absolute; top: 18px; right: -7px; border-width: 7px 0 7px 7px; border-style: solid; border-color: transparent transparent transparent #fff; }
.student-answer-peek__label { display: block; color: var(--brand); font-size: 10px; font-weight: 900; letter-spacing: .08em; }
.student-answer-peek strong { display: block; margin-top: 6px; color: var(--ink); font-size: 13px; line-height: 1.55; }
.student-answer-peek ul { margin: 8px 0 0; padding: 8px 0 0 16px; border-top: 1px solid var(--line); font-size: 11px; line-height: 1.65; }
.student-paper-question[data-student-paper-question]:hover .student-answer-peek,
.student-paper-question[data-student-paper-question]:focus-visible .student-answer-peek,
.student-paper-question.is-answer-pinned .student-answer-peek { opacity: 1; transform: translateX(0); }
@media (max-width: 1400px) {
  .student-answer-peek { top: -8px; right: auto; left: 12px; width: 230px; transform: translateY(-100%) translateY(-6px); }
  .student-answer-peek::after { display: none; }
  .student-paper-question[data-student-paper-question]:hover .student-answer-peek,
  .student-paper-question[data-student-paper-question]:focus-visible .student-answer-peek,
  .student-paper-question.is-answer-pinned .student-answer-peek { transform: translateY(-100%); }
}
```

- [ ] **Step 2: Add the answer-card renderer**

```js
function studentAnswerPeekMarkup(question) {
  const scoringPoints = question.id === 4
    ? ["x＜2 时递减", "x＞2 时递增"]
    : question.id === 6
      ? ["开口向上", "对称轴 x = 2", "顶点（2，−1）"]
      : [];
  return `<aside class="student-answer-peek" id="studentAnswerPeek-${question.id}" role="note">
    <span class="student-answer-peek__label">标准答案</span>
    <strong>${question.answer}</strong>
    ${scoringPoints.length ? `<ul>${scoringPoints.map((point) => `<li>${point}</li>`).join("")}</ul>` : ""}
  </aside>`;
}
```

- [ ] **Step 3: Associate direct-grading questions with their answer cards**

Update the direct attributes and task-specific content branch exactly as follows:

```js
const directGradingAttributes = usesPaperDirectGrading
  ? `data-student-paper-question="${question.id}" role="button" tabindex="0" aria-label="第${question.id}题，当前${labels[currentResult].name}，点击切换批改结果" aria-describedby="studentAnswerPeek-${question.id}"`
  : "";

const paperQuestionContent = usesPaperDirectGrading
  ? `${firstHomeworkPaperQuestionMarkup(question, student, resultMark)}${studentAnswerPeekMarkup(question)}`
  : `
    <strong>第 ${question.id} 题 · ${question.title}</strong>
    <p>${question.type}</p>
    <div class="student-paper-answer ${student ? "" : "is-empty"}">学生作答：${student?.answer || "暂无作答"}</div>
    ${resultMark}
  `;
```

- [ ] **Step 4: Run focused markup/style tests and verify GREEN**

Run: `node --test --test-name-pattern='standard answer card|answer peek follows' tests/collection-pages.test.cjs`

Expected: the first test passes; the interaction test still fails until Task 3 adds pinning and focus restoration.

### Task 3: Pin after grading and restore keyboard focus

**Files:**
- Modify: `grading-by-question-demo.html:2180-2270`

- [ ] **Step 1: Add temporary pinning state and helper**

```js
let studentAnswerPinTimer = null;

function pinStudentPaperAnswer(questionId) {
  window.clearTimeout(studentAnswerPinTimer);
  studentPageStack.querySelectorAll(".is-answer-pinned").forEach((item) => item.classList.remove("is-answer-pinned"));
  const question = studentPageStack.querySelector(`[data-student-paper-question="${questionId}"]`);
  if (!question) return;
  question.classList.add("is-answer-pinned");
  studentAnswerPinTimer = window.setTimeout(() => question.classList.remove("is-answer-pinned"), 1600);
}
```

- [ ] **Step 2: Pin the updated question**

After `updateStudentResult(questionId, nextResult)` in `cycleStudentPaperResult`, call `pinStudentPaperAnswer(questionId)` before showing the toast.

- [ ] **Step 3: Restore keyboard focus after DOM rerender**

In the `keydown` handler, store the question id, call `cycleStudentPaperResult(questionId)`, then find the replacement element and run:

```js
studentPageStack.querySelector(`[data-student-paper-question="${questionId}"]`)?.focus({ preventScroll: true });
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test --test-name-pattern='standard answer card|answer peek follows' tests/collection-pages.test.cjs`

Expected: both tests pass.

### Task 4: Verify and commit

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Check embedded JavaScript syntax**

Run:

```bash
node - <<'NODE'
const fs = require('node:fs');
const html = fs.readFileSync('grading-by-question-demo.html', 'utf8');
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
NODE
```

Expected: exit code 0.

- [ ] **Step 2: Run all tests**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass.

- [ ] **Step 3: Inspect scope and whitespace**

Run: `git diff --check && git diff -- grading-by-question-demo.html tests/collection-pages.test.cjs`

Expected: no whitespace errors; changes remain scoped to the first-homework answer peek and tests.

- [ ] **Step 4: Commit**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: show answers beside first homework questions"
```
