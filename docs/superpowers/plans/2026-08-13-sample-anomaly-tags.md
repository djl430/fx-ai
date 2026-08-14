# Sample Anomaly Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在每个样卷标题栏右侧展示该样卷自身的“缺页 N 人”“未识别 N 页”标签，并支持点击标签直达对应异常。

**Architecture:** 在 `collection-flow.js` 中增加纯函数，按 `groupId` 汇总仍待处理的两类异常并返回首条异常 ID；`collection-confirm.html` 只负责渲染标签与处理点击跳转。沿用现有按样卷异常处理区，不新增页面或存储结构。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Node.js `node:test`

---

### Task 1: 汇总单个样卷的待处理异常

**Files:**
- Modify: `collection-flow.js`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: Write the failing test**

```js
test('summarizes pending anomaly labels for one sample', () => {
  assert.deepEqual(flow.summarizeCollectionAnomalies([
    { id: 'm1', groupId: 'g1', type: '缺页', student: '张三', status: 'pending' },
    { id: 'm2', groupId: 'g1', type: '缺页', student: '张三', status: 'pending' },
    { id: 'u1', groupId: 'g1', type: '未识别学生', unrecognizedPageCount: 2, status: 'pending' },
    { id: 'done', groupId: 'g1', type: '缺页', student: '李四', status: 'resolved' },
    { id: 'other', groupId: 'g2', type: '缺页', student: '王五', status: 'pending' },
  ], 'g1'), {
    missingStudents: 1,
    unrecognizedPages: 2,
    firstPendingIds: { missing: 'm1', unrecognized: 'u1' },
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="summarizes pending anomaly labels" tests/collection-flow.test.cjs`
Expected: FAIL because `summarizeCollectionAnomalies` is not exported.

- [ ] **Step 3: Write minimal implementation**

```js
const summarizeCollectionAnomalies = (anomalies, groupId) => {
  const pending = supportedCollectionAnomalies(anomalies)
    .filter((item) => item.groupId === groupId && item.status !== 'resolved');
  const missing = pending.filter((item) => item.type === '缺页');
  const unrecognized = pending.filter((item) => item.type === '未识别学生');
  return {
    missingStudents: new Set(missing.map((item) => item.student).filter(Boolean)).size,
    unrecognizedPages: unrecognized.reduce((total, item) => total + Math.max(1, Number(item.unrecognizedPageCount) || 0), 0),
    firstPendingIds: { missing: missing[0]?.id || '', unrecognized: unrecognized[0]?.id || '' },
  };
};
```

Export the function with the existing `FxCollectionFlow` API.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="summarizes pending anomaly labels" tests/collection-flow.test.cjs`
Expected: PASS.

### Task 2: 渲染并点击样卷异常标签

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write the failing page contract test**

```js
test('sample headers expose clickable anomaly type labels', () => {
  assert.match(confirmPage, /sample-anomaly-tags/);
  assert.match(confirmPage, /data-action="open-sample-anomaly"/);
  assert.match(confirmPage, /缺页[^<]*人/);
  assert.match(confirmPage, /未识别[^<]*页/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="sample headers expose clickable" tests/collection-pages.test.cjs`
Expected: FAIL because the sample header contains no anomaly type labels.

- [ ] **Step 3: Add label data and rendering**

Add `unrecognizedPageCount: 2` to each seeded `未识别学生` anomaly. In `renderGroup`, call `FxCollectionFlow.summarizeCollectionAnomalies(anomalies, group.id)` and render only non-zero tags:

```html
<div class="sample-anomaly-tags">
  <button data-action="open-sample-anomaly" data-group-id="sample-1" data-anomaly-type="缺页">缺页 1 人</button>
  <button data-action="open-sample-anomaly" data-group-id="sample-1" data-anomaly-type="未识别学生">未识别 2 页</button>
</div>
```

No wrapper is rendered when both counts are zero.

- [ ] **Step 4: Add click routing**

Before the read-only event guard, handle `open-sample-anomaly`: set `stage = 'anomalies'`, choose the clicked group, choose its first pending anomaly of the clicked type, select its first page, call `render()`, and scroll to the page top.

- [ ] **Step 5: Run page tests**

Run: `node --test --test-name-pattern="sample headers expose clickable|submission picker entry follows" tests/collection-pages.test.cjs`
Expected: PASS.

### Task 3: Complete regression verification

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

- [ ] **Step 3: Check patch whitespace**

Run: `git diff --check`
Expected: no output.
