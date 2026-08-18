# Grading Result Top Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the question-grading result rail with a horizontal top navigation that scrolls to and tracks the four result groups.

**Architecture:** Keep the navigation inside the existing `.answer-toolbar` so it remains visible while `.groups-scroll` scrolls independently. Reuse the existing `data-result-target` contract and scroll calculations, but rename the controller and visual classes to match the top-navigation role.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner

---

### Task 1: Specify the top navigation contract

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Replace the rail assertions with top-navigation assertions**

Require `#resultNavigation` inside `.answer-toolbar`, four labeled `data-result-target` buttons, active-state synchronization, smooth scrolling, and absence of `.result-rail` markup and CSS.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test --test-name-pattern="grading page exposes a four-state top result navigation|grading result navigation replaces the side rail" tests/collection-pages.test.cjs`

Expected: FAIL because the page still contains `#resultRail` and `.result-rail`.

### Task 2: Implement and verify the top navigation

**Files:**
- Modify: `grading-by-question-demo.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Move the four controls into `.answer-toolbar`**

Add a `#resultNavigation` navigation before the density control, with buttons labeled 正确、半对、错误、未批改 and the existing result values.

- [ ] **Step 2: Replace rail styling with compact horizontal navigation styling**

Use a four-column layout, result-specific active colors, an active underline, hover/focus states, and balanced toolbar spacing. Restore `.groups-scroll` to symmetric horizontal padding.

- [ ] **Step 3: Rename and reuse the interaction controller**

Rename `resultRail` and its helper functions to `resultNavigation`, preserve smooth container scrolling, scroll-position synchronization, bottom detection, and `aria-current` updates.

- [ ] **Step 4: Run focused and complete verification**

Run:

```bash
node --test --test-name-pattern="grading page exposes a four-state top result navigation|grading result navigation replaces the side rail" tests/collection-pages.test.cjs
node --test tests/*.test.cjs
```

Expected: all selected and complete tests pass with zero failures.

- [ ] **Step 5: Validate the HTML scripts and diff**

Parse every inline script with `new Function`, run `git diff --check`, and review `git diff -- grading-by-question-demo.html tests/collection-pages.test.cjs`.
