# First Homework AI Grading Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the first homework as a realistic proof that AI recognizes multiple valid solutions, grades mathematical process, applies teacher-authored semantic rubrics, and immediately regrades the active question for all 30 students.

**Architecture:** Keep the current single-file demo and shared student result state. Extend only `cluster-homework` with capability-aware result profiles, render the evidence in question and paper views, and add a compact rule editor backed by a deterministic in-memory regrade.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in test runner.

---

## File Map

- Modify `grading-by-question-demo.html`: data, evidence rendering, paper annotations, rule editor, regrade state.
- Modify `tests/collection-pages.test.cjs`: structural regression contracts.
- Reference `docs/superpowers/specs/2026-08-19-first-homework-ai-grading-proof-design.md`.

### Task 1: Authentic capability data

**Files:**
- Modify: `grading-by-question-demo.html:1880-2180`
- Test: `tests/collection-pages.test.cjs:560-720`

- [x] **Step 1: Add failing data tests**

```js
test('first homework defines authentic AI grading capability cases', () => {
  assert.match(gradingPage, /capability:\s*\{\s*key:\s*"multiple-solutions",\s*label:\s*"多解"/);
  assert.match(gradingPage, /配方法[\s\S]*公式法[\s\S]*两根中点法/);
  assert.match(gradingPage, /用配方法求 y = 2x² − 8x \+ 5 的顶点坐标和最小值/);
  assert.match(gradingPage, /顶点式[\s\S]*一般式/);
  assert.match(gradingPage, /平方项非负[\s\S]*顶点是最低点/);
  assert.match(gradingPage, /S = x\(20 − 2x\)/);
});

test('first homework expands explicit result profiles to thirty students', () => {
  assert.match(gradingPage, /function expandCapabilityStudents\(question\)/);
  assert.match(gradingPage, /Object\.entries\(question\.resultDistribution\)/);
  assert.match(gradingPage, /resultProfiles\[result\]/);
});
```

- [x] **Step 2: Verify RED**

Run:

```bash
node --test --test-name-pattern="authentic AI grading capability|explicit result profiles" tests/collection-pages.test.cjs
```

Expected: both tests fail because the metadata and expansion helper are absent.

- [x] **Step 3: Replace first-homework data**

Use this concrete shape for question 2 and equivalent explicit profiles for questions 3–6:

```js
{
  id: 2,
  title: "求对称轴和最小值",
  type: "解答题 · 一题多解",
  capability: { key: "multiple-solutions", label: "多解" },
  answer: "对称轴 x = 2；最小值 −1",
  acceptedMethods: ["配方法", "公式法", "两根中点法"],
  gradingSummary: "识别 3 种有效解法",
  resultDistribution: { correct: 18, partial: 6, wrong: 4, ungraded: 2 },
  resultProfiles: {
    correct: [
      { method: "配方法", answer: "y=(x−2)²−1，所以对称轴x=2，最小值−1" },
      { method: "公式法", answer: "x=−b/2a=2，代入得最小值−1" },
      { method: "两根中点法", answer: "x₁=1，x₂=3，中点为2，代入得−1" }
    ],
    partial: [{ answer: "对称轴是x=2", evidence: "只完成对称轴" }],
    wrong: [{ answer: "x=−2，最小值1", evidence: "符号判断错误" }],
    ungraded: [{ answer: "未作答" }]
  }
}
```

Question 3 defines four scored process steps. Question 4 accepts vertex and general forms. Question 5 defines three teacher criteria and matched/missing criteria. Question 6 defines five modeling steps including domain and unit.

- [x] **Step 4: Expand profiles to 30 shared students**

```js
function expandCapabilityStudents(question) {
  const resultSequence = Object.entries(question.resultDistribution)
    .flatMap(([result, count]) => Array(Number(count)).fill(result))
    .slice(0, CLASS_SIZE);
  const offsets = {};
  return students.map((name, index) => {
    const result = resultSequence[index] || "ungraded";
    const profiles = question.resultProfiles[result];
    const offset = offsets[result] || 0;
    const profile = profiles[offset % profiles.length];
    offsets[result] = offset + 1;
    return {
      id: `${question.id}-${index}`,
      name,
      result,
      ...profile,
      steps: profile.steps?.map((step) => ({ ...step })),
      matchedCriteria: profile.matchedCriteria ? [...profile.matchedCriteria] : [],
      missingCriteria: profile.missingCriteria ? [...profile.missingCriteria] : [],
      regradeResult: profile.regradeResult || result
    };
  });
}
```

Call this from `expandQuestionStudents()` only for `usesPaperDirectGrading && question.resultProfiles`.

- [x] **Step 5: Verify GREEN and commit**

```bash
node --test --test-name-pattern="authentic AI grading capability|explicit result profiles" tests/collection-pages.test.cjs
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: add authentic AI grading cases"
```

### Task 2: Verifiable evidence in question grading

**Files:**
- Modify: `grading-by-question-demo.html:220-960, 2410-2460, 3120-3270`
- Test: `tests/collection-pages.test.cjs:620-740`

- [x] **Step 1: Add the failing rendering test**

