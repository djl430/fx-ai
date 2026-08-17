# Grading Result Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the diagnosis entry and add a sticky, screenshot-inspired result rail that navigates among correct, partial, wrong, and ungraded sections.

**Architecture:** Keep the feature inside the existing single-file page. Static rail markup lives beside the dynamically rendered result sections; a small controller maps each rail button to the first section with the matching `data-result`, scrolls the existing `.groups-scroll` container, and synchronizes active state during manual scrolling.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner

---

### Task 1: Lock the required markup and behavior with failing tests

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add focused source-level tests**

Append tests that require removal of the diagnosis UI and the complete four-item result rail contract:

```js
test('grading page removes the diagnosis entry and modal', () => {
  assert.doesNotMatch(gradingPage, />错因诊断</);
  assert.doesNotMatch(gradingPage, /id="diagnosisModal"/);
  assert.doesNotMatch(gradingPage, /diagnosis:\s*document\.getElementById/);
});

test('grading page exposes a four-state sticky result navigation rail', () => {
  assert.match(gradingPage, /id="resultRail"/);
  assert.match(gradingPage, /\.result-rail\s*\{[^}]*position:\s*absolute/s);
  for (const result of ['correct', 'partial', 'wrong', 'ungraded']) {
    assert.match(gradingPage, new RegExp(`data-result-target="${result}"`));
  }
  assert.match(gradingPage, /scrollTo\(\{[\s\S]*behavior:\s*"smooth"/);
  assert.match(gradingPage, /groupsScroll\.addEventListener\("scroll"/);
  assert.match(gradingPage, /aria-current/);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/collection-pages.test.cjs`

Expected: the two new tests fail because the diagnosis UI is still present and `resultRail` does not exist.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/collection-pages.test.cjs
git commit -m "test: specify grading result navigation rail"
```

### Task 2: Implement the visual rail and interaction controller

**Files:**
- Modify: `grading-by-question-demo.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Remove diagnosis-only UI**

Delete the topbar button whose text is `错因诊断`, delete the `#diagnosisModal` backdrop, and reduce the modal registry to:

```js
const modals = {
  preview: document.getElementById("previewModal")
};
```

- [ ] **Step 2: Add static accessible rail markup**

Place the rail inside `.answer-zone`, after `#groupsScroll`:

```html
<nav class="result-rail" id="resultRail" aria-label="批改结果快速定位">
  <button class="result-rail__button is-active" type="button" data-result-target="correct" aria-label="定位到正确模块" aria-current="true"><span class="result-rail__tick"></span><span class="result-rail__tooltip">正确</span></button>
  <button class="result-rail__button" type="button" data-result-target="partial" aria-label="定位到半对模块"><span class="result-rail__tick"></span><span class="result-rail__tooltip">半对</span></button>
  <button class="result-rail__button" type="button" data-result-target="wrong" aria-label="定位到错误模块"><span class="result-rail__tick"></span><span class="result-rail__tooltip">错误</span></button>
  <button class="result-rail__button" type="button" data-result-target="ungraded" aria-label="定位到未批改模块"><span class="result-rail__tick"></span><span class="result-rail__tooltip">未批改</span></button>
</nav>
```

- [ ] **Step 3: Add screenshot-inspired rail styling**

Add these rules, merging the first two declarations into the existing selectors:

```css
.answer-zone { position: relative; }
.groups-scroll { padding: 20px 62px 20px 20px; }

.result-rail {
  position: absolute;
  z-index: 12;
  top: 68px;
  right: 12px;
  bottom: 70px;
  width: 38px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-end;
  padding: 10px 0;
  border: 1px solid rgba(223,229,240,.72);
  border-radius: 20px;
  background: rgba(255,255,255,.82);
  box-shadow: 0 10px 24px rgba(45,64,104,.08);
  backdrop-filter: blur(8px);
}

.result-rail::before {
  content: "";
  position: absolute;
  top: 12px;
  right: 8px;
  bottom: 12px;
  width: 7px;
  background: repeating-linear-gradient(to bottom, #cbd2de 0 1px, transparent 1px 8px);
  opacity: .78;
  pointer-events: none;
}

.result-rail__button {
  position: relative;
  z-index: 1;
  width: 38px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 7px 0 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.result-rail__tick {
  width: 12px;
  height: 2px;
  border-radius: 999px;
  background: #b7c0ce;
  transition: width .18s ease, background-color .18s ease, box-shadow .18s ease;
}

.result-rail__button:hover .result-rail__tick,
.result-rail__button:focus-visible .result-rail__tick,
.result-rail__button.is-active .result-rail__tick {
  width: 27px;
  background: #263244;
  box-shadow: 0 0 0 1px rgba(38,50,68,.04);
}

.result-rail__button:focus-visible { outline: none; }
.result-rail__tooltip {
  position: absolute;
  right: 42px;
  top: 50%;
  transform: translate(4px,-50%);
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255,255,255,.96);
  color: var(--ink);
  box-shadow: 0 8px 20px rgba(45,64,104,.1);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity .16s ease, transform .16s ease;
}

.result-rail__button:hover .result-rail__tooltip,
.result-rail__button:focus-visible .result-rail__tooltip {
  opacity: 1;
  transform: translate(0,-50%);
}

@media (max-width: 1100px) {
  .groups-scroll { padding-right: 52px; }
  .result-rail { right: 8px; width: 34px; }
  .result-rail__button { width: 34px; }
}
```

- [ ] **Step 4: Add navigation and scroll synchronization**

Create `setActiveResultRail(result)`, `syncResultRail()`, and `bindResultRail()` functions:

```js
let resultRailFrame = 0;

function setActiveResultRail(result) {
  resultRail.querySelectorAll("[data-result-target]").forEach((button) => {
    const active = button.dataset.resultTarget === result;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
}

function syncResultRail() {
  const sections = [...groupsScroll.querySelectorAll(".group-section[data-result]")];
  if (!sections.length) return;
  const scrollRect = groupsScroll.getBoundingClientRect();
  const marker = scrollRect.top + Math.min(140, scrollRect.height * .28);
  let current = sections[0];
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) current = section;
  });
  setActiveResultRail(current.dataset.result);
}

function bindResultRail() {
  resultRail.querySelectorAll("[data-result-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = groupsScroll.querySelector(`.group-section[data-result="${button.dataset.resultTarget}"]`);
      if (!target) return;
      const top = groupsScroll.scrollTop
        + target.getBoundingClientRect().top
        - groupsScroll.getBoundingClientRect().top
        - 12;
      groupsScroll.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      setActiveResultRail(button.dataset.resultTarget);
    });
  });
  groupsScroll.addEventListener("scroll", () => {
    if (resultRailFrame) return;
    resultRailFrame = requestAnimationFrame(() => {
      resultRailFrame = 0;
      syncResultRail();
    });
  }, { passive: true });
}
```

Call `syncResultRail()` after both standard and similarity-group renders, and call `bindResultRail()` once before the initial `renderAll()`.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test tests/collection-pages.test.cjs`

Expected: all tests pass with no warnings or failures.

- [ ] **Step 6: Inspect the target page in a browser**

Open `grading-by-question-demo.html?mode=homework&taskId=cluster-homework`. Verify all four clicks reach the matching result section, manual scrolling changes the active tick, the rail stays visible, no content is obscured, and the diagnosis button is absent.

- [ ] **Step 7: Run the complete test suite**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass with no warnings or failures.

- [ ] **Step 8: Commit the implementation**

```bash
git add grading-by-question-demo.html
git commit -m "feat: add grading result navigation rail"
```
