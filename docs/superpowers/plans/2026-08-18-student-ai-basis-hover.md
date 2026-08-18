# Student AI Basis Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep overall AI grading guidance below the answer and temporarily replace it with student-specific guidance while a response card is hovered or focused.

**Architecture:** Extract the existing overall-basis rendering into a helper and add a student-basis helper derived from current question and student data. Student cards expose their stable student id; delegated mouse and focus handlers switch the shared basis card context without adding overlays.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner

---

### Task 1: Specify overall and student basis behavior

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add a focused source contract test**

Require the `#basisScope` context label, `renderOverallBasis()`, `renderStudentBasis()`, stable `data-student-card` ids, mouseenter/mouseleave and focusin/focusout handlers, and a result-change refresh.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="question grading swaps overall AI basis for student basis on hover" tests/collection-pages.test.cjs`

Expected: FAIL because only overall basis rendering exists.

### Task 2: Implement contextual AI basis rendering

**Files:**
- Modify: `grading-by-question-demo.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add the basis scope label and contextual styling**

Keep the card below the answer, add `#basisScope` with default text “本题整体”, and apply a subtle highlighted state while a student is active.

- [ ] **Step 2: Add overall and student render helpers**

Generate student-specific items from answer text, current result, exam scoring semantics, and matching shape-group reason/basis. Keep the existing overall basis content unchanged.

- [ ] **Step 3: Bind mouse and keyboard context changes**

Add `data-student-card` to each response article. On mouseenter/focusin call `renderStudentBasis(studentId)`; on mouseleave/focusout call `renderOverallBasis(activeQuestion())`.

- [ ] **Step 4: Keep the current student context synchronized**

After an individual result cycle, re-render that student's basis. After full group renders or batch updates, restore the overall basis.

- [ ] **Step 5: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern="question grading swaps overall AI basis for student basis on hover" tests/collection-pages.test.cjs
node --test tests/*.test.cjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 6: Validate scripts and diff**

Parse every inline script with `new Function`, run `git diff --check`, and review the two implementation files before committing.
