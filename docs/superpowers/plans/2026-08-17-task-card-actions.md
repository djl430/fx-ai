# Task Card Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add grading, learning-insights, and review actions to every task card on the list page.

**Architecture:** Extend the existing `taskRow(task)` renderer with a dedicated action group. Reuse the current `open-task` handler for grading and add two non-navigating task-level feedback actions for routes that do not yet have pages.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in test runner.

---

### Task 1: Specify the task-card action contract

**Files:**
- Modify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Write a failing source-contract test**

Assert that `index.html` renders `task-actions` and buttons with `open-task`, `open-insights`, and `open-review` actions, each carrying `data-task-id`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern='task cards expose' tests/collection-pages.test.cjs`

Expected: FAIL because the task-card action group is not yet rendered.

### Task 2: Implement task-card actions

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add the action group styles**

Add `.task-actions` and `.task-action` styles, a primary grading variant, and responsive wrapping rules.

- [ ] **Step 2: Render the three task-level buttons**

Insert buttons labelled `批改`, `学情`, and `讲评` between `.task-main` and `.task-meta`; keep the existing task ID on every action.

- [ ] **Step 3: Add insights and review feedback handlers**

For `open-insights` and `open-review`, resolve the selected task, set a task-specific toast, render, and return. Leave `open-task` routing unchanged.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test --test-name-pattern='task cards expose' tests/collection-pages.test.cjs`

Expected: PASS.

### Task 3: Regression verification

**Files:**
- Verify: `index.html`
- Verify: `grading-by-question-demo.html`
- Verify: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Run page tests**

Run: `node --test tests/collection-pages.test.cjs`

Expected: all page tests pass.

- [ ] **Step 2: Run all tests and static checks**

Run: `node --test tests/*.test.cjs && git diff --check`

Expected: all tests pass and `git diff --check` exits successfully.

- [ ] **Step 3: Commit implementation**

Stage the two HTML files, regression tests, specification, and plan; commit with a feature-focused message.

