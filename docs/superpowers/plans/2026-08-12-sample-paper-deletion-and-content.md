# Sample Paper Deletion and Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make whole-sample deletion confirm reliably, make single-page deletion immediate, and render realistic multi-page papers with stable bottom page numbers and continuous question numbering.

**Architecture:** Keep sample-page data and browser event handling in `collection-confirm.html`, while continuing to use the pure deletion and move helpers in `collection-flow.js`. Give each page immutable paper metadata so drag and deletion only change array membership/order, never printed content.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js built-in test runner.

---

### Task 1: Lock the Final Delete and Paper Contracts

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Modify: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Replace the old combined deletion test with failing split-behavior tests**

```js
test('whole samples confirm deletion while single pages delete immediately', () => {
  assert.match(confirmPage, /data-action="request-delete-sample"/);
  assert.match(confirmPage, /data-action="confirm-delete-sample"/);
  assert.match(confirmPage, /data-action="request-delete-page"/);
  assert.match(confirmPage, /removeSampleGroup/);
  assert.match(confirmPage, /removeSamplePage/);
  assert.doesNotMatch(confirmPage, /pendingDelete\.type\s*===\s*['"]page['"]/);
  assert.doesNotMatch(confirmPage, /确认删除这一页/);
});

test('sample paper content uses stable printed page metadata', () => {
  assert.match(confirmPage, /sourcePageNumber/);
  assert.match(confirmPage, /paper-page-number/);
  assert.match(confirmPage, /paperTitle/);
  assert.doesNotMatch(confirmPage, /<h4>\$\{escapeHtml\(groupName\)\}\s*·\s*第/);
});
```

- [ ] **Step 2: Extend the move test to prove printed data is unchanged**

