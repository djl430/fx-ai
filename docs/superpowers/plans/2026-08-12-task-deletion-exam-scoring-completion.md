# Task Deletion, Exam Scoring, and Completion State Implementation Plan

> **Final-scope amendment (2026-08-12):** The user withdrew grading-task deletion after implementation. Task 2 is superseded: the final task list exposes no delete control or delete dialog, and stale deleted-task IDs are cleared on load. Sample/page deletion remains in scope. Sample demo pages also render distinct per-page content.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent deletion for all grading tasks, editable sample papers and pages; route generated exams to scoring mode; and write completed grading state back to the task list.

**Architecture:** Extend `collection-flow.js` with pure task-state and sample-deletion helpers, while keeping browser storage and rendering inside the existing HTML pages. Use one versioned `fxTaskListState` record for deleted and confirmed task IDs, keep generated task metadata in `fxGeneratedCollectionTasks`, and pass `taskId` plus `mode` into the shared grading page.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser `localStorage`, Node.js built-in test runner.

---

### Task 1: Add Pure State and Deletion Helpers

**Files:**
- Modify: `collection-flow.js`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Write failing tests for task state and sample deletion**

Add tests that exercise real helpers without browser mocks:

```js
test('applies persistent deleted and confirmed task state by task id', () => {
  const tasks = [
    { id: 'keep', status: '待确认', listTag: '待确认' },
    { id: 'done', status: '待确认', listTag: '待确认' },
    { id: 'remove', status: '待确认', listTag: '待确认' },
  ];
  const state = {
    version: 1,
    deletedTaskIds: ['remove'],
    confirmedTaskIds: ['done'],
  };

  assert.deepEqual(flow.applyTaskListState(tasks, state).map((task) => [task.id, task.status]), [
    ['keep', '待确认'],
    ['done', '已确认'],
  ]);
});

test('marks one task deleted or confirmed without affecting other ids', () => {
  const deleted = flow.markTaskDeleted(null, 'task-1');
  const confirmed = flow.markTaskConfirmed(deleted, 'task-2');

  assert.deepEqual(confirmed.deletedTaskIds, ['task-1']);
  assert.deepEqual(confirmed.confirmedTaskIds, ['task-2']);
});

test('removes an entire sample group or one page', () => {
  const groups = [
    { id: 'g1', pages: [{ id: 'p1' }, { id: 'p2' }] },
    { id: 'g2', pages: [{ id: 'p3' }] },
  ];

  assert.deepEqual(flow.removeSampleGroup(groups, 'g2').map((group) => group.id), ['g1']);
  assert.deepEqual(flow.removeSamplePage(groups, 'g1', 'p1')[0].pages.map((page) => page.id), ['p2']);
});
```

- [ ] **Step 2: Run the helper tests and verify RED**

Run:

```bash
node --test tests/collection-flow.test.cjs
```

Expected: FAIL because `applyTaskListState`, `markTaskDeleted`, `markTaskConfirmed`, `removeSampleGroup`, and `removeSamplePage` do not exist.

- [ ] **Step 3: Implement the minimal pure helpers**

Add these functions and exports to `collection-flow.js`:

```js
const normalizeTaskListState = (state) => ({
  version: 1,
  deletedTaskIds: [...new Set(Array.isArray(state?.deletedTaskIds) ? state.deletedTaskIds : [])],
  confirmedTaskIds: [...new Set(Array.isArray(state?.confirmedTaskIds) ? state.confirmedTaskIds : [])],
});

const markTaskDeleted = (state, taskId) => {
  const next = normalizeTaskListState(state);
  if (taskId && !next.deletedTaskIds.includes(taskId)) next.deletedTaskIds.push(taskId);
  next.confirmedTaskIds = next.confirmedTaskIds.filter((id) => id !== taskId);
  return next;
};

const markTaskConfirmed = (state, taskId) => {
  const next = normalizeTaskListState(state);
  if (taskId && !next.confirmedTaskIds.includes(taskId)) next.confirmedTaskIds.push(taskId);
  return next;
};

const applyTaskListState = (tasks, state) => {
  const normalized = normalizeTaskListState(state);
  return (Array.isArray(tasks) ? tasks : [])
    .filter((task) => !normalized.deletedTaskIds.includes(task.id))
    .map((task) => normalized.confirmedTaskIds.includes(task.id)
      ? { ...task, status: '已确认', listTag: '已确认', progress: 100 }
      : task);
};

const removeSampleGroup = (groups, groupId) => (Array.isArray(groups) ? groups : [])
  .filter((group) => group.id !== groupId);

const removeSamplePage = (groups, groupId, pageId) => (Array.isArray(groups) ? groups : [])
  .map((group) => group.id === groupId
    ? { ...group, pages: group.pages.filter((page) => page.id !== pageId) }
    : group);
```

