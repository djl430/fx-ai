# 采集提交异常处理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在样卷确认页集中展示、处理并保存异常提交，不在作业列表添加异常入口。

**Architecture:** `collection-confirm.html` 持有 5 条演示异常及处理状态，按样卷渲染摘要和风险标签；右侧抽屉承载逐条处理。确认时将异常快照写进现有批次和历史记录；`collection-flow.js` 保留该快照，历史查看页只读展示。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Node.js 内置测试运行器。

---

### Task 1: 为异常快照与确认页面写失败回归测试

**Files:**
- Modify: `tests/collection-flow.test.cjs`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 新增异常快照保留测试**

```js
test('keeps collection anomalies in confirmed history records', () => {
  const next = flow.confirmHistoryRecord(null, {
    sourceTaskId: 'today-1942', batchId: 'batch-1', groups: [],
    anomalies: [{ id: 'missing-zhang', status: 'pending' }]
  });
  assert.deepEqual(next.records['today-1942'].anomalies, [{ id: 'missing-zhang', status: 'pending' }]);
});
```

- [ ] **Step 2: 新增确认页结构测试**

```js
test('collection confirmation contains a focused anomaly workflow without a home list entry', () => {
  assert.match(confirmPage, /发现 <strong id="anomalyCount">5<\/strong> 份异常提交/);
  assert.match(confirmPage, /data-action="open-anomaly-drawer"/);
  assert.match(confirmPage, /data-action="resolve-anomaly"/);
  assert.match(confirmPage, /data-action="continue-analysis"/);
  assert.match(confirmPage, /未处理异常不会自动归属，也不会进入批改/);
  assert.doesNotMatch(indexPage, /异常待处理/);
});
```

- [ ] **Step 3: 运行定向测试确认失败**

Run: `node --test --test-name-pattern="keeps collection anomalies|focused anomaly workflow" tests/*.cjs`

Expected: 两条测试失败，错误指出缺少 `anomalies` 快照和确认页异常入口。

### Task 2: 实现异常数据与只读快照

**Files:**
- Modify: `collection-flow.js:137-149`
- Modify: `collection-confirm.html:470-570,900-935`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: 在历史记录中保留异常数组**

在 `confirmHistoryRecord` 的记录对象增加：

```js
anomalies: Array.isArray(batch.anomalies) ? batch.anomalies.map((anomaly) => ({ ...anomaly })) : [],
```

- [ ] **Step 2: 定义演示异常与分组映射**

在确认页 `groups` 初始化后定义 5 条异常，包含 `id`、`groupId`、`type`、`student`、`detail`、`action`、`status` 和可选候选项；查看模式从 `savedRecord.anomalies` 复制快照。

- [ ] **Step 3: 确认批次时写入异常快照**

在批次对象中加入：

```js
anomalies: anomalies.map((anomaly) => ({ ...anomaly })),
```

- [ ] **Step 4: 运行快照定向测试确认通过**

Run: `node --test --test-name-pattern="keeps collection anomalies" tests/collection-flow.test.cjs`

Expected: PASS。

### Task 3: 实现摘要、样卷风险标签、抽屉与确认说明

**Files:**
- Modify: `collection-confirm.html:64-420,437-446,690-930`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 添加紧凑异常摘要与样卷标签**

摘要显示当前未处理数及类别标签；每个 `sample-head` 依据 `groupId` 渲染风险标签。无异常不渲染标签。

- [ ] **Step 2: 添加右侧异常抽屉和最小操作**

抽屉按异常类别展示。`保留多页` 直接解决；`确认归属` 与 `选择保留` 显示两个紧凑选项；`补充页面` 打开已有“全部提交”选择器。每次处理后更新 `anomaly.status`、摘要和样卷标签。查看模式仅显示处理状态。

- [ ] **Step 3: 在确认前拦截未处理异常**

当未处理异常大于 0 时显示确认说明；`返回处理` 打开抽屉，`继续分析` 继续使用原有批次创建逻辑。没有未处理异常时直接创建。

- [ ] **Step 4: 运行确认页定向测试确认通过**

Run: `node --test --test-name-pattern="focused anomaly workflow" tests/collection-pages.test.cjs`

Expected: PASS。

### Task 4: 全量验证与提交

**Files:**
- Modify: `collection-flow.js`
- Modify: `collection-confirm.html`
- Modify: `tests/collection-flow.test.cjs`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 运行完整测试与确认页脚本检查**

```bash
node --test tests/*.cjs
node -e "const fs=require('fs'),vm=require('vm'); const source=fs.readFileSync('collection-confirm.html','utf8'); [...source.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].forEach((match,index)=>new vm.Script(match[1],{filename:'collection-confirm.html#'+(index+1)}));"
git diff --check
```

Expected: 三条命令均以 0 退出。

- [ ] **Step 2: 提交实现与设计文档**

```bash
git add collection-flow.js collection-confirm.html tests/collection-flow.test.cjs tests/collection-pages.test.cjs docs/superpowers/specs/2026-08-12-collection-submission-anomalies-design.md docs/superpowers/plans/2026-08-12-collection-submission-anomalies.md
git commit -m "feat: add collection submission anomaly review"
```