```js
const stablePage = {
  id: 'p2',
  sourcePageNumber: 4,
  paperTitle: '第三单元测试',
  content: ['7. 计算下面各题'],
};
// Use stablePage in the source group, move it, then assert:
assert.deepEqual(groups[1].pages[0], stablePage);
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run: `node --test --test-name-pattern="whole samples confirm|stable printed|printed data" tests/collection-pages.test.cjs tests/collection-flow.test.cjs`

Expected: FAIL because the page dialog is still shared and printed page metadata is not yet rendered.

- [ ] **Step 4: Commit the failing tests**

```bash
git add tests/collection-pages.test.cjs tests/collection-flow.test.cjs
git commit -m "test: define sample deletion and paper metadata behavior"
```

### Task 2: Model and Render Real Multi-page Papers

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Replace `pageQuestionSets` with per-paper page templates**

Create two template arrays in `collection-confirm.html`. Each page has fixed data and continuous question numbers:

```js
const paperTemplates = {
  homework: [
    { sourcePageNumber: 1, content: ['一、计算题', '1. 0.8 × 1.5 =', '2. 3.6 × 0.25 =', '3. 2.04 × 5 ='] },
    { sourcePageNumber: 2, content: ['4. 竖式计算', '（1）4.8 × 2.6', '（2）0.35 × 1.8', '5. 判断积的范围'] },
    { sourcePageNumber: 3, content: ['二、解决问题', '6. 计算购买文具的总价。', '7. 求长方形草地的面积。'] },
    { sourcePageNumber: 4, content: ['三、综合应用', '8. 比较两种方案的费用。', '9. 写出验算过程。'] },
  ],
  exam: [
    { sourcePageNumber: 1, content: ['一、选择题', '1. 下列图形中……', '2. 选择正确的展开图。', '3. 判断对称轴数量。'] },
    { sourcePageNumber: 2, content: ['二、填空题', '4. 三角形内角和是（ ）。', '5. 填写周长计算结果。', '6. 写出面积单位。'] },
    { sourcePageNumber: 3, content: ['三、计算题', '7. 求阴影部分面积。', '8. 计算组合图形周长。'] },
    { sourcePageNumber: 4, content: ['四、解答题', '9. 画出平移后的图形。', '10. 写出完整推理过程。'] },
    { sourcePageNumber: 5, content: ['五、综合题', '11. 设计铺砖方案。', '12. 比较两种方案。'] },
    { sourcePageNumber: 6, content: ['六、拓展题', '13. 求未知图形面积。', '14. 说明你的方法。'] },
  ],
};
```

- [ ] **Step 2: Build pages with immutable printed metadata**

Replace `makePages(groupId, title, count, wrongPage, exampleStart)` with:

```js
const makePages = (groupId, paperTitle, templates, wrongPage) => templates.map((template, index) => ({
  id: `${groupId}-page-${index + 1}`,
  paperTitle,
  sourcePageNumber: template.sourcePageNumber,
  content: [...template.content],
  mark: index + 1 === wrongPage ? '×' : '√',
}));
```

Use `paperTemplates.homework` for sample 1 and `paperTemplates.exam` for sample 2.

- [ ] **Step 3: Render only the title at top and fixed page number at bottom**

Replace the current page-index title and `.page-no` element with:

```html
<div class="scan-paper">
  <h4>${escapeHtml(page.paperTitle || groupName)}</h4>
  ${content.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
  <footer class="paper-page-number">第 ${page.sourcePageNumber} 页</footer>
</div>
```

Add CSS:

```css
.scan-paper { position: relative; padding-bottom: 34px; }
.paper-page-number {
  position: absolute;
  right: 0;
  bottom: 10px;
  left: 0;
  color: #8a8f9d;
  font-size: 10px;
  text-align: center;
}
```

Remove `.page-no` markup and styles so drag order is never presented as printed page identity.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test --test-name-pattern="stable printed|printed data" tests/collection-pages.test.cjs tests/collection-flow.test.cjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add collection-confirm.html tests/collection-pages.test.cjs tests/collection-flow.test.cjs
git commit -m "feat: render stable realistic sample papers"
```

### Task 3: Split Whole-sample and Single-page Deletion

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Replace generic pending deletion state**

Use a sample-only state:

```js
let pendingSampleDelete = null;
```

The dialog renderer returns empty unless `pendingSampleDelete` is set and always renders “确认删除整个样卷？”. Use explicit actions:

```html
<div class="collection-delete-backdrop">
  <section class="collection-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="collection-delete-title">
    ...
    <button data-action="cancel-delete-sample">取消</button>
    <button data-action="confirm-delete-sample">确认删除</button>
  </section>
</div>
```

- [ ] **Step 2: Make page deletion immediate**

Handle `request-delete-page` directly:

```js
const pageButton = event.target.closest('[data-action="request-delete-page"]');
if (pageButton) {
  const group = findGroup(pageButton.dataset.groupId);
  const pageIndex = group?.pages.findIndex((page) => page.id === pageButton.dataset.pageId) ?? -1;
  if (!group || pageIndex < 0) return;
  const groupName = FxCollectionFlow.normalizeName(group.name);
  groups = FxCollectionFlow.removeSamplePage(groups, group.id, pageButton.dataset.pageId);
  formMessage.textContent = `已删除“${groupName}”第 ${pageIndex + 1} 张扫描页。`;
  formMessage.classList.remove('is-error');
  render();
  return;
}
```

- [ ] **Step 3: Dispatch sample confirm before cancel and restrict backdrop cancel**

```js
const confirmButton = event.target.closest('[data-action="confirm-delete-sample"]');
if (confirmButton && pendingSampleDelete) {
  const deletedName = pendingSampleDelete.name;
  groups = FxCollectionFlow.removeSampleGroup(groups, pendingSampleDelete.groupId);
  pendingSampleDelete = null;
  formMessage.textContent = `已删除样卷“${deletedName}”。`;
  render();
  return;
}

const cancelButton = event.target.closest('[data-action="cancel-delete-sample"]');
const clickedBackdrop = event.target.classList.contains('collection-delete-backdrop');
if (cancelButton || clickedBackdrop) {
  pendingSampleDelete = null;
  renderDeleteDialog();
}
```

Escape clears only `pendingSampleDelete`.

- [ ] **Step 4: Run the focused deletion test and verify GREEN**

Run: `node --test --test-name-pattern="whole samples confirm" tests/collection-pages.test.cjs`

Expected: PASS.

- [ ] **Step 5: Parse the page script**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('collection-confirm.html', 'utf8');
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new Function(match[1]);
}
console.log('collection-confirm.html inline scripts parse OK');
NODE
```

Expected: `collection-confirm.html inline scripts parse OK`.

- [ ] **Step 6: Commit**

```bash
git add collection-confirm.html tests/collection-pages.test.cjs
git commit -m "fix: split sample and page deletion behavior"
```

### Task 4: Regression Verification

**Files:**
- Verify: `collection-confirm.html`
- Verify: `collection-flow.js`
- Verify: `tests/*.cjs`

- [ ] **Step 1: Run all tests**

Run: `node --test tests/*.cjs`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run syntax and diff checks**

Run: `node --check collection-flow.js && git diff --check && git status --short`

Expected: no syntax error or whitespace error; only intended files are modified before their commits, and the tree is clean afterward.

