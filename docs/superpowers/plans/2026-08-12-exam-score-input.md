# 考试赋分直接输入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让考试模式的每张学生答题卡同时支持点击循环赋分和直接输入分数，并实时同步该题的统计展示。

**Architecture:** 在 `grading-by-question-demo.html` 的考试渲染分支中，分数徽标内保留数字输入控件，输入提交后更新现有 `student.score` 与 `student.result`。答题卡的点击交互复用原有 0.5 分循环算法；输入容器阻止冒泡，避免一次编辑同时触发循环；两种方式均用 `renderAll()` 重绘左侧题目分数、分组及答题卡。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Node.js 内置测试运行器。

---

### Task 1: 增加直接输入的页面回归测试

**Files:**
- Modify: `tests/collection-pages.test.cjs:182-204`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 写出失败的考试分数输入测试**

在 `grading starts pending...` 测试之后新增：

```js
test('exam grading supports both direct score input and card click cycling', () => {
  assert.match(gradingPage, /class="score-input"/);
  assert.match(gradingPage, /type="number"/);
  assert.match(gradingPage, /step="0\.5"/);
  assert.match(gradingPage, /data-score-input/);
  assert.match(gradingPage, /commitExamScore/);
  assert.match(gradingPage, /const nextScore = numericScore <= 0 \? max : Math\.max\(0, Math\.round\(\(numericScore - 0\.5\) \* 2\) \/ 2\);/);
  assert.match(gradingPage, /data-score-editor.*stopPropagation/s);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test --test-name-pattern="exam grading exposes direct score inputs" tests/collection-pages.test.cjs`

Expected: FAIL，因为当前实现会在考试模式的 `cycleResult` 开头返回，点击答题卡不会循环切换分数。

- [ ] **Step 3: 保持测试为红色前不改生产代码**

确认失败信息指向缺失的 `score-input`，而非测试语法或文件读取错误。

### Task 2: 实现考试模式的分数输入与验证

**Files:**
- Modify: `grading-by-question-demo.html:662-674`
- Modify: `grading-by-question-demo.html:1452-1515`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 添加紧凑输入控件样式**

将分数徽标改为承载输入框的容器，并增加：

```css
.score-input {
  width: 34px;
  border: 0;
  outline: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  font-weight: inherit;
  text-align: right;
}
.score-input:focus { border-bottom: 1px solid currentColor; }
```

- [ ] **Step 2: 为数字输入框提供合法初始值**

在 `studentScore` 后新增：

```js
function scoreInputValue(student, question) {
  const score = typeof student.score === "number"
    ? student.score
    : defaultScoreForResult(student.result, question);
  return typeof score === "number" ? formatScore(score) : "";
}
```

- [ ] **Step 3: 在考试答题卡中渲染数字输入框**

将 `studentCard` 的考试 `mark` 改为：

```js
`<span class="score-mark" data-score-editor>` +
  `<input class="score-input" type="number" min="0" max="${maxScore(question)}" step="0.5" ` +
  `value="${scoreInputValue(student, question)}" placeholder="待评" data-score-input data-student="${student.id}" aria-label="${student.name}第 ${question.id} 题得分">` +
  ` / ${maxScore(question)} 分</span>`
```

- [ ] **Step 4: 增加统一的输入提交函数**

在 `cycleResult` 前新增：

```js
function commitExamScore(studentId, rawValue) {
  const question = activeQuestion();
  const student = question.students.find((item) => item.id === studentId);
  const max = maxScore(question);
  if (rawValue === "") {
    renderAll();
    return;
  }
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    renderAll();
    return;
  }
  const score = Math.max(0, Math.min(max, Math.round(parsed * 2) / 2));
  student.score = score;
  student.result = score === max ? "correct" : score === 0 ? "wrong" : "partial";
  renderAll();
}
```

- [ ] **Step 5: 绑定输入事件并阻止点击冒泡**

在 `bindPaperInteractions()` 的开头加入：

```js
groupsScroll.querySelectorAll("[data-score-input]").forEach((input) => {
  input.closest("[data-score-editor]").addEventListener("click", (event) => event.stopPropagation());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
  input.addEventListener("change", () => commitExamScore(input.dataset.student, input.value));
});
```

在 `cycleResult` 中保留考试分支的循环算法：

```js
if (isExam) {
  const max = maxScore(question);
  const currentScore = typeof student.score === "number"
    ? student.score
    : defaultScoreForResult(student.result, question);
  const numericScore = typeof currentScore === "number" ? currentScore : max;
  const nextScore = numericScore <= 0 ? max : Math.max(0, Math.round((numericScore - 0.5) * 2) / 2);
  student.score = nextScore;
  student.result = nextScore === max ? "correct" : nextScore === 0 ? "wrong" : "partial";
  renderAll();
  return;
}
```

保留输入容器的 `stopPropagation()`，使点击输入框不会触发上述循环。

- [ ] **Step 6: 运行专项测试确认通过**

Run: `node --test --test-name-pattern="exam grading exposes direct score inputs" tests/collection-pages.test.cjs`

Expected: PASS。

### Task 3: 回归验证并提交

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: 运行全量页面与流程测试**

Run: `node --test tests/*.cjs`

Expected: 全部测试通过。

- [ ] **Step 2: 检查页面脚本语法和空白错误**

Run:

```bash
node -e "const fs=require('fs'),vm=require('vm'); const source=fs.readFileSync('grading-by-question-demo.html','utf8'); [...source.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].forEach((match,index)=>new vm.Script(match[1],{filename:'grading-by-question-demo.html#'+(index+1)}));"
git diff --check
```

Expected: 两条命令都以 0 退出。

- [ ] **Step 3: 提交实现**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: add direct exam score input"
```
