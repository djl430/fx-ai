# Anomaly Top Navigation and Student Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将异常样卷改为顶部横向导航，为每张未识别纸提供优先推荐和全班学生选择器，并把缺页改为不阻塞分析的重扫提示。

**Architecture:** `collection-flow.js` 提供“阻塞分析的异常”纯函数，只把待归属的未识别页面视为阻塞项。`collection-confirm.html` 复用现有三栏工作区，在其顶部渲染横向样卷导航；右侧根据异常类型渲染重扫提示或学生归属选择器。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Node.js `node:test`

---

### Task 1: 区分提示型异常与阻塞型异常

**Files:**
- Modify: `collection-flow.js`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Write the failing test**

```js
test('only unresolved ownership anomalies block analysis', () => {
  assert.deepEqual(flow.blockingCollectionAnomalies([
    { id: 'missing', type: '缺页', status: 'pending' },
    { id: 'owner', type: '未识别学生', status: 'pending' },
    { id: 'done', type: '未识别学生', status: 'resolved' },
  ]).map((item) => item.id), ['owner']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="only unresolved ownership anomalies block" tests/collection-flow.test.cjs`
Expected: FAIL because `blockingCollectionAnomalies` is not exported.

- [ ] **Step 3: Implement and export the filter**

```js
const blockingCollectionAnomalies = (anomalies) => supportedCollectionAnomalies(anomalies)
  .filter((item) => item.type === '未识别学生' && item.status !== 'resolved');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="only unresolved ownership anomalies block" tests/collection-flow.test.cjs`
Expected: PASS.

### Task 2: Move sample navigation above the workspace

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write the failing page contract test**

```js
test('anomaly sample navigation is horizontal above the workspace', () => {
  assert.match(confirmPage, /anomaly-sample-nav[^}]*display:\s*flex/s);
  assert.match(confirmPage, /<nav class="anomaly-sample-nav"[\s\S]*?<div class="anomaly-workspace">/);
  assert.doesNotMatch(confirmPage, /anomaly-student-rail">[\s\S]*?anomaly-sample-nav/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="navigation is horizontal above" tests/collection-pages.test.cjs`
Expected: FAIL because navigation is currently inside the left rail.

- [ ] **Step 3: Move markup and update CSS**

Render `anomaly-sample-nav` immediately before `anomaly-workspace`, use `display:flex`, `overflow-x:auto`, and fixed-width tab cards. Keep only the current sample's anomaly students inside `anomaly-student-rail`.

- [ ] **Step 4: Update tab copy**

Each tab shows sample name and total anomaly count. When unresolved ownership records exist it also shows `N 人待归属`; otherwise it shows `仅缺页提示` or `已完成归属` without treating missing pages as pending actions.

- [ ] **Step 5: Run the targeted test**

Run: `node --test --test-name-pattern="navigation is horizontal above" tests/collection-pages.test.cjs`
Expected: PASS.

### Task 3: Add the grouped student ownership selector

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write the failing selector contract test**

```js
test('unrecognized submissions use a searchable grouped student selector', () => {
  assert.match(confirmPage, /优先推荐/);
  assert.match(confirmPage, /全部学生/);
  assert.match(confirmPage, /data-action="search-owner-students"/);
  assert.match(confirmPage, /data-action="select-owner-student"/);
  assert.match(confirmPage, /确认归属给/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="searchable grouped student selector" tests/collection-pages.test.cjs`
Expected: FAIL because current ownership choices are direct buttons.

- [ ] **Step 3: Store unrecognized items as individual pages**

Replace each bundled unrecognized anomaly with one anomaly record per scanned page. Every `未识别学生` record contains exactly one `pages` entry, and its label count is the number of unresolved records rather than an `unrecognizedPageCount` field.

- [ ] **Step 4: Add roster and per-sample identified students**

Define `classStudents` as the complete demo roster and `identifiedStudentsByGroup` as names already matched to each sample. Recommended students are `classStudents` not in the selected sample's identified set.

- [ ] **Step 5: Add transient selector state**

Add `ownershipSearch` and `selectedOwnershipStudent`. Reset both when switching sample or anomaly; retain them while switching preview pages.

- [ ] **Step 6: Render search and grouped choices**

For `未识别学生`, render a search input, then `优先推荐` names, then `全部学生` names. Clicking a name selects it but does not resolve the anomaly. Render one primary button `确认归属给 XXX`, disabled until a name is selected.

- [ ] **Step 7: Wire search, selection, and confirmation**

Filter both groups on input. Selection updates only transient state. Confirmation calls the existing `resolveCollectionAnomaly` path with the selected name, then advances to the next unresolved ownership anomaly.

- [ ] **Step 8: Run the targeted test**

Run: `node --test --test-name-pattern="searchable grouped student selector" tests/collection-pages.test.cjs`
Expected: PASS.

### Task 4: Make missing pages advisory

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write the failing advisory contract test**

```js
test('missing pages only show rescan guidance and do not block analysis', () => {
  assert.match(confirmPage, /请重新扫描缺失页面/);
  assert.doesNotMatch(confirmPage, /确认缺页并继续/);
  assert.match(confirmPage, /blockingCollectionAnomalies/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="missing pages only show rescan" tests/collection-pages.test.cjs`
Expected: FAIL because missing pages still render a confirmation action.

- [ ] **Step 3: Render guidance instead of an action**

For a missing-page anomaly, render a static `请重新扫描缺失页面` guidance block and no `resolve-anomaly` button.

- [ ] **Step 4: Use blocking anomalies for footer state and automatic advance**

Derive the disabled state, remaining count, and next actionable anomaly from `FxCollectionFlow.blockingCollectionAnomalies(anomalies)`. Missing-page records remain in `anomalies`, sample labels, history snapshots, and review lists.

- [ ] **Step 5: Run the targeted test**

Run: `node --test --test-name-pattern="missing pages only show rescan" tests/collection-pages.test.cjs`
Expected: PASS.

### Task 5: Verify the complete flow

**Files:**
- Verify: `collection-confirm.html`
- Verify: `collection-flow.js`
- Verify: `tests/collection-flow.test.cjs`
- Verify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Run all tests**

Run: `node --test tests/*.test.cjs`
Expected: all tests PASS.

- [ ] **Step 2: Parse inline scripts**

Run: `node -e "const fs=require('fs'),vm=require('vm'); const source=fs.readFileSync('collection-confirm.html','utf8'); [...source.matchAll(/<script(?![^>]*src=)[^>]*>([\\s\\S]*?)<\\/script>/gi)].forEach((m,i)=>new vm.Script(m[1],{filename:'collection-confirm.html#'+(i+1)}));"`
Expected: exit code 0.

- [ ] **Step 3: Check patch whitespace and obsolete actions**

Run: `git diff --check && ! rg -n "确认缺页并继续" collection-confirm.html`
Expected: exit code 0 and no output.
