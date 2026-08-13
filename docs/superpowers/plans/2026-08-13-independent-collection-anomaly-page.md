# Independent Collection Anomaly Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move submission-anomaly handling out of the sample confirmation page into a durable, independently navigable page with persistent ownership progress and immediate feedback.

**Architecture:** `collection-confirm.html` remains the sample editor and writes a task-scoped draft before navigation. A new `collection-anomalies.html` reads and updates that draft, uses the pure anomaly helpers in `collection-flow.js`, and performs the existing batch/history creation when blocking ownership anomalies are resolved. The draft is the only handoff boundary between the two pages.

**Tech Stack:** Static HTML/CSS/JavaScript, browser `localStorage`, Node built-in test runner, shared UMD helpers in `collection-flow.js`.

---

### Task 1: Add task-scoped collection draft helpers

**Files:**
- Modify: `collection-flow.js`
- Modify: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Write failing draft-normalization tests**

Add tests that require a task match and defensive copies:

```js
test('normalizes only the draft for the requested collection task', () => {
  const draft = FxCollectionFlow.normalizeCollectionDraft({
    taskId: 'today-1942',
    groups: [{ id: 'g1', name: '练习', kind: '作业', pages: [{ id: 'p1' }] }],
    anomalies: [{ id: 'a1', groupId: 'g1', type: '未识别学生', status: 'pending' }],
  }, 'today-1942');
  assert.equal(draft.taskId, 'today-1942');
  assert.equal(draft.groups[0].pages[0].id, 'p1');
  assert.equal(FxCollectionFlow.normalizeCollectionDraft(draft, 'today-2026'), null);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test --test-name-pattern="normalizes only the draft" tests/collection-flow.test.cjs`

Expected: FAIL because `normalizeCollectionDraft` is not exported.

- [ ] **Step 3: Implement the pure helper**

Add and export:

```js
const collectionDraftKey = (taskId) => `fxCollectionDraft:${String(taskId || 'default')}`;

const normalizeCollectionDraft = (value, expectedTaskId) => {
  if (!value || value.taskId !== expectedTaskId) return null;
  if (!Array.isArray(value.groups) || !Array.isArray(value.anomalies)) return null;
  return {
    ...value,
    groups: value.groups.map((group) => ({
      ...group,
      pages: Array.isArray(group.pages) ? group.pages.map((page) => ({ ...page })) : [],
    })),
    anomalies: value.anomalies.map((anomaly) => ({
      ...anomaly,
      pages: Array.isArray(anomaly.pages) ? anomaly.pages.map((page) => ({ ...page })) : [],
    })),
  };
};
```

- [ ] **Step 4: Run flow tests and verify GREEN**

Run: `node --test tests/collection-flow.test.cjs`

Expected: all flow tests pass.

### Task 2: Make sample confirmation navigate instead of rendering anomalies

