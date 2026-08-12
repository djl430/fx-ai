# Collection Demo Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Demonstrate one pending collection task, simplify confirmation copy, and keep the generated-task list visually stable while recognition progresses and completes.

**Architecture:** Make seeded confirmation state explicit and teach the shared pending counter to respect it, so the history list and fixed badge use one source of truth. Keep the list's initial full render, then update recognition and toast DOM nodes in place instead of rebuilding the application for timer-only changes.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser `localStorage`, Node.js built-in test runner.

---

### Task 1: Seed One Pending Collection Task

**Files:**
- Modify: `collection-flow.js`
- Modify: `collection-history.html`
- Modify: `index.html`
- Test: `tests/collection-flow.test.cjs`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write failing tests for seeded confirmation state**

Add to `tests/collection-flow.test.cjs`:

```js
test('seeded confirmed history tasks are excluded from the pending count', () => {
  const seeds = [{ id: 'today-1942' }, { id: 'today-1618', confirmed: true }];
  assert.equal(flow.pendingHistoryCount(seeds, null), 1);
});
```

Extend `history button is permanent and its pending badge is conditional` in `tests/collection-pages.test.cjs`:

```js
assert.match(indexPage, /today-1618['"],\s*confirmed:\s*true/);
assert.match(indexPage, /批待确认/);
assert.match(historyPage, /today-1618[^\n]*confirmed:true/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="seeded confirmed|history button" tests/collection-flow.test.cjs tests/collection-pages.test.cjs
```

Expected: FAIL because `pendingHistoryCount` ignores `seed.confirmed` and `today-1618` is not seeded as confirmed.

- [ ] **Step 3: Respect seeded confirmation in the pure counter**

Change `pendingHistoryCount` in `collection-flow.js` to:

```js
const pendingHistoryCount = (seeds, state) => {
  const history = normalizeHistoryState(state);
  return (Array.isArray(seeds) ? seeds : []).filter((seed) => {
    const record = seed && history.records[seed.id];
    return !seed?.confirmed && (!record || record.status !== '已确认');
  }).length;
};
```

- [ ] **Step 4: Mark the same task confirmed in both page seeds**

In `collection-history.html`:

```js
{ id:'today-1618', title:'今天 16:18 · 六年级1班 · 数学', pages:98, samples:2, confirmed:true },
```

In `index.html`:

```js
const historySeeds = [{ id: 'today-1942' }, { id: 'today-1618', confirmed: true }];
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="seeded confirmed|history button|history page renders" tests/collection-flow.test.cjs tests/collection-pages.test.cjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add collection-flow.js collection-history.html index.html tests/collection-flow.test.cjs tests/collection-pages.test.cjs
git commit -m "feat: demo one pending collection task"
```

### Task 2: Simplify Confirmation Page Copy

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write a failing copy contract test**

Add to `tests/collection-pages.test.cjs`:

```js
test('collection confirmation uses simplified analysis copy', () => {
  assert.match(confirmPage, /确认无误后 AI 开始分析/);
  assert.match(confirmPage, /<button class="confirm"[^>]*>确认<\/button>/);
  assert.doesNotMatch(confirmPage, /\.scan-notice::before/);
  assert.doesNotMatch(confirmPage, /确认并开始识别或批改/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test --test-name-pattern="simplified analysis copy" tests/collection-pages.test.cjs
```

Expected: FAIL because the old icon, notice text, and button label remain.

- [ ] **Step 3: Remove the icon and update editable-mode copy**

Delete the `.scan-notice::before` CSS rule. Change the editable notice to:

```html
<span>本次扫描识别到以下 <strong id="sampleCount">2</strong> 个样卷，确认无误后 AI 开始分析</span>
```

Change the footer button to:

```html
<button class="confirm" id="confirm" type="button">确认</button>
```

Do not change the read-only notice written when `mode=view`.

- [ ] **Step 4: Run the focused test and parse inline scripts**

Run:

```bash
node --test --test-name-pattern="simplified analysis copy|confirmation page exposes" tests/collection-pages.test.cjs
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('collection-confirm.html', 'utf8');
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new Function(match[1]);
}
console.log('collection-confirm.html inline scripts parse OK');
NODE
```

Expected: tests PASS and the parse command prints `collection-confirm.html inline scripts parse OK`.

