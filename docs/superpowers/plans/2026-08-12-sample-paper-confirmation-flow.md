# Sample Paper Confirmation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scanned sample groups editable and draggable, then create one list task for every confirmed non-empty homework or exam group.

**Architecture:** Keep the existing three-page static HTML flow. Put storage validation and task construction in a small browser/CommonJS-compatible `collection-flow.js` module so the rules can be tested without a DOM; keep rendering and drag/drop behavior in the relevant pages. `localStorage` carries one versioned confirmed batch into `index.html`, where batch IDs are deduplicated before tasks are prepended.

**Tech Stack:** HTML, CSS, vanilla JavaScript, browser `localStorage`, Node.js built-in test runner.

---

## File Structure

- Create `collection-flow.js`: pure validation, batch serialization, and task construction helpers shared by confirmation and list pages.
- Create `tests/collection-flow.test.cjs`: Node tests for non-empty filtering, task mapping, malformed storage, and deduplication.
- Create `tests/collection-pages.test.cjs`: source-level contract tests for required page controls, wrapping layout, target navigation, reminder wording, and removed auto-redirect.
- Modify `collection-confirm.html`: editable groups, wrapping pages, add-group control, drag/drop, live count, empty-group messaging, and direct confirmation handoff.
- Modify `index.html`: load confirmed batches, prepend generated tasks, display the pending-collection reminder bubble, and remain on the list after confirmation.
- Modify `collection-history.html`: remove the confirmation-success auto-redirect and legacy processing state coupling.

### Task 1: Shared Collection Flow Model

**Files:**
- Create: `collection-flow.js`
- Create: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Write the failing model tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const flow = require('../collection-flow.js');

