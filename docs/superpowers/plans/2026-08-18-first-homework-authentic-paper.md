# First Homework Authentic Paper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the first homework as six realistic, type-appropriate questions with student answers in their actual answer positions and grading marks beside those answers.

**Architecture:** Add a first-homework-only paper question renderer layered on top of the existing shared question/student state. Keep generic paper rendering for all other tasks, and keep the whole-question click handler unchanged. Use a small answer-normalization helper only for the choice question so its recognized response appears as an option letter inside parentheses.

**Tech Stack:** Standalone HTML/CSS/JavaScript demo, Node.js built-in test runner, CommonJS source assertions.

---

## File Structure

- Modify `grading-by-question-demo.html`: authentic question templates, choice-answer normalization, inline response/mark markup, and paper-specific CSS.
- Modify `tests/collection-pages.test.cjs`: regression checks for question types, options, in-place answers, inline grading marks, and student confirmation button parity.

### Task 1: Add failing paper-content tests

**Files:**
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add two focused tests**

```js
test('first homework paper renders type-appropriate question content', () => {
  assert.match(gradingPage, /function firstHomeworkPaperQuestionMarkup/);
  assert.match(gradingPage, /二次函数 y = 2x² − 4x \+ 1 的图像开口方向是/);
  for (const option of ['A. 向下', 'B. 向上', 'C. 向左', 'D. 向右']) {
    assert.match(gradingPage, new RegExp(option.replace('.', '\\.')));
  }
  assert.match(gradingPage, /function studentChoiceSelection/);
  assert.match(gradingPage, /求函数 y = x² − 4x \+ 3 的对称轴/);
  assert.match(gradingPage, /写出函数在对称轴两侧的增减性/);
});

test('first homework places grading marks beside student responses', () => {
  assert.match(gradingPage, /class="student-paper-response/);
  assert.match(gradingPage, /student-paper-mark is-inline/);
  assert.match(gradingPage, /\.student-paper-mark\.is-inline/);
  assert.match(gradingPage, /usesPaperDirectGrading\s*\?\s*firstHomeworkPaperQuestionMarkup/);
});

test('student confirmation buttons reuse question grading button shape and color', () => {
  assert.match(gradingPage, /\.student-roster__footer \.button\s*\{[^}]*min-height:\s*38px[^}]*border-radius:\s*10px/s);
  assert.match(gradingPage, /\.student-review-footer \.button\s*\{[^}]*min-height:\s*38px[^}]*border-radius:\s*10px/s);
  assert.doesNotMatch(gradingPage, /\.student-roster__footer \.button\s*\{[^}]*#73c9f3/s);
  assert.doesNotMatch(gradingPage, /\.student-review-footer \.button\s*\{[^}]*#2585f4/s);
});
```

- [ ] **Step 2: Verify the tests fail for missing authentic paper helpers**

Run: `node --test --test-name-pattern='first homework paper|places grading marks' tests/collection-pages.test.cjs`

Expected: FAIL because the dedicated renderer, option content, response wrapper, inline mark class, and matching student button styles do not exist.

### Task 2: Implement authentic question paper rendering

**Files:**
- Modify: `grading-by-question-demo.html:1030-1090`
- Modify: `grading-by-question-demo.html:1860-1905`

- [ ] **Step 1: Add paper typography and inline-response styles**

```css
.student-paper-prompt { color: #252a35; font-size: 15px; line-height: 1.9; }
.student-paper-options { margin: 8px 0 0 24px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px 24px; font-size: 14px; }
.student-paper-response { display: inline-flex; align-items: center; gap: 7px; min-width: 84px; margin-inline: 4px; }
.student-paper-response.is-block { display: flex; margin: 9px 0 0; padding: 8px 10px 7px; border-bottom: 1px solid #8f9299; }
.student-paper-response .student-paper-answer { border-bottom: 1px solid #8f9299; padding: 0 8px 1px; }
.student-paper-response.is-block .student-paper-answer { flex: 1; border: 0; padding: 0; }
.student-paper-mark.is-inline { position: static; width: 30px; height: 30px; flex: none; vertical-align: middle; transform: rotate(-7deg); }
.student-paper-mark.is-inline .mark-icon { width: 29px; height: 29px; }
```