- [ ] **Step 4: Run the helper tests and verify GREEN**

Run `node --test tests/collection-flow.test.cjs`.

Expected: all helper and existing collection-flow tests pass.

- [ ] **Step 5: Commit helper behavior**

```bash
git add collection-flow.js tests/collection-flow.test.cjs
git commit -m "feat: add persistent task and sample deletion state"
```

### Task 2: Add Persistent Task Deletion to the Main List

**Files:**
- Modify: `index.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write failing page-contract tests**

Add assertions for the delete action, dialog, task-state storage, and generated-task persistence:

```js
test('all grading tasks expose persistent confirmed deletion', () => {
  assert.match(indexPage, /data-action="request-delete-task"/);
  assert.match(indexPage, /data-action="confirm-delete-task"/);
  assert.match(indexPage, /role="dialog"/);
  assert.match(indexPage, /fxTaskListState/);
  assert.match(indexPage, /markTaskDeleted/);
  assert.match(indexPage, /fxGeneratedCollectionTasks/);
});
```

- [ ] **Step 2: Run the page test and verify RED**

Run `node --test tests/collection-pages.test.cjs`.

Expected: FAIL because task delete actions and `fxTaskListState` are absent.

- [ ] **Step 3: Apply stored task state during task initialization**

Read `fxTaskListState` safely, normalize it, then apply it after merging built-in and generated tasks:

```js
let taskListState = FxCollectionFlow.normalizeTaskListState(null);
try {
  taskListState = FxCollectionFlow.normalizeTaskListState(
    JSON.parse(localStorage.getItem('fxTaskListState') || 'null')
  );
} catch (_) {}

tasks = FxCollectionFlow.applyTaskListState(tasks, taskListState);
```

- [ ] **Step 4: Render a non-nested task row with a hover delete button**

Replace the outer task `<button>` with a wrapper containing separate open and delete buttons:

```html
<article class="task-row" data-task-id="${task.id}">
  <button class="task-row__open" type="button" data-action="open-task" data-task-id="${task.id}">…</button>
  <button class="task-row__delete" type="button" data-action="request-delete-task"
    data-task-id="${task.id}" aria-label="删除${escapeHtml(task.title)}">×</button>