test('keeps only non-empty sample groups', () => {
  const groups = flow.validGroups([
    { name: '分数乘法练习', kind: '作业', pages: [{ id: 'p1' }] },
    { name: '空分组', kind: '考试', pages: [] }
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, '分数乘法练习');
});

test('maps homework and exam groups to list tasks', () => {
  const tasks = flow.buildTasks({
    batchId: 'batch-1',
    createdAt: 1786550400000,
    groups: [
      { name: '分数乘法练习', kind: '作业', students: 31, pages: [{}, {}, {}, {}] },
      { name: '第三单元测试', kind: '考试', students: 30, pages: [{}, {}] }
    ]
  });
  assert.deepEqual(tasks.map((task) => task.kind), ['作业', '考试']);
  assert.deepEqual(tasks.map((task) => task.pages), [4, 2]);
  assert.ok(tasks.every((task) => task.status === 'AI识别中'));
});

test('returns null for malformed stored batches', () => {
  assert.equal(flow.parseBatch('{broken'), null);
  assert.equal(flow.parseBatch(JSON.stringify({ version: 1, groups: 'wrong' })), null);
});

test('deduplicates generated tasks by id', () => {
  const task = { id: 'collection-batch-1-1', title: '练习' };
  assert.deepEqual(flow.mergeTasks([task], [task]), [task]);
});
```

- [ ] **Step 2: Run the model tests and verify failure**

Run: `node --test tests/collection-flow.test.cjs`

Expected: FAIL because `collection-flow.js` does not exist.

- [ ] **Step 3: Implement the pure flow helpers**

Create a UMD-style module exposing:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FxCollectionFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const normalizeKind = (value) => value === '考试' ? '考试' : '作业';
  const normalizeName = (value) => String(value || '').trim() || '未命名样卷';
  const validGroups = (groups) => Array.isArray(groups)
    ? groups.filter((group) => Array.isArray(group.pages) && group.pages.length > 0).map((group) => ({
        ...group,
        name: normalizeName(group.name),
        kind: normalizeKind(group.kind),
        students: Math.max(0, Number(group.students) || 0)
      }))
    : [];
  const buildTasks = (batch) => validGroups(batch && batch.groups).map((group, index) => ({
    id: `collection-${batch.batchId}-${index + 1}`,
    title: group.name,
    kind: group.kind,
    className: batch.className || '扫描采集',
    students: group.students,
    pages: group.pages.length,
    anomalyCount: 0,
    status: 'AI识别中',
    listTag: 'AI识别中',
    progress: 0,
    updated: '刚刚',
    anomalies: [],
    studentRows: []
  }));
  const parseBatch = (raw) => {
    try {
      const batch = JSON.parse(raw);
      return batch && batch.version === 1 && typeof batch.batchId === 'string' && Array.isArray(batch.groups) ? batch : null;
    } catch (_) { return null; }
  };
  const mergeTasks = (existing, incoming) => {
    const ids = new Set();
    return [...incoming, ...existing].filter((task) => task && task.id && !ids.has(task.id) && ids.add(task.id));
  };
  return { normalizeKind, normalizeName, validGroups, buildTasks, parseBatch, mergeTasks };
});
```

- [ ] **Step 4: Run the model tests and verify success**

Run: `node --test tests/collection-flow.test.cjs`

Expected: 4 tests pass.

### Task 2: Editable and Draggable Confirmation Page

**Files:**
- Create: `tests/collection-pages.test.cjs`
- Modify: `collection-confirm.html`

- [ ] **Step 1: Write the failing confirmation-page contract tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const confirm = fs.readFileSync('collection-confirm.html', 'utf8');

test('confirmation page exposes the required group controls', () => {
  assert.match(confirm, /data-action="add-sample"/);
  assert.match(confirm, /data-action="edit-sample-name"/);
  assert.match(confirm, /data-action="change-sample-kind"/);
  assert.match(confirm, /本次扫描识别到以下/);
});

test('sample pages wrap instead of scrolling horizontally', () => {
  assert.match(confirm, /\.pages\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.doesNotMatch(confirm, /\.pages\s*\{[^}]*overflow-x:\s*auto/s);
});

test('confirmation goes directly to the main list', () => {
  assert.match(confirm, /location\.href\s*=\s*['"]index\.html\?collectionCreated=1['"]/);
});
```

- [ ] **Step 2: Run page contract tests and verify failure**

Run: `node --test tests/collection-pages.test.cjs`

Expected: FAIL because the controls, wrapping rule, and direct handoff are absent.

- [ ] **Step 3: Rebuild confirmation markup and styling**

Add a live scan notice, a `#sampleList` container, an add button, an inline message region, and render each group with a select before an editable name:

```html
<aside class="scan-notice" aria-live="polite">
  本次扫描识别到以下 <strong id="sampleCount">2</strong> 个样卷，确认无误后 AI 开始识别或批改
</aside>
<div id="sampleList"></div>
<button class="add-sample" type="button" data-action="add-sample">＋ 添加样卷</button>
<p class="form-message" id="formMessage" role="status"></p>
```

Use `.pages { display:flex; flex-wrap:wrap; overflow:visible; }`, preserve the existing paper-card visual language, add visible drag-over and empty-drop states, and keep controls accessible at narrow widths.

- [ ] **Step 4: Implement group rendering and interactions**

Represent groups as objects with `id`, `name`, `kind`, `students`, and `pages`. Render them from state, use delegated `input`/`change` handlers for title and kind edits, add empty groups, and use delegated drag events to move page objects between groups while retaining insertion order. Update count, labels, page numbers, and summaries after each change.

On confirmation, pass `FxCollectionFlow.validGroups(groups)` into a versioned batch, write it to `fxConfirmedCollectionBatch`, and navigate to `index.html?collectionCreated=1`. If empty groups exist, show the non-blocking message and create tasks only from non-empty groups. If all groups are empty, remain on the page and show an error.

- [ ] **Step 5: Run page and model tests**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass.

### Task 3: Generated Tasks and Reminder Bubble on the Main List

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Modify: `index.html`

- [ ] **Step 1: Add failing list-page contract tests**

```js
const index = fs.readFileSync('index.html', 'utf8');

test('main list loads confirmed collection tasks', () => {
  assert.match(index, /fxConfirmedCollectionBatch/);
  assert.match(index, /FxCollectionFlow\.buildTasks/);
  assert.match(index, /FxCollectionFlow\.mergeTasks/);
});

test('history reminder uses the required wording', () => {
  assert.match(index, />2批采集任务待确认</);
});
```

- [ ] **Step 2: Run tests and verify the new assertions fail**

Run: `node --test tests/collection-pages.test.cjs`

Expected: FAIL because batch loading and final reminder wording are not implemented.

- [ ] **Step 3: Integrate confirmed tasks into the existing task state**

Load `collection-flow.js` before the main inline application script. Parse `fxConfirmedCollectionBatch`, build tasks, merge them ahead of the seeded tasks, persist generated tasks under `fxGeneratedCollectionTasks`, and clear the one-time batch only after persistence succeeds. Read persisted generated tasks on normal reload so new list items remain visible without duplication.

Add list-tag styling for `AI识别中` and make `taskRow()` render generated tasks through the same task component as seeded tasks. When `collectionCreated=1` is present, show a one-time in-page success toast and keep `state.gradingMode = 'home'`.

- [ ] **Step 4: Replace the legacy fixed entry and processing injection**

Keep one accessible link to `collection-history.html`, styled as a compact notification bubble and containing exactly:

```html
<span class="collection-history-entry__dot" aria-hidden="true"></span>
<span>2批采集任务待确认</span>
```

Remove the legacy six-second processing panel, auto-navigation to a grading demo, and old “2 次待确认” fragments.

- [ ] **Step 5: Run page and model tests**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass.

### Task 4: History Page Handoff Cleanup

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Modify: `collection-history.html`

- [ ] **Step 1: Add a failing history-page contract test**

```js
const history = fs.readFileSync('collection-history.html', 'utf8');

test('history page does not auto-redirect after confirmation', () => {
  assert.doesNotMatch(history, /location\.href\s*=\s*['"]index\.html['"]/);
  assert.doesNotMatch(history, /fxCollectionProcessing/);
});
```

- [ ] **Step 2: Run the history contract test and verify failure**

Run: `node --test tests/collection-pages.test.cjs`

Expected: FAIL because the current page reads legacy processing state and redirects.

- [ ] **Step 3: Remove legacy processing and redirect scripts**

Delete the `fxCollectionProcessing` state decoration, the `started` toast path, and the delayed redirect. Preserve pending-task navigation to `collection-confirm.html?task=<id>` and the historical rows.

- [ ] **Step 4: Run the complete automated test suite**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass with no skipped tests.

### Task 5: Browser Verification and Final Quality Checks

**Files:**
- Verify: `collection-confirm.html`
- Verify: `index.html`
- Verify: `collection-history.html`

- [ ] **Step 1: Run syntax and whitespace checks**

Run: `node --check collection-flow.js`

Expected: exit code 0.

Run: `git diff --check`

Expected: exit code 0.

- [ ] **Step 2: Verify confirmation-page behavior in a browser**

Open `collection-confirm.html?task=today-1942`. Confirm the two initial groups wrap, the live count is 2, both type selects work, names edit, a third empty group can be added, and pages can move into it. Confirm page numbering and summaries update.

- [ ] **Step 3: Verify empty-group and confirmation behavior**

Leave one group empty and confirm. Verify the empty-group message appears, only non-empty groups are serialized, and the browser navigates directly to `index.html?collectionCreated=1`.

- [ ] **Step 4: Verify generated list tasks and persistence**

Confirm one homework and one exam group produce two top-of-list tasks with matching names/types and `AI识别中`. Reload and verify the same two tasks remain without duplicates. Verify the page stays on the main list.

- [ ] **Step 5: Verify reminder and regression paths**

Confirm the bubble says `2批采集任务待确认`, opens `collection-history.html`, history rows still open confirmation, main filters still work, and seeded tasks still open normally.

- [ ] **Step 6: Run final tests**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass.
