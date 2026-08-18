# First Homework Paper Direct Grading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every question on the first homework's student paper directly clickable for cycling grading results, while removing that task's structured grading panel.

**Architecture:** Add a task-scoped `usesPaperDirectGrading` flag and conditionally render interactive question semantics plus a single-column paper page. Reuse `updateStudentResult` so paper marks, roster accuracy, confirmation state, and question-mode groups continue to share one source of truth. Keep the existing structured tool renderer available for all non-target tasks.

**Tech Stack:** Standalone HTML/CSS/JavaScript demo, Node.js built-in test runner, CommonJS source assertions.

---

## File Structure

- Modify `grading-by-question-demo.html`: task flag, direct-grading styles, conditional page markup, click/keyboard interaction.
- Modify `tests/collection-pages.test.cjs`: regression coverage for task scoping, conditional tool removal, result cycle, hover/focus state, and keyboard access.

### Task 1: Add failing direct-grading contract tests

**Files:**
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write the failing tests**

```js
test('first homework grades directly on paper questions', () => {
  assert.match(gradingPage, /const usesPaperDirectGrading = taskId === "cluster-homework" && !isExam/);
  assert.match(gradingPage, /data-student-paper-question/);
  assert.match(gradingPage, /function cycleStudentPaperResult/);
  assert.match(gradingPage, /correct:\s*"wrong"/);
  assert.match(gradingPage, /wrong:\s*"partial"/);
  assert.match(gradingPage, /partial:\s*"correct"/);
  assert.match(gradingPage, /studentPageStack\.addEventListener\("keydown"/);
});

test('first homework omits structured tools and highlights paper questions', () => {
  assert.match(gradingPage, /function studentToolPanelMarkup/);
  assert.match(gradingPage, /if \(usesPaperDirectGrading\) return "";/);
  assert.match(gradingPage, /\.student-page-row\[data-paper-direct="true"\]/);
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:hover/);
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:focus-visible/);
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test --test-name-pattern='first homework' tests/collection-pages.test.cjs`

Expected: FAIL because the task flag, paper question data attribute, cycle function, and conditional panel helper do not exist.

### Task 2: Implement task-scoped paper direct grading

**Files:**
- Modify: `grading-by-question-demo.html:971-1104`
- Modify: `grading-by-question-demo.html:1410-1416`
- Modify: `grading-by-question-demo.html:1834-2070`

- [ ] **Step 1: Add the task flag and single-column interactive styling**

Add the task-scoped flag after the URL mode values:

```js
const usesPaperDirectGrading = taskId === "cluster-homework" && !isExam;
```

Add CSS that keeps the existing literal `.student-page-row` class while changing only flagged rows:

```css
.student-page-row[data-paper-direct="true"] {
  grid-template-columns: minmax(0,1fr);
}

.student-page-row[data-paper-direct="true"] .student-paper-stage {
  padding-inline: clamp(32px, 8vw, 140px);
}

.student-paper-question[data-student-paper-question] {
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom-color: rgba(120,130,150,.24);
  border-radius: 10px;
  transition: background .16s ease, border-color .16s ease, box-shadow .16s ease;
}

.student-paper-question[data-student-paper-question]:hover,
.student-paper-question[data-student-paper-question]:focus-visible {
  outline: none;
  border-color: #aebdf3;
  background: rgba(237,241,255,.72);
  box-shadow: inset 4px 0 0 var(--brand), 0 8px 22px rgba(52,72,134,.12);
}
```

- [ ] **Step 2: Make paper questions interactive only for the first homework**

In `studentPaperMarkup`, derive the current result and conditionally add button semantics:

```js
const currentResult = student?.result || "ungraded";
const directGradingAttributes = usesPaperDirectGrading
  ? `data-student-paper-question="${question.id}" role="button" tabindex="0" aria-label="第${question.id}题，当前${labels[currentResult].name}，点击切换批改结果"`
  : "";
```

Render `<section class="student-paper-question" ${directGradingAttributes}>` without changing non-target tasks.

- [ ] **Step 3: Conditionally omit the structured tool panel**

Extract the panel wrapper into a helper:

```js
function studentToolPanelMarkup(pageQuestions, index, totalPages) {
  if (usesPaperDirectGrading) return "";
  return `
    <aside class="student-tool-panel" aria-label="第 ${index + 1} 页结构化批改工具">
      <header class="student-tool-head">
        <strong class="student-tool-page">${index + 1}/${totalPages}</strong>
      </header>
      <div class="student-question-tools">${studentToolsMarkup(pageQuestions)}</div>
    </aside>
  `;
}
```

Add `data-paper-direct="${usesPaperDirectGrading}"` to each page row and call the helper after the paper stage.

- [ ] **Step 4: Add click and keyboard result cycling**

Reuse the shared update path:

```js
function cycleStudentPaperResult(questionId) {
  const question = questions.find((item) => item.id === Number(questionId));
  const student = question?.students.find((item) => item.name === activeStudentName);
  if (!usesPaperDirectGrading || !student) return;
  const nextResult = {
    ungraded: "correct",
    correct: "wrong",
    wrong: "partial",
    partial: "correct"
  }[student.result] || "correct";
  updateStudentResult(questionId, nextResult);
  showToast(`${activeStudentName} · 第 ${questionId} 题已标记为${labels[nextResult].name}`);
}
```

At the start of the page-stack click handler, handle `[data-student-paper-question]` and return. Add a `keydown` listener that calls the same function for Enter and Space, using `event.preventDefault()` for Space.

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `node --test --test-name-pattern='first homework' tests/collection-pages.test.cjs`

Expected: PASS for both new tests.

### Task 3: Verify regressions and commit

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Check inline JavaScript syntax**

Run:

```bash
node - <<'NODE'
const fs = require('node:fs');
const html = fs.readFileSync('grading-by-question-demo.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
new Function(script);
NODE
```

Expected: exit code 0 with no output.

- [ ] **Step 2: Run the complete demo test suite**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass.

- [ ] **Step 3: Review the diff for scope**

Run: `git diff --check && git diff -- grading-by-question-demo.html tests/collection-pages.test.cjs`

Expected: no whitespace errors; changes are limited to task-scoped paper direct grading and its tests.

- [ ] **Step 4: Commit the implementation**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: grade first homework directly on paper"
```