```js
test('question grading renders verifiable AI capability evidence', () => {
  assert.match(gradingPage, /function capabilityBadgeMarkup\(question\)/);
  assert.match(gradingPage, /class="q-capability"/);
  assert.match(gradingPage, /function capabilityProofMarkup\(question\)/);
  assert.match(gradingPage, /class="capability-proof"/);
  assert.match(gradingPage, /AI 已完成本题批改/);
  assert.match(gradingPage, /function studentEvidenceMarkup\(question, student\)/);
  assert.match(gradingPage, /solution-method-tag/);
  assert.match(gradingPage, /step-evidence/);
  assert.match(gradingPage, /criterion-chip/);
});
```

- [x] **Step 2: Verify RED**

```bash
node --test --test-name-pattern="verifiable AI capability evidence" tests/collection-pages.test.cjs
```

- [x] **Step 3: Add compact evidence styles**

```css
.q-capability { display:inline-flex; padding:2px 6px; border-radius:6px; color:#536a9e; background:#edf2ff; font-size:9px; font-weight:800; }
.capability-proof { margin:0 0 16px; padding:14px 16px; border:1px solid #dbe4f7; border-radius:12px; background:linear-gradient(135deg,#f7f9ff,#fff); }
.capability-proof__facts { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.solution-method-tag { display:inline-flex; padding:3px 7px; border-radius:999px; color:#177c58; background:#eaf8f2; font-size:9px; font-weight:800; }
.step-evidence { display:grid; gap:5px; margin-top:8px; }
.criterion-chip { display:inline-flex; margin:6px 5px 0 0; padding:3px 6px; border-radius:6px; font-size:9px; }
.criterion-chip.is-hit { color:#16845c; background:#eaf8f2; }
.criterion-chip.is-missing { color:#c56a14; background:#fff4e5; }
```

- [x] **Step 4: Render badge, proof strip, and student evidence**

```js
function capabilityBadgeMarkup(question) {
  return usesPaperDirectGrading && question.capability
    ? `<span class="q-capability">${question.capability.label}</span>`
    : "";
}

function capabilityProofMarkup(question) {
  if (!usesPaperDirectGrading || !question.capability) return "";
  const reviewed = question.students.filter((student) => student.result !== "ungraded").length;
  return `<section class="capability-proof">
    <div>✦ AI 已完成本题批改</div>
    <div class="capability-proof__facts">
      <span>${reviewed}份已批改</span><span>${question.gradingSummary}</span>
    </div>
  </section>`;
}

function studentEvidenceMarkup(question, student) {
  if (!usesPaperDirectGrading) return "";
  const method = student.method ? `<span class="solution-method-tag">${student.method}</span>` : "";
  const steps = student.steps?.length ? `<div class="step-evidence">${student.steps.map((step) =>
    `<div><span class="mark-icon ${step.result}"></span><span>${step.text}</span></div>`
  ).join("")}</div>` : "";
  const criteria = [
    ...(student.matchedCriteria || []).map((item) => `<span class="criterion-chip is-hit">✓ ${item}</span>`),
    ...(student.missingCriteria || []).map((item) => `<span class="criterion-chip is-missing">缺少 ${item}</span>`)
  ].join("");
  return `${method}${steps}${criteria}`;
}
```

Use these in `renderQuestions()`, `renderGroups()`, and `studentCard()`.

- [x] **Step 5: Verify and commit**

```bash
node --test --test-name-pattern="verifiable AI capability evidence" tests/collection-pages.test.cjs
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: show AI grading evidence"
```

### Task 3: Process and semantic evidence on the original paper

**Files:**
- Modify: `grading-by-question-demo.html:1070-1380, 2300-2410, 2490-2605`
- Test: `tests/collection-pages.test.cjs:575-680`

- [x] **Step 1: Add the failing paper test**

```js
test('first homework paper shows process and semantic grading evidence', () => {
  assert.match(gradingPage, /function studentPaperEvidenceMarkup\(question, student\)/);
  assert.match(gradingPage, /student-paper-step/);
  assert.match(gradingPage, /student-paper-rubric/);
  assert.match(gradingPage, /求函数 y = x² − 4x \+ 3 的对称轴和最小值/);
  assert.match(gradingPage, /用配方法求 y = 2x² − 8x \+ 5/);
  assert.match(gradingPage, /无论 x 取何值，y 都不小于 1/);
  assert.match(gradingPage, /20 米长的围栏靠墙围成一个矩形花圃/);
});
```

- [x] **Step 2: Verify RED**

```bash
node --test --test-name-pattern="paper shows process and semantic" tests/collection-pages.test.cjs
```

- [x] **Step 3: Update snapshots and paper templates**

Replace `firstHomeworkSnapshotCopy` and `firstHomeworkPaperQuestionMarkup()` entries 2–6 with approved authentic wording. Keep question 1 unchanged so the four-student same-answer suggestion remains available.

- [x] **Step 4: Render line and rubric evidence**

