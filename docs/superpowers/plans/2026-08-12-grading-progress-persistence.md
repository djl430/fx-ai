# Grading Progress Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start every grading question as pending, persist teacher-confirmed question IDs per task, restore them after refresh, and focus the first remaining pending question.

**Architecture:** Add pure progress normalization and update helpers to `collection-flow.js`, then keep `localStorage` I/O in `grading-by-question-demo.html`. The page applies persisted IDs after constructing the active question variant and derives the active question from the first pending item.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser `localStorage`, Node.js built-in test runner.

---

### Task 1: Add Pure Grading Progress Helpers

**Files:**
- Modify: `collection-flow.js`
- Modify: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Write failing helper tests**

```js
test('normalizes and updates grading progress by task id', () => {
  const initial = flow.normalizeGradingProgress({
    version: 1,
    tasks: { taskA: { completedQuestionIds: [1, 2, 2, 'bad'], updatedAt: 10 } },
  });
  assert.deepEqual(initial.tasks.taskA.completedQuestionIds, [1, 2]);

  const next = flow.markQuestionCompleted(initial, 'taskA', 3, 20);
  assert.deepEqual(next.tasks.taskA.completedQuestionIds, [1, 2, 3]);
  assert.equal(next.tasks.taskA.updatedAt, 20);
});

test('applies only valid completed question ids and finds first pending', () => {
  const questions = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const applied = flow.applyGradingProgress(questions, {
    version: 1,
    tasks: { taskA: { completedQuestionIds: [2, 99] } },
  }, 'taskA');

  assert.deepEqual(applied.map((question) => question.status), ['pending', 'completed', 'pending']);
  assert.equal(flow.firstPendingQuestionId(applied), 1);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test --test-name-pattern="grading progress|first pending" tests/collection-flow.test.cjs`

Expected: FAIL because the helpers are undefined.

- [ ] **Step 3: Implement the helpers**

Add to `collection-flow.js` and export them:

```js
const normalizeGradingProgress = (value) => {
  const tasks = {};
  if (value && value.version === 1 && value.tasks && typeof value.tasks === 'object') {
    Object.entries(value.tasks).forEach(([taskId, record]) => {
      const completedQuestionIds = [...new Set((Array.isArray(record?.completedQuestionIds) ? record.completedQuestionIds : [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0))];
      tasks[taskId] = { completedQuestionIds, updatedAt: Number(record?.updatedAt) || 0 };
    });
  }
  return { version: 1, tasks };
};

const markQuestionCompleted = (state, taskId, questionId, updatedAt = Date.now()) => {
  const next = normalizeGradingProgress(state);
  const current = next.tasks[taskId] || { completedQuestionIds: [], updatedAt: 0 };
  return {
    ...next,
    tasks: {
      ...next.tasks,
      [taskId]: {
        completedQuestionIds: [...new Set([...current.completedQuestionIds, Number(questionId)])],
        updatedAt,
      },
    },
  };
};

const applyGradingProgress = (questions, state, taskId) => {
  const completedIds = new Set(normalizeGradingProgress(state).tasks[taskId]?.completedQuestionIds || []);
  return questions.map((question) => ({
    ...question,
    status: completedIds.has(Number(question.id)) ? 'completed' : 'pending',
  }));
};

const firstPendingQuestionId = (questions) =>
  questions.find((question) => question.status !== 'completed')?.id ?? questions[0]?.id ?? null;
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test --test-name-pattern="grading progress|first pending" tests/collection-flow.test.cjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add collection-flow.js tests/collection-flow.test.cjs
git commit -m "feat: add grading progress state helpers"
```

### Task 2: Make Every Initial Question Pending

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Modify: `grading-by-question-demo.html`

- [ ] **Step 1: Write a failing page contract test**

```js
test('grading starts pending and selects the first pending question', () => {
  assert.doesNotMatch(gradingPage, /status:\s*["']completed["']/);
  assert.match(gradingPage, /applyGradingProgress/);
  assert.match(gradingPage, /firstPendingQuestionId/);
  assert.match(gradingPage, /fxGradingProgress/);
});
```

