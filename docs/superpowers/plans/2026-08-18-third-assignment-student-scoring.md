# Third Assignment Student Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete, type-aware student scoring workspace for the third assignment (`quiz`) with objective judgment controls and subjective numeric scoring.

**Architecture:** Keep the single-file demo architecture and add a task-scoped exam question dataset before student attempts are initialized. Reuse the existing `student.result` and `student.score` fields so question and student views remain synchronized, while `studentToolsMarkup` selects controls by question type.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in test runner.

---

### Task 1: Specify the third assignment exam behavior

**Files:**
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write failing source-contract tests**

Add tests that require `quiz`-specific questions, an `isObjectiveQuestion` helper, objective result buttons, subjective score inputs, four student pages, exam score totals, and exam-specific labels.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test --test-name-pattern="third assignment|exam student" tests/collection-pages.test.cjs`

Expected: FAIL because the dedicated exam dataset and type-aware controls do not exist.

### Task 2: Add quiz-specific exam questions and scoring helpers

**Files:**
- Modify: `grading-by-question-demo.html`

- [ ] **Step 1: Add the dedicated dataset**

When `isExam && taskId === "quiz"`, replace the default homework questions with 8 one-variable linear-function questions covering:

```js
["选择题", "判断题", "选择题", "判断题", "填空题", "填空题", "解答题", "解答题"]
```

Each question defines `maxScore`, `answer`, `responses`, explanation, and grading basis.

- [ ] **Step 2: Use data-driven maximum scores and exam metadata**

Change `maxScore(question)` to prefer `question.maxScore`. For `quiz`, set the default title to “一次函数随堂检测” and class to “八年级 3 班”.

- [ ] **Step 3: Verify the focused tests still fail only on UI contracts**

Run the focused test command and confirm dataset assertions pass while type-aware control assertions remain red.

### Task 3: Render type-aware structured scoring controls

**Files:**
- Modify: `grading-by-question-demo.html`

- [ ] **Step 1: Add objective-question detection**

Implement:

```js
function isObjectiveQuestion(question) {
  return question.type.startsWith("选择题") || question.type.startsWith("判断题");
}
```

- [ ] **Step 2: Render objective and subjective tools**

In `studentToolsMarkup`, render `data-student-result` correct/wrong buttons and a score summary for objective questions. Render `data-student-score` numeric inputs only for fill-in and written questions.

- [ ] **Step 3: Add compact exam-tool styling**

Add CSS for the question type badge, score summary, labeled objective buttons, and subjective score editor while preserving the existing panel geometry.

- [ ] **Step 4: Verify GREEN**

Run: `node --test --test-name-pattern="third assignment|exam student" tests/collection-pages.test.cjs`

Expected: PASS.

### Task 4: Complete exam labels and roster totals

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add failing assertions for exam labels and totals**

Require `按题赋分`, `按学生赋分`, `确认本学生赋分`, `一键确认赋分`, and an exam roster metric ending in `分`.

- [ ] **Step 2: Verify RED**

Run the focused test command and confirm the missing dynamic labels fail.

- [ ] **Step 3: Implement dynamic labels and total score display**

Update mode buttons, workspace labels, confirmation labels, and `renderStudentList` for exam mode. Add a helper that sums numeric student scores without string coercion.

- [ ] **Step 4: Verify GREEN**

Run the focused test command and expect all focused tests to pass.

### Task 5: Regression verification

**Files:**
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Run the complete suite**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Inspect the final diff**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors; changes limited to the grading demo, tests, spec, and plan.

- [ ] **Step 3: Commit the implementation**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs docs/superpowers/specs/2026-08-18-third-assignment-student-scoring-design.md docs/superpowers/plans/2026-08-18-third-assignment-student-scoring.md
git commit -m "feat: add third assignment student scoring"
```
