# 紧凑样卷确认与提交补录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 紧凑化样卷确认页、支持从全部提交中逐页补录，并让直接访问首页稳定回到一份待确认采集任务。

**Architecture:** `collection-flow.js` 继续承载可单测的数据操作：查询页面归属、按原始顺序追加未归属页面和重置采集演示状态。`collection-confirm.html` 保持当前单文件 demo 的渲染模式，新增提交选择弹窗及固定演示提交数据。`index.html` 只在非确认跳转时清理采集任务的本地状态。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript、Node `node:test`。

---

### Task 1: 提交页面归属与追加工具

**Files:**
- Modify: `collection-flow.js`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: 写入失败测试**

```js
test('adds only unassigned selected submission pages in source order', () => {
  const groups = [{ id: 'sample-1', pages: [{ id: 'a-1' }] }, { id: 'sample-2', pages: [] }];
  const submissions = [
    { id: 'a-1', studentId: 'a', sourcePageNumber: 1 },
    { id: 'b-2', studentId: 'b', sourcePageNumber: 2 },
    { id: 'b-1', studentId: 'b', sourcePageNumber: 1 },
  ];
  const next = flow.addSubmissionPages(groups, 'sample-2', submissions, ['a-1', 'b-2', 'b-1']);
  assert.deepEqual(next[1].pages.map((page) => page.id), ['b-1', 'b-2']);
  assert.equal(flow.pageOwner(groups, 'a-1').groupId, 'sample-1');
});
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test --test-name-pattern="adds only unassigned" tests/collection-flow.test.cjs`

Expected: FAIL，因为 `addSubmissionPages` 尚不存在。

- [ ] **Step 3: 实现最小工具函数**

```js
const pageOwner = (groups, pageId) => (Array.isArray(groups) ? groups : [])
  .map((group) => ({ group, page: group?.pages?.find((page) => page.id === pageId) }))
  .find((item) => item.page)?.group || null;

const addSubmissionPages = (groups, targetGroupId, submissions, pageIds) => {
  const selected = new Set(pageIds || []);
  const assigned = new Set((groups || []).flatMap((group) => (group.pages || []).map((page) => page.id)));
  const additions = (submissions || []).filter((page) => selected.has(page.id) && !assigned.has(page.id))
    .sort((a, b) => String(a.studentId).localeCompare(String(b.studentId)) || a.sourcePageNumber - b.sourcePageNumber);
  return (groups || []).map((group) => group.id === targetGroupId
    ? { ...group, pages: [...group.pages, ...additions] }
    : group);
};
```

Export both functions in the returned API.

- [ ] **Step 4: 验证通过**

Run: `node --test --test-name-pattern="adds only unassigned" tests/collection-flow.test.cjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add collection-flow.js tests/collection-flow.test.cjs
git commit -m "feat: add submission page selection helpers"
```

### Task 2: 紧凑样卷页面与逐页补录弹窗

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 写入失败页面契约测试**

```js
test('confirmation supports compact submission page selection', () => {
  assert.match(confirmPage, /data-action="open-submission-picker"/);
  assert.match(confirmPage, /data-action="add-selected-submissions"/);
  assert.match(confirmPage, /仅看未归属页面/);
  assert.match(confirmPage, /已添加至样卷/);
  assert.match(confirmPage, /min-height:\s*216px/);
  assert.match(confirmPage, /font-size:\s*clamp\(24px, 2\.4vw, 30px\)/);
});
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test --test-name-pattern="compact submission" tests/collection-pages.test.cjs`

Expected: FAIL，因为提交选择弹窗和紧凑尺寸尚不存在。

- [ ] **Step 3: 实现固定提交数据与弹窗状态**

在 `makePages` 后创建 `allSubmissions`，每个页面包含 `id`、`studentId`、`studentName`、`sourcePageNumber`、`paperTitle`、`content` 和 `mark`。让默认样卷页面复用这些对象。新增 `submissionPicker` 状态：`targetGroupId`、`selectedPageIds`、`query`、`unassignedOnly`。

