# Per-Sample Submission Anomaly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将提交异常按样卷分组处理，只展示存在缺页或未识别学生异常的样卷，并在每个样卷内逐个预览学生整份作业。

**Architecture:** `collection-flow.js` 增加按 `groupId` 构建异常样卷队列的纯函数。`collection-confirm.html` 使用“异常样卷 → 当前样卷的异常学生 → 整页作业预览”的层级状态，处理完当前样卷后自动进入下一份异常样卷。现有无异常任务、任务创建和历史快照流程保持不变。

**Tech Stack:** 原生 HTML、CSS、JavaScript，Node.js `node:test`。

---

### Task 1: 定义按样卷分组行为

**Files:**
- Modify: `tests/collection-flow.test.cjs`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 添加纯函数失败测试**

```js
test('groups supported anomalies by sample and excludes samples without anomalies', () => {
  const groups = [
    { id: 'sample-1', name: '练习' },
    { id: 'sample-2', name: '测试' },
    { id: 'sample-3', name: '无异常样卷' },
  ];
  const result = flow.groupCollectionAnomalies(groups, [
    { id: 'a1', groupId: 'sample-1', type: '缺页', status: 'pending' },
    { id: 'a2', groupId: 'sample-2', type: '未识别学生', status: 'pending' },
  ]);
  assert.deepEqual(result.map((item) => item.groupId), ['sample-1', 'sample-2']);
  assert.deepEqual(result.map((item) => item.anomalies.length), [1, 1]);
});
```

- [ ] **Step 2: 添加页面结构失败测试**

```js
test('anomaly review is grouped by sample before student', () => {
  assert.match(confirmPage, /anomaly-sample-nav/);
  assert.match(confirmPage, /data-action="select-anomaly-sample"/);
  assert.match(confirmPage, /当前样卷已处理/);
  assert.match(confirmPage, /未识别学生/);
  assert.doesNotMatch(confirmPage, /多页/);
});
```

- [ ] **Step 3: 运行定向测试确认失败**

Run: `node --test --test-name-pattern="groups supported anomalies|grouped by sample" tests/*.cjs`

Expected: FAIL，指出缺少分组函数和样卷导航。

### Task 2: 实现按样卷构建队列

**Files:**
- Modify: `collection-flow.js`
- Test: `tests/collection-flow.test.cjs`

- [ ] **Step 1: 收紧异常类型并实现分组函数**

```js
const COLLECTION_ANOMALY_TYPES = ['缺页', '未识别学生'];
const groupCollectionAnomalies = (groups, anomalies) => (Array.isArray(groups) ? groups : [])
  .map((group) => ({
    groupId: group.id,
    name: normalizeName(group.name),
    kind: normalizeKind(group.kind),
    anomalies: supportedCollectionAnomalies(anomalies).filter((item) => item.groupId === group.id),
  }))
  .filter((group) => group.anomalies.length > 0);
```

- [ ] **Step 2: 导出函数并运行测试**

Run: `node --test --test-name-pattern="groups supported anomalies" tests/collection-flow.test.cjs`

Expected: PASS。

### Task 3: 重构演示异常数据和样卷导航

**Files:**
- Modify: `collection-confirm.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 将演示异常改为两个样卷各自的缺页和未识别学生**

样卷 1 包含张小明缺页、一个未识别学生；样卷 2 包含李华缺页、一个未识别学生。所有异常都带正确的 `groupId`，删除多页演示数据。

- [ ] **Step 2: 增加异常样卷导航状态**

引入 `selectedAnomalyGroupId`，通过 `groupCollectionAnomalies(groups, anomalies)` 计算可见样卷。样卷导航仅渲染结果中的样卷，显示样卷名称和剩余人数。

- [ ] **Step 3: 学生列表只渲染当前样卷数据**

当前学生、页面选择、进度统计均从当前样卷的 `anomalies` 读取，不允许跨样卷混排。

- [ ] **Step 4: 当前样卷完成后自动切换**

处理学生后优先选择当前样卷下一位待处理学生；当前样卷全部完成后选择下一份仍有待处理学生的异常样卷。

- [ ] **Step 5: 运行页面定向测试**

Run: `node --test --test-name-pattern="grouped by sample|full-document anomaly workflow" tests/collection-pages.test.cjs`

Expected: PASS。

### Task 4: 完整验证

**Files:**
- Modify: `collection-flow.js`
- Modify: `collection-confirm.html`
- Modify: `tests/collection-flow.test.cjs`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 运行完整测试**

Run: `node --test tests/*.cjs`

Expected: 所有测试通过，0 failures。

- [ ] **Step 2: 检查内联脚本语法**

Run: `node -e "const fs=require('fs'),vm=require('vm'); const source=fs.readFileSync('collection-confirm.html','utf8'); [...source.matchAll(/<script(?![^>]*src=)[^>]*>([\\s\\S]*?)<\\/script>/gi)].forEach((match,index)=>new vm.Script(match[1],{filename:'collection-confirm.html#'+(index+1)}));"`

Expected: exit 0。

- [ ] **Step 3: 检查差异格式**

Run: `git diff --check`

Expected: exit 0。