```js
function studentPaperEvidenceMarkup(question, student) {
  if (!student) return "";
  const steps = student.steps?.length ? `<div class="student-paper-steps">${student.steps.map((step) => `
    <div class="student-paper-step"><span>${step.text}</span><span class="mark-icon ${step.result}"></span></div>
  `).join("")}</div>` : "";
  const criteria = [
    ...(student.matchedCriteria || []).map((item) => `<span class="student-paper-rubric is-hit">✓ ${item}</span>`),
    ...(student.missingCriteria || []).map((item) => `<span class="student-paper-rubric is-missing">缺少 ${item}</span>`)
  ].join("");
  return `${steps}${criteria ? `<div class="student-paper-rubrics">${criteria}</div>` : ""}`;
}
```

Append it inside questions 2–6 and add restrained paper CSS.

- [x] **Step 5: Verify and commit**

```bash
node --test --test-name-pattern="paper shows process and semantic|type-appropriate question content|places grading marks" tests/collection-pages.test.cjs
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: annotate authentic grading process"
```

### Task 4: Teacher rule editing and immediate regrade

**Files:**
- Modify: `grading-by-question-demo.html:430-960, 1740-1790, 2190-2460, 3290-3420`
- Test: `tests/collection-pages.test.cjs:650-760`

- [x] **Step 1: Add the failing regrade test**

```js
test('teacher rule save immediately regrades only the active question', () => {
  assert.match(gradingPage, /id="editGradingRule"/);
  assert.match(gradingPage, /id="gradingRuleEditor"/);
  assert.match(gradingPage, /保存后将立即按新标准重新批改本题全班30人/);
  assert.match(gradingPage, /function startQuestionRegrade\(question\)/);
  assert.match(gradingPage, /student\.result = student\.regradeResult/);
  assert.match(gradingPage, /正在按新标准重新批改本题/);
  assert.match(gradingPage, /本题全班重批完成/);
  assert.doesNotMatch(gradingPage, /撤销本次重批/);
});
```

- [x] **Step 2: Verify RED**

```bash
node --test --test-name-pattern="immediately regrades only the active question" tests/collection-pages.test.cjs
```

- [x] **Step 3: Add the compact editor**

```html
<button class="rule-edit-button" id="editGradingRule" type="button">编辑标准</button>
<form class="grading-rule-editor" id="gradingRuleEditor" hidden>
  <label for="gradingRuleInput">批改标准与得分要求</label>
  <textarea id="gradingRuleInput" rows="6"></textarea>
  <p>保存后将立即按新标准重新批改本题全班30人，并覆盖本题已有批改结果。</p>
  <button type="button" data-rule-cancel>取消</button>
  <button type="submit">保存并重新批改</button>
</form>
<div class="question-regrade-status" id="questionRegradeStatus" hidden></div>
```

Hide the editor outside `cluster-homework`.

- [x] **Step 4: Implement active-question regrading**

```js
const regradingQuestions = new Set();

function startQuestionRegrade(question) {
  if (!usesPaperDirectGrading || regradingQuestions.has(question.id)) return;
  regradingQuestions.add(question.id);
  const before = question.students.map((student) => student.result);
  let completed = 0;
  renderAll();
  const timer = window.setInterval(() => {
    completed = Math.min(CLASS_SIZE, completed + 6);
    question.regradeProgress = completed;
    if (activeQuestionId === question.id) renderRegradeStatus(question);
    if (completed < CLASS_SIZE) return;
    window.clearInterval(timer);
    question.students.forEach((student) => {
      student.result = student.regradeResult || student.result;
      delete student.partResults;
    });
    question.accuracy = Math.round(
      question.students.filter((student) => student.result === "correct").length / CLASS_SIZE * 100
    );
    question.regradeChanges = question.students.filter(
      (student, index) => student.result !== before[index]
    ).length;
    regradingQuestions.delete(question.id);
    renderAll();
    showToast(`本题全班重批完成：${question.regradeChanges}人结果发生变化`);
  }, 120);
}
```

Form submission replaces `question.basis` with non-empty trimmed lines and calls `startQuestionRegrade(question)`. Disable only the regrading question's result actions and edit button. Switching questions does not cancel the timer.

- [x] **Step 5: Verify and commit**

```bash
node --test --test-name-pattern="immediately regrades only the active question" tests/collection-pages.test.cjs
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: regrade question from teacher rules"
```

### Task 5: Full verification

**Files:**
- Modify if needed: `grading-by-question-demo.html`
- Modify if needed: `tests/collection-pages.test.cjs`

- [x] **Step 1: Run all regression tests**

```bash
node --test tests/collection-pages.test.cjs
```

Expected: all tests pass.

- [x] **Step 2: Parse inline scripts**

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('grading-by-question-demo.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
scripts.forEach((source) => new Function(source));
console.log(`inline scripts parsed: ${scripts.length}`);
NODE
```

Expected: `inline scripts parsed: 2`.

- [x] **Step 3: Check patch hygiene**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors and only planned files are modified.

- [x] **Step 4: Commit integration fixes if the worktree is not already clean**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs docs/superpowers/plans/2026-08-19-first-homework-ai-grading-proof.md
git commit -m "feat: prove authentic AI grading capabilities"
```