- [ ] **Step 5: Commit**

```bash
git add collection-confirm.html tests/collection-pages.test.cjs
git commit -m "feat: simplify collection confirmation copy"
```

### Task 3: Update Generated Tasks Without Re-rendering the List

**Files:**
- Modify: `index.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write a failing no-flash contract test**

Add to `tests/collection-pages.test.cjs`:

```js
test('generated task timers update the existing DOM without rerendering the page', () => {
  assert.match(indexPage, /function updateRecognitionTaskRow/);
  assert.match(indexPage, /class="task-updated"/);
  assert.match(indexPage, /toastNode\?\.remove\(\)/);
  assert.doesNotMatch(indexPage, /if \(completed\) \{[\s\S]*?render\(\);[\s\S]*?return;/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="timers update the existing DOM" tests/collection-pages.test.cjs
```

Expected: FAIL because the recognition completion and toast timer call `render()`.

- [ ] **Step 3: Give the updated-time element a stable selector**

In `taskRow(task)`, change:

```html
<span>${task.updated}</span>
```

to:

```html
<span class="task-updated">${task.updated}</span>
```

- [ ] **Step 4: Add a task-row patch helper**

Add near `taskRow`:

```js
function updateRecognitionTaskRow(task) {
  const row = [...document.querySelectorAll('.task-row')]
    .find((item) => item.dataset.taskId === task.id);
  if (!row) return false;
  const badge = row.querySelector('.status-badge');
  if (badge) {
    badge.className = task.listTag === '待确认' ? 'status-badge warning' : 'status-badge';
    badge.textContent = task.listTag || task.status;
  }
  row.querySelector('[data-recognition-task]')?.remove();
  const updated = row.querySelector('.task-updated');
  if (updated) updated.textContent = task.updated;
  return true;
}
```

- [ ] **Step 5: Replace the recognition-complete full render**

In `animateRecognition`, collect completed tasks while mapping:

```js
const completedTasks = [];
tasks = tasks.map((task) => {
  if (!task.generated || task.status !== 'AI识别中') return task;
  const next = FxCollectionFlow.advanceRecognition(task, now, 5000);
  if (next.status !== task.status) completedTasks.push(next);
  return next;
});
```

Persist and patch those rows without calling `render()`:

```js
if (completedTasks.length) {
  try {
    localStorage.setItem('fxGeneratedCollectionTasks', JSON.stringify(tasks.filter((task) => task.generated)));
  } catch (_) {}
  completedTasks.forEach(updateRecognitionTaskRow);
}
```

Continue updating remaining processing task progress bars. Schedule another animation frame only when at least one generated task remains in `AI识别中`.

- [ ] **Step 6: Remove the toast without a full render**

Replace the toast timeout body with:

```js
if (state.toast === currentToast) {
  state.toast = '';
  const toastNode = document.querySelector('.toast');
  toastNode?.remove();
}
```

- [ ] **Step 7: Run focused tests and parse the page**

Run:

```bash
node --test --test-name-pattern="timers update the existing DOM|five-second recognition" tests/collection-pages.test.cjs
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new Function(match[1]);
}
console.log('index.html inline scripts parse OK');
NODE
```

Expected: tests PASS and the parse command prints `index.html inline scripts parse OK`.

- [ ] **Step 8: Commit**

```bash
git add index.html tests/collection-pages.test.cjs
git commit -m "fix: prevent generated task list flashing"
```

### Task 4: Full Regression and Interaction Verification

**Files:**
- Verify: `collection-flow.js`
- Verify: `collection-confirm.html`
- Verify: `collection-history.html`
- Verify: `index.html`
- Verify: `tests/*.cjs`

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
node --check collection-flow.js
node --test tests/*.cjs
git diff --check
```

Expected: zero syntax errors, zero failed tests, and no whitespace errors.

- [ ] **Step 2: Verify the local interaction flow**

Start a temporary server:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/collection-confirm.html` and verify the notice, button label, fixed paper metadata, and confirmation behavior. Confirm the collection, observe the list for the full five-second recognition period, and verify the list container is not replaced when the toast disappears or recognition completes.

- [ ] **Step 3: Confirm repository state**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: clean worktree with the intended feature commits at HEAD.