**Files:**
- Modify: `collection-confirm.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write failing navigation tests**

```js
test('sample confirmation persists a draft and opens the independent anomaly page', () => {
  assert.match(confirmPage, /collectionDraftKey\(task\)/);
  assert.match(confirmPage, /collection-anomalies\.html\?task=/);
  assert.doesNotMatch(confirmPage, /stage = 'anomalies'/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test --test-name-pattern="opens the independent anomaly page" tests/collection-pages.test.cjs`

Expected: FAIL because confirmation still switches an in-page stage.

- [ ] **Step 3: Persist the draft and navigate**

Replace the anomaly-stage branch with:

```js
const saveCollectionDraft = () => localStorage.setItem(
  FxCollectionFlow.collectionDraftKey(task),
  JSON.stringify({
    version: 1,
    taskId: task,
    taskData,
    groups,
    anomalies,
    updatedAt: Date.now(),
  }),
);

if (FxCollectionFlow.nextCollectionStep(anomalies) === 'review-anomalies') {
  saveCollectionDraft();
  location.href = `collection-anomalies.html?task=${encodeURIComponent(task)}`;
  return;
}
```

Restore draft groups/anomalies when `resumeCollection=1`, then remove the anomaly-stage rendering, handlers, and CSS from this page.

- [ ] **Step 4: Run confirmation-page tests**

Run: `node --test tests/collection-pages.test.cjs`

Expected: all page tests that concern confirmation pass with assertions moved to the new page fixture.

### Task 3: Build the independent anomaly page and persistent assignment flow

**Files:**
- Create: `collection-anomalies.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add failing independent-page tests**

Load the new fixture and assert:

```js
const anomaliesPage = fs.readFileSync('collection-anomalies.html', 'utf8');

test('independent anomaly page keeps sample navigation above the workspace', () => {
  assert.match(anomaliesPage, /class="anomaly-sample-nav"/);
  assert.match(anomaliesPage, /class="anomaly-workspace/);
  assert.match(anomaliesPage, /返回修改样卷/);
});

test('missing guidance is right aligned and missing has no decision rail', () => {
  assert.match(anomaliesPage, /missing-rescan-inline[^}]*margin-left:\s*auto/s);
  assert.match(anomaliesPage, /selected\.type === '缺页' \? '' :/);
});

test('ownership assignment persists, toasts, updates the rail and advances', () => {
  assert.match(anomaliesPage, /已归属给 \${escapeHtml\(choice\)}/);
  assert.match(anomaliesPage, /localStorage\.setItem\(draftKey/);
  assert.match(anomaliesPage, /nextBlockingAnomaly/);
  assert.match(anomaliesPage, /anomaly\.choice \|\| '未识别学生'/);
  assert.doesNotMatch(anomaliesPage, /class="anomaly-type"/);
  assert.doesNotMatch(anomaliesPage, /type="search"/);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test --test-name-pattern="independent anomaly|missing guidance is right|ownership assignment persists" tests/collection-pages.test.cjs`

Expected: FAIL because `collection-anomalies.html` does not exist.

- [ ] **Step 3: Create the page shell and draft guard**

The page must load `collection-flow.js`, derive `task` and `draftKey`, and fail closed:

```js
const params = new URLSearchParams(location.search);
const task = params.get('task') || '';
const draftKey = FxCollectionFlow.collectionDraftKey(task);
const rawDraft = JSON.parse(localStorage.getItem(draftKey) || 'null');
let draft = FxCollectionFlow.normalizeCollectionDraft(rawDraft, task);
if (!draft) renderMissingDraft();
```

- [ ] **Step 4: Render sample navigation and anomaly workspace**

Use `groupCollectionAnomalies`, `blockingCollectionAnomalies`, and the existing document-preview builders. Render top horizontal samples, current-sample anomalies, a document viewer, and the ownership rail only for unrecognized pages. The ownership rail starts directly with the explanatory copy and student selection; it does not render the “未识别学生” tag, “未识别” heading, or a search field. Render missing guidance at the far right of the page-tab row:

```html
<div class="anomaly-page-tabs">
  <!-- continuous page buttons -->
  <span class="missing-rescan-inline">请重新扫描缺失页面</span>
</div>
```

```css
.missing-rescan-inline { margin-left: auto; align-self: center; }
```

- [ ] **Step 5: Persist assignment and show feedback**

On confirmation:

```js
anomalies = FxCollectionFlow.resolveCollectionAnomaly(anomalies, anomalyId, choice);
persistDraft();
showToast(`已归属给 ${choice}`);
selectNextBlockingAnomaly();
render();
```

The rail subtitle must use `anomaly.choice || '未识别学生'`, so it immediately changes to the student name.

- [ ] **Step 6: Verify the new page tests pass**

Run: `node --test tests/collection-pages.test.cjs`

Expected: all collection page tests pass.

### Task 4: Finish analysis from the independent page

**Files:**
- Modify: `collection-anomalies.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add failing completion tests**

```js
test('independent anomaly page creates the batch only after ownership blockers clear', () => {
  assert.match(anomaliesPage, /blockingCollectionAnomalies\(anomalies\)/);
  assert.match(anomaliesPage, /fxConfirmedCollectionBatch/);
  assert.match(anomaliesPage, /confirmHistoryRecord/);
  assert.match(anomaliesPage, /index\.html\?collectionCreated=1/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test --test-name-pattern="creates the batch only" tests/collection-pages.test.cjs`

Expected: FAIL until completion serialization is wired.

- [ ] **Step 3: Implement completion and back navigation**

Disable the primary button while blocking anomalies remain. When clear, serialize `validGroups`, update `fxCollectionHistoryState`, clear the task draft, and navigate to the list. Back navigation must use:

```js
location.href = `collection-confirm.html?task=${encodeURIComponent(task)}&resumeCollection=1`;
```

- [ ] **Step 4: Run full regression and syntax checks**

Run:

```bash
node --test tests/*.test.cjs
node -e 'const fs=require("fs"),vm=require("vm");for(const file of ["collection-confirm.html","collection-anomalies.html"]){const html=fs.readFileSync(file,"utf8");for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1],{filename:file});}'
git diff --check
```

Expected: all tests pass, both inline scripts parse, and no whitespace errors are reported.
