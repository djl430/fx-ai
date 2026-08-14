# Conditional Collection Anomaly Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 演示两个待确认采集任务：无异常任务确认后直接开始分析，有异常任务确认样卷后在同页逐个预览并处理缺页、多页、未归属学生作业。

**Architecture:** `collection-history.html` 提供两个待确认入口，并通过任务数据决定是否存在异常。`collection-confirm.html` 使用 `samples` 与 `anomalies` 两个阶段；异常阶段以学生列表、整页试卷预览和处理面板组成，不复用缩略图选择器。`collection-flow.js` 提供阶段判断与异常处理的纯函数，便于用 Node 内置测试覆盖。

**Tech Stack:** 原生 HTML、CSS、JavaScript，Node.js `node:test`。

---

### Task 1: 用失败测试定义条件流程和演示任务

**Files:**
- Modify: `tests/collection-flow.test.cjs`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 添加纯函数行为测试**

```js
test('chooses anomaly review only when a supported anomaly is pending', () => {
  assert.equal(flow.nextCollectionStep([]), 'start-analysis');
  assert.equal(flow.nextCollectionStep([{ type: '缺页', status: 'pending' }]), 'review-anomalies');
  assert.equal(flow.nextCollectionStep([{ type: '重复提交', status: 'pending' }]), 'start-analysis');
});

test('resolves one anomaly without mutating the source list', () => {
  const source = [{ id: 'missing-1', type: '缺页', status: 'pending' }];
  const next = flow.resolveCollectionAnomaly(source, 'missing-1', '标记缺页');
  assert.equal(source[0].status, 'pending');
  assert.deepEqual(next[0], { id: 'missing-1', type: '缺页', status: 'resolved', choice: '标记缺页' });
});
```

- [ ] **Step 2: 添加页面结构回归测试**

```js
test('history demo contains two pending tasks with different anomaly conditions', () => {
  assert.match(historyPage, /id:'today-2026'[\s\S]*anomalyCount:0/);
  assert.match(historyPage, /id:'today-1942'[\s\S]*anomalyCount:3/);
});

test('anomaly task uses a conditional same-page full document review', () => {
  assert.match(confirmPage, /data-stage="anomalies"/);
  assert.match(confirmPage, /anomaly-document-viewer/);
  assert.match(confirmPage, /data-action="select-anomaly-page"/);
  assert.match(confirmPage, /返回修改样卷/);
  assert.doesNotMatch(confirmPage, /重复提交/);
});
```

- [ ] **Step 3: 运行测试并确认因缺少新行为失败**

Run: `node --test --test-name-pattern="chooses anomaly review|resolves one anomaly|two pending tasks|full document review" tests/*.cjs`

Expected: FAIL，指出新纯函数、第二个待确认任务和整页预览结构尚不存在。

### Task 2: 实现条件分支纯函数

**Files:**
- Modify: `collection-flow.js`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: 实现支持类型过滤、阶段判断和不可变处理**

```js
const COLLECTION_ANOMALY_TYPES = ['缺页', '多页', '未归属'];
const supportedCollectionAnomalies = (anomalies) => (Array.isArray(anomalies) ? anomalies : [])
  .filter((anomaly) => anomaly && COLLECTION_ANOMALY_TYPES.includes(anomaly.type));
const nextCollectionStep = (anomalies) => supportedCollectionAnomalies(anomalies)
  .some((anomaly) => anomaly.status !== 'resolved') ? 'review-anomalies' : 'start-analysis';
const resolveCollectionAnomaly = (anomalies, anomalyId, choice) => supportedCollectionAnomalies(anomalies)
  .map((anomaly) => anomaly.id === anomalyId ? { ...anomaly, status: 'resolved', choice: String(choice || '') } : { ...anomaly });
```

- [ ] **Step 2: 导出函数并运行定向测试**

Run: `node --test --test-name-pattern="chooses anomaly review|resolves one anomaly" tests/collection-flow.test.cjs`

Expected: PASS。

### Task 3: 建立两个待确认任务和条件确认文案

**Files:**
- Modify: `collection-history.html`
- Modify: `index.html`
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 增加无异常待确认任务**

在历史任务首位添加 `today-2026`，标记 `anomalyCount: 0`；保留 `today-1942` 并标记 `anomalyCount: 3`。同步首页 `historySeeds`，让采集记录气泡显示两批待确认。

- [ ] **Step 2: 根据任务加载异常数据**

`today-2026` 返回空数组；`today-1942` 返回缺页、多页、未归属各一条，其余任务查看已有快照。

- [ ] **Step 3: 根据待处理数量渲染主按钮**

无异常时显示 `确认无误并开始分析`；有异常时显示 `确认样卷，处理 3 位异常学生`，并且样卷阶段只提示下一步处理，不允许提前打开异常处理。

- [ ] **Step 4: 运行历史任务和文案定向测试**

Run: `node --test --test-name-pattern="two pending tasks|simplified analysis copy|history button" tests/collection-pages.test.cjs`

Expected: PASS。

### Task 4: 实现同页整份学生作业异常处理

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 添加异常阶段布局**

增加 `data-stage="anomalies"` 容器。左侧为三位异常学生，中央为单页大幅作业画布及页码切换，右侧为异常说明和处理选项。样卷阶段确认后隐藏样卷列表并显示异常阶段。

- [ ] **Step 2: 为三种异常配置最小操作**

- 缺页：`确认缺页并继续`。
- 多页：`保留全部页面` 或 `移出多余页面`。
- 未归属：候选学生单选后 `确认归属`。

处理当前学生后自动定位下一位待处理学生；全部完成后底部按钮改为 `确认异常并开始分析`。

- [ ] **Step 3: 支持返回样卷**

点击 `返回修改样卷` 回到样卷阶段并清空本次异常处理选择，避免样卷结构变化后沿用旧判断。

- [ ] **Step 4: 运行异常页面结构测试**

Run: `node --test --test-name-pattern="full document review|focused anomaly workflow" tests/collection-pages.test.cjs`

Expected: PASS。

### Task 5: 全量验证

**Files:**
- Modify: `collection-flow.js`
- Modify: `collection-history.html`
- Modify: `collection-confirm.html`
- Modify: `index.html`
- Modify: `tests/collection-flow.test.cjs`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 运行完整自动化测试**

Run: `node --test tests/*.cjs`

Expected: 所有测试通过，0 failures。

- [ ] **Step 2: 检查页面内联脚本语法**

Run: `node -e "const fs=require('fs'),vm=require('vm'); for (const file of ['collection-confirm.html','collection-history.html','index.html']) { const source=fs.readFileSync(file,'utf8'); [...source.matchAll(/<script(?![^>]*src=)[^>]*>([\\s\\S]*?)<\\/script>/gi)].forEach((match,index)=>new vm.Script(match[1],{filename:file+'#'+(index+1)})); }"`

Expected: exit 0，无语法错误。

- [ ] **Step 3: 检查差异格式**

Run: `git diff --check`

Expected: exit 0。