- [ ] **Step 2: Run it and verify RED**

Run: `node --test --test-name-pattern="grading starts pending" tests/collection-pages.test.cjs`

Expected: FAIL because several seed questions are pre-completed.

- [ ] **Step 3: Change all question seed statuses to pending**

In every default, similarity-grouping, and exam question object, use:

```js
status: "pending"
```

Do not hard-code `activeQuestionId` by variant.

- [ ] **Step 4: Load persisted progress after the final question array is built**

```js
const gradingProgressKey = taskId || `demo:${isExam ? 'exam' : isSimilarityGrouping ? 'similar' : 'homework'}`;
let gradingProgress = FxCollectionFlow.normalizeGradingProgress(null);
try {
  gradingProgress = FxCollectionFlow.normalizeGradingProgress(JSON.parse(localStorage.getItem('fxGradingProgress') || 'null'));
} catch (_) {}

questions = FxCollectionFlow.applyGradingProgress(questions, gradingProgress, gradingProgressKey);
let activeQuestionId = FxCollectionFlow.firstPendingQuestionId(questions);
```

If every question is restored as completed, call `showTaskCompletion()` after controls exist.

- [ ] **Step 5: Run the page contract test and verify GREEN**

Run: `node --test --test-name-pattern="grading starts pending" tests/collection-pages.test.cjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: start grading questions pending"
```

### Task 3: Persist Single and Bulk Confirmation

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Extend the contract test with persistence and next-pending behavior**

```js
assert.match(gradingPage, /markQuestionCompleted/);
assert.match(gradingPage, /localStorage\.setItem\(["']fxGradingProgress["']/);
assert.match(gradingPage, /find\(\(question\)\s*=>\s*question\.status\s*!==\s*["']completed["']/);
```

Run: `node --test --test-name-pattern="grading starts pending" tests/collection-pages.test.cjs`

Expected: FAIL because confirmations do not yet persist per-question IDs.

- [ ] **Step 2: Add one storage helper in the page**

```js
function saveGradingProgress() {
  try {
    localStorage.setItem('fxGradingProgress', JSON.stringify(gradingProgress));
  } catch (_) {}
}
```

- [ ] **Step 3: Persist Confirm All**

In the Confirm All handler:

```js
questions.forEach((question) => {
  question.status = 'completed';
  gradingProgress = FxCollectionFlow.markQuestionCompleted(gradingProgress, gradingProgressKey, question.id);
});
saveGradingProgress();
```

Then keep the existing task-list completion update.

- [ ] **Step 4: Persist one question and move to the first remaining pending item**

In the single-question handler:

```js
questions[currentIndex].status = 'completed';
gradingProgress = FxCollectionFlow.markQuestionCompleted(
  gradingProgress,
  gradingProgressKey,
  questions[currentIndex].id,
);
saveGradingProgress();

const nextQuestion = questions.find((question) => question.status !== 'completed');
if (nextQuestion) activeQuestionId = nextQuestion.id;
```

This deliberately replaces `questions[currentIndex + 1]` so restored/non-linear progress always goes to the first pending item.

- [ ] **Step 5: Run focused and full tests**

Run: `node --test --test-name-pattern="grading starts pending|grading completion" tests/collection-pages.test.cjs`

Expected: PASS.

Run: `node --test tests/*.cjs`

Expected: all tests pass with zero failures.

- [ ] **Step 6: Parse inline scripts**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('grading-by-question-demo.html', 'utf8');
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new Function(match[1]);
}
console.log('grading inline scripts parse OK');
NODE
```

Expected: `grading inline scripts parse OK`.

- [ ] **Step 7: Commit**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: persist per-question grading progress"
```

### Task 4: Final Verification

**Files:**
- Verify: `collection-flow.js`
- Verify: `grading-by-question-demo.html`
- Verify: `index.html`
- Verify: `tests/*.cjs`

- [ ] **Step 1: Run the complete suite**

Run: `node --test tests/*.cjs`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Check syntax and repository state**

Run: `node --check collection-flow.js && git diff --check && git status --short`

Expected: no errors and a clean worktree after commits.