</article>
```

Add CSS so `.task-row__delete` appears on `.task-row:hover` and `.task-row:focus-within`, is placed at the top-right, and uses a red danger hover state.

- [ ] **Step 5: Render and operate the confirmation dialog**

Add `deleteTaskId` to view state. Render a modal only when it is set, including task name and `取消 / 确认删除` actions. Clicking the backdrop or pressing Escape clears `deleteTaskId` without mutation.

On confirmation:

```js
const taskId = state.deleteTaskId;
taskListState = FxCollectionFlow.markTaskDeleted(taskListState, taskId);
localStorage.setItem('fxTaskListState', JSON.stringify(taskListState));
tasks = tasks.filter((task) => task.id !== taskId);
localStorage.setItem(
  'fxGeneratedCollectionTasks',
  JSON.stringify(tasks.filter((task) => task.generated))
);
state.deleteTaskId = null;
state.toast = '任务已删除';
render();
```

- [ ] **Step 6: Run page and full tests**

Run:

```bash
node --test tests/collection-pages.test.cjs
node --test tests/*.cjs
```

Expected: all tests pass; task rows remain navigable through `.task-row__open`.

- [ ] **Step 7: Commit task deletion UI**

```bash
git add index.html tests/collection-pages.test.cjs
git commit -m "feat: add task list deletion"
```

### Task 3: Add Sample-Paper and Page Deletion

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write failing contracts for editable-only deletion**

```js
test('editable collection pages can delete a sample or page with confirmation', () => {
  assert.match(confirmPage, /data-action="request-delete-sample"/);
  assert.match(confirmPage, /data-action="request-delete-page"/);
  assert.match(confirmPage, /data-action="confirm-delete-collection-item"/);
  assert.match(confirmPage, /removeSampleGroup/);
  assert.match(confirmPage, /removeSamplePage/);
  assert.match(confirmPage, /readOnly\s*\?\s*['"]['"]/);
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run `node --test tests/collection-pages.test.cjs`.

Expected: FAIL because sample and page delete actions do not exist.

- [ ] **Step 3: Render hover delete controls only when editable**

In `renderGroup`, add a sample delete button only when `readOnly` is false. In `renderPage`, pass `group.id`, and add the page delete button only when editable:

```html
${readOnly ? '' : `<button class="sample-delete" type="button"
  data-action="request-delete-sample" data-group-id="${group.id}"
  aria-label="删除样卷${escapeHtml(group.name)}">×</button>`}
```

```html
${readOnly ? '' : `<button class="page-delete" type="button"
  data-action="request-delete-page" data-group-id="${groupId}"
  data-page-id="${page.id}" aria-label="删除第${pageIndex + 1}页">×</button>`}
```

Place each button at the corresponding top-right corner and reveal it on hover or `:focus-within`. While the page delete button is visible, hide the page-number badge to prevent overlap.

- [ ] **Step 4: Add the shared collection-item confirmation dialog**

Track a `pendingDelete` object with `type`, `groupId`, `pageId`, and display name. The modal message distinguishes whole-sample deletion from one-page deletion. Cancel, backdrop, and Escape clear `pendingDelete`.

On confirmation:

```js
groups = pendingDelete.type === 'sample'
  ? FxCollectionFlow.removeSampleGroup(groups, pendingDelete.groupId)
  : FxCollectionFlow.removeSamplePage(groups, pendingDelete.groupId, pendingDelete.pageId);
pendingDelete = null;
formMessage.textContent = '已删除';
render();
renderDeleteDialog();
```

- [ ] **Step 5: Run page and full tests**

Run `node --test tests/collection-pages.test.cjs && node --test tests/*.cjs`.

Expected: all tests pass; existing read-only guards and confirmation validation remain intact.

- [ ] **Step 6: Commit sample deletion UI**

```bash
git add collection-confirm.html tests/collection-pages.test.cjs
git commit -m "feat: delete sample papers and pages"
```

### Task 4: Route Generated Exams to Scoring Mode

**Files:**
- Modify: `index.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write a failing route contract**

```js
test('generated homework and exams select grading mode from task kind', () => {
  assert.match(indexPage, /mode:\s*task\.kind\s*===\s*["']考试["']\s*\?\s*["']exam["']\s*:\s*["']homework["']/);
  assert.match(indexPage, /taskId:\s*task\.id/);
});
```

- [ ] **Step 2: Run the route contract and verify RED**

Run `node --test tests/collection-pages.test.cjs`.

Expected: FAIL because generated tasks currently hard-code `mode: "homework"` and omit `taskId`.

- [ ] **Step 3: Use task type for mode and pass stable ID**

Build generated-task query parameters as:

```js
const query = new URLSearchParams({
  mode: task.kind === '考试' ? 'exam' : 'homework',
  taskId: task.id,
  taskTitle: task.title,
  taskKind: task.kind,
  className: task.className,
  students: String(task.students),
  pages: String(task.pages),
});
```

Also append `taskId` to built-in homework and exam grading URLs so completion state can update every list task.

- [ ] **Step 4: Run page and full tests**

Run `node --test tests/collection-pages.test.cjs && node --test tests/*.cjs`.

Expected: all tests pass; the grading page's existing `isExam` branches provide assignment controls for exams.

- [ ] **Step 5: Commit type-aware routing**

```bash
git add index.html tests/collection-pages.test.cjs
git commit -m "fix: route generated exams to scoring mode"
```

### Task 5: Persist Full-Grading Completion and Reflect It on the List

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `index.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write failing completion contracts**

```js
test('grading completion is persisted by task id and reflected on the list', () => {
  assert.match(gradingPage, /params\.get\(["']taskId["']\)/);
  assert.match(gradingPage, /questions\.every\(.*status\s*===\s*["']completed["']/s);
  assert.match(gradingPage, /markTaskConfirmed/);
  assert.match(gradingPage, /fxTaskListState/);
  assert.match(indexPage, /applyTaskListState/);
  assert.match(indexPage, /已确认/);
});
```

- [ ] **Step 2: Run the completion contract and verify RED**

Run `node --test tests/collection-pages.test.cjs`.

Expected: FAIL because the grading page does not read `taskId` or persist completion.

- [ ] **Step 3: Load the stable task ID and centralize completion checking**

In the grading page, read `taskId` and add:

```js
const taskId = params.get('taskId') || '';

function persistTaskCompletionIfReady() {
  if (!taskId || !questions.every((question) => question.status === 'completed')) return false;
  let taskListState = FxCollectionFlow.normalizeTaskListState(null);
  try {
    taskListState = FxCollectionFlow.normalizeTaskListState(
      JSON.parse(localStorage.getItem('fxTaskListState') || 'null')
    );
  } catch (_) {}
  taskListState = FxCollectionFlow.markTaskConfirmed(taskListState, taskId);
  localStorage.setItem('fxTaskListState', JSON.stringify(taskListState));

  try {
    const generated = JSON.parse(localStorage.getItem('fxGeneratedCollectionTasks') || '[]');
    localStorage.setItem('fxGeneratedCollectionTasks', JSON.stringify(generated.map((task) =>
      task.id === taskId ? { ...task, status: '已确认', listTag: '已确认', progress: 100 } : task
    )));
  } catch (_) {}
  return true;
}
```

Load `collection-flow.js` before the grading page's inline script.

- [ ] **Step 4: Call completion checking from both confirmation paths**

After “确认全部” marks all questions completed, call `persistTaskCompletionIfReady()`. After “确认本题” completes one question, call the same function; when it returns true, update and disable the “确认全部” button with homework or exam-specific text.

- [ ] **Step 5: Reapply confirmed state on every list load**

After merging built-in and generated tasks in `index.html`, call:

```js
tasks = FxCollectionFlow.applyTaskListState(tasks, taskListState);
```

The existing `taskRow` status-class selection should render `listTag === '已确认'` with the standard completed badge rather than the warning badge.

- [ ] **Step 6: Run focused and full verification**

Run:

```bash
node --test tests/collection-pages.test.cjs
node --test tests/*.cjs
node --check collection-flow.js
git diff --check
```

Expected: all tests and syntax checks pass with no whitespace errors.

- [ ] **Step 7: Commit completion state flow**

```bash
git add grading-by-question-demo.html index.html tests/collection-pages.test.cjs
git commit -m "feat: persist completed grading status"
```

### Task 6: Final Regression Verification

**Files:**
- Verify: `collection-flow.js`
- Verify: `collection-confirm.html`
- Verify: `index.html`
- Verify: `grading-by-question-demo.html`
- Verify: `tests/collection-flow.test.cjs`
- Verify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Parse every changed inline script**

Run:

```bash
node -e 'const fs=require("fs"); for (const file of ["collection-confirm.html","collection-history.html","index.html","grading-by-question-demo.html"]) { const html=fs.readFileSync(file,"utf8"); [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].forEach((match,index)=>{ try { new Function(match[1]); } catch(error) { throw new Error(`${file} inline script ${index+1}: ${error.message}`); } }); }'
```

Expected: exit code 0.

- [ ] **Step 2: Run the complete test suite**

Run `node --test tests/*.cjs`.

Expected: zero failed tests.

- [ ] **Step 3: Check final diff hygiene**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the intended implementation and test files are modified.
