# Student Page Tool Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each student paper page and its grading toolbar scroll together, while moving the per-student confirmation action into one overall fixed footer.

**Architecture:** Replace the three-column student workspace with a fixed roster plus a two-row review area. The review area's scroll container renders repeated page rows, each containing paper and tools; the shared footer sits outside the scroll container. JavaScript chunks questions into pages and renders each page pair from the same question slice.

**Tech Stack:** Static HTML, CSS Grid, vanilla JavaScript, Node.js built-in test runner.

---

### Task 1: Lock the page-pair contract with tests

**Files:**
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write the failing structural test**

```js
test('student grading pairs every paper page with its tools in one scroll stack', () => {
  assert.match(gradingPage, /id="studentPageStack"/);
  assert.match(gradingPage, /class="student-page-row"/);
  assert.match(gradingPage, /function studentPages/);
  assert.match(gradingPage, /function renderStudentPages/);
  assert.match(gradingPage, /data-student-page/);
  assert.match(gradingPage, /studentPageStack\.addEventListener\("click"/);
});
```

- [ ] **Step 2: Write the failing overall-footer test**

```js
test('student confirmation lives in the overall review footer', () => {
  assert.match(gradingPage, /class="student-review-footer"[\s\S]*id="confirmStudent"/);
  assert.doesNotMatch(gradingPage, /class="student-tool-footer"/);
  assert.match(gradingPage, /\.student-review\s*\{[^}]*grid-template-rows:\s*minmax\(0,1fr\) auto/s);
});
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern='student grading pairs every paper page|student confirmation lives' tests/collection-pages.test.cjs
```

Expected: both tests fail because `studentPageStack`, page rows, and the overall footer do not exist.

### Task 2: Build the shared scrolling page layout

**Files:**
- Modify: `grading-by-question-demo.html:890-1170`
- Modify: `grading-by-question-demo.html:1350-1380`

- [ ] **Step 1: Replace student workspace CSS**

Use a fixed roster and review area:

```css
.student-workspace { grid-template-columns: 190px minmax(980px,1fr); }
.student-review { min-height: 0; display: grid; grid-template-rows: minmax(0,1fr) auto; }
.student-page-stack { min-height: 0; overflow: auto; scrollbar-width: thin; }
.student-page-row { min-height: 980px; display: grid; grid-template-columns: minmax(620px,1fr) 360px; }
.student-paper-stage { overflow: visible; }
.student-tool-panel { grid-template-rows: auto minmax(0,1fr); }
.student-question-tools { overflow: visible; }
.student-review-footer { display: flex; justify-content: flex-end; border-top: 1px solid var(--line); }
```

- [ ] **Step 2: Replace the static paper and tool columns**

```html
<section class="student-review" aria-label="当前学生作业与批改工具">
  <div class="student-page-stack" id="studentPageStack"></div>
  <footer class="student-review-footer">
    <button class="button primary" id="confirmStudent" type="button">确认批改</button>
  </footer>
</section>
```

- [ ] **Step 3: Keep the roster footer independent**

Do not move `confirmAllStudents`; it remains inside `.student-roster__footer`.

### Task 3: Render pages and page-scoped tools

**Files:**
- Modify: `grading-by-question-demo.html:1635-2075`

- [ ] **Step 1: Replace single-page DOM bindings**

```js
const studentPageStack = document.getElementById("studentPageStack");
```

Remove `studentPaper` and `studentQuestionTools` bindings.

- [ ] **Step 2: Add question chunking**

```js
function studentPages() {
  const size = isExam ? 2 : 3;
  const pages = [];
  for (let index = 0; index < questions.length; index += size) {
    pages.push(questions.slice(index, index + size));
  }
  return pages;
}
```

- [ ] **Step 3: Extract page paper and tool markup**

Create `studentPaperMarkup(pageQuestions)` using the current paper header and question markup, and `studentToolsMarkup(pageQuestions)` using the current tool controls. Each function maps only its `pageQuestions` argument.

- [ ] **Step 4: Render paired page rows**

```js
function renderStudentPages() {
  const pages = studentPages();
  studentPageStack.innerHTML = pages.map((pageQuestions, index) => `
    <section class="student-page-row" data-student-page="${index + 1}">
      <main class="student-paper-stage" aria-label="第 ${index + 1} 页学生作业">
        <article class="student-paper">${studentPaperMarkup(pageQuestions)}</article>
      </main>
      <aside class="student-tool-panel" aria-label="第 ${index + 1} 页结构化批改工具">
        <header class="student-tool-head"><strong class="student-tool-page">${index + 1}/${pages.length}</strong></header>
        <div class="student-question-tools">${studentToolsMarkup(pageQuestions)}</div>
      </aside>
    </section>
  `).join("");
}
```

- [ ] **Step 5: Render the new stack from the workspace renderer**

Replace calls to `renderStudentPaper()` and `renderStudentTools()` with `renderStudentPages()`.

### Task 4: Preserve grading interactions through delegation

**Files:**
- Modify: `grading-by-question-demo.html:2000-2075`

- [ ] **Step 1: Move click delegation to the page stack**

Change the existing `studentQuestionTools.addEventListener("click", ...)` listener to `studentPageStack.addEventListener("click", ...)` without changing its result-update branches.

- [ ] **Step 2: Move score delegation to the page stack**

Change the existing `studentQuestionTools.addEventListener("change", ...)` listener to `studentPageStack.addEventListener("change", ...)` without changing score normalization.

- [ ] **Step 3: Reset scroll only when selecting another student**

```js
activeStudentName = button.dataset.studentName;
renderStudentWorkspace();
studentPageStack.scrollTop = 0;
```

Result edits continue to re-render inside the existing container so its current scroll position is retained.

### Task 5: Verify and commit

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Run the focused tests**

```bash
node --test --test-name-pattern='student grading pairs every paper page|student confirmation lives' tests/collection-pages.test.cjs
```

Expected: 2 passing tests.

- [ ] **Step 2: Check inline script syntax**

```bash
node -e 'const fs=require("node:fs"); const html=fs.readFileSync("grading-by-question-demo.html","utf8"); const scripts=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]; for (const script of scripts) if (script[1].trim()) new Function(script[1]);'
```

Expected: exit code 0.

- [ ] **Step 3: Run the full regression suite**

```bash
node --test tests/*.test.cjs
git diff --check
```

Expected: all tests pass and no whitespace errors.

- [ ] **Step 4: Commit**

```bash
git add grading-by-question-demo.html tests/collection-pages.test.cjs
git commit -m "feat: pair student pages with grading tools"
```