- [ ] **Step 2: Normalize the first choice answer**

```js
function studentChoiceSelection(answer) {
  const value = String(answer || "");
  if (/向下|^A/i.test(value)) return "A";
  if (/向上|开口朝上|^上$|^B/i.test(value)) return "B";
  if (/向左|^C/i.test(value)) return "C";
  if (/向右|^D/i.test(value)) return "D";
  return /未|没有|不确定/.test(value) ? "未填" : value;
}
```

- [ ] **Step 3: Render student answers and marks as one response unit**

```js
function studentPaperResponseMarkup(answer, resultMark, block = false) {
  const empty = !answer || /未作答|没有写|未写|未完成/.test(answer);
  return `<span class="student-paper-response ${block ? "is-block" : ""}">
    <span class="student-paper-answer ${empty ? "is-empty" : ""}">${answer || "未作答"}</span>
    ${resultMark}
  </span>`;
}
```

- [ ] **Step 4: Add six task-specific question templates**

```js
function firstHomeworkPaperQuestionMarkup(question, student, resultMark) {
  const answer = student?.answer || "未作答";
  const response = (value = answer, block = false) => studentPaperResponseMarkup(value, resultMark, block);
  switch (question.id) {
    case 1:
      return `<div class="student-paper-prompt"><b>1.</b> 二次函数 y = 2x² − 4x + 1 的图像开口方向是（${response(studentChoiceSelection(answer))}）。</div>
        <div class="student-paper-options"><span>A. 向下</span><span>B. 向上</span><span>C. 向左</span><span>D. 向右</span></div>`;
    case 2:
      return `<div class="student-paper-prompt"><b>2.</b> 求函数 y = x² − 4x + 3 的对称轴：${response()}。</div>`;
    case 3:
      return `<div class="student-paper-prompt"><b>3.</b> 函数 y = x² − 4x + 3 的顶点坐标是 ${response()}。</div>`;
    case 4:
      return `<div class="student-paper-prompt"><b>4.</b> 写出函数在对称轴两侧的增减性。</div>${response(answer, true)}`;
    case 5:
      return `<div class="student-paper-prompt"><b>5.</b> 函数 y = x² − 4x + 3 的最小值为 ${response()}。</div>`;
    case 6:
      return `<div class="student-paper-prompt"><b>6.</b> 写出函数 y = x² − 4x + 3 的开口方向、对称轴和顶点坐标。</div>${response(answer, true)}`;
    default:
      return `<strong>第 ${question.id} 题 · ${question.title}</strong><p>${question.type}</p>${response(answer, true)}`;
  }
}
```

Generate the first task mark as `<span class="student-paper-mark is-inline">…</span>` and call the task-specific renderer only when `usesPaperDirectGrading` is true. Generic tasks continue to render the existing top-right mark and generic content.

- [ ] **Step 5: Match student-view confirmation buttons to question grading**

```css
.student-roster__footer .button {
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
}

.student-review-footer .button {
  min-width: 178px;
  min-height: 38px;
  border-radius: 10px;
}
```

These geometry-only rules allow both buttons to inherit the shared `.button.primary` deep-blue gradient and shadow.

- [ ] **Step 6: Verify the focused tests pass**

Run: `node --test --test-name-pattern='first homework paper|places grading marks' tests/collection-pages.test.cjs`

Expected: both tests PASS.

### Task 3: Verify and commit

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

- [ ] **Step 3: Check scope and whitespace**

Run: `git diff --check && git diff -- grading-by-question-demo.html tests/collection-pages.test.cjs`

Expected: no whitespace errors and no changes outside the first-homework paper renderer and tests.

- [ ] **Step 4: Commit**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: render authentic first homework paper"
```