- [ ] **Step 4: 实现样卷组入口和弹窗渲染**

在 `renderGroup` 的 `.sample-head` 中加入：

```html
<button class="submission-picker-trigger" type="button" data-action="open-submission-picker" data-group-id="...">从全部提交中添加</button>
```

仅在可编辑模式输出。渲染弹窗时按学生分组，已归属页面加 `disabled` 与“已添加至样卷 X”，每组提供 `data-action="select-student-pages"`，底部按钮为 `data-action="add-selected-submissions"`。

- [ ] **Step 5: 接入交互**

处理搜索、未归属筛选、单页勾选、学生可添加页全选、取消/遮罩/Escape 关闭；确认添加时调用 `FxCollectionFlow.addSubmissionPages`，更新 `groups`，提示添加页数并 `render()`。选择缓存只存在弹窗状态，关闭即丢弃。

- [ ] **Step 6: 应用紧凑 CSS**

将标题设为 `clamp(24px, 2.4vw, 30px)`，将纸张区 `min-height` 设为 `216px`，同步压缩 `.shell`、`.page-head`、`.scan-notice`、`.sample-list`、`.sample-head`、`.pages`、`.scan-card`、`.scan-paper`、`.sticky` 的上下尺寸。保留 `flex-wrap: wrap`、移动端断点和删除按钮热区。

- [ ] **Step 7: 验证通过并提交**

Run: `node --test --test-name-pattern="compact submission" tests/collection-pages.test.cjs`

Expected: PASS。

```bash
git add collection-confirm.html tests/collection-pages.test.cjs
git commit -m "feat: add compact submission page picker"
```

### Task 3: 首页演示起点重置

**Files:**
- Modify: `index.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 写入失败页面契约测试**

```js
test('direct home entry resets only collection demo data', () => {
  assert.match(indexPage, /collectionCreated\s*=.*===\s*['"]1['"]/);
  assert.match(indexPage, /resetCollectionDemoState/);
  assert.match(indexPage, /removeItem\(['"]fxGeneratedCollectionTasks['"]\)/);
  assert.match(indexPage, /delete.*today-1942/s);
});
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test --test-name-pattern="direct home entry resets" tests/collection-pages.test.cjs`

Expected: FAIL，因为首页没有显式重置函数。

- [ ] **Step 3: 实现最小重置逻辑**

在读取生成任务之前计算 `collectionCreated`。添加 `resetCollectionDemoState()`：删除 `fxGeneratedCollectionTasks` 和 `fxConfirmedCollectionBatch`；读取 `fxCollectionHistoryState`，删除 `records['today-1942']` 后回存；不访问 `fxGradingProgress` 与 `fxTaskListState`。仅在 `!collectionCreated` 时调用。

- [ ] **Step 4: 验证通过并提交**

Run: `node --test --test-name-pattern="direct home entry resets" tests/collection-pages.test.cjs`

Expected: PASS。

```bash
git add index.html tests/collection-pages.test.cjs
git commit -m "feat: reset collection demo on direct home entry"
```

### Task 4: 完整验证

**Files:**
- Verify: `collection-flow.js`, `collection-confirm.html`, `index.html`, `tests/*.cjs`

- [ ] **Step 1: 执行完整自动化验证**

Run: `node --test tests/*.cjs && node --check collection-flow.js && git diff --check`

Expected: 全部测试通过，脚本无语法错误，diff 无空白错误。

- [ ] **Step 2: 浏览器验收**

以本地 HTTP 服务打开：

1. 直接进入 `index.html`，确认气泡为 `1批待确认`。
2. 打开 `collection-confirm.html?task=today-1942`，确认首屏紧凑显示两份样卷。
3. 在样卷 1 打开“从全部提交中添加”，验证单页勾选、已归属禁用、学生全选和添加后追加。
4. 点击确认并回到 `index.html?collectionCreated=1`，验证进度运行约 5 秒并转为待确认。

- [ ] **Step 3: 提交验证后的结果**

```bash
git status --short
git log -3 --oneline
```
