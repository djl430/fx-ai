# Collection Task Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist collection confirmation state, expose confirmed scans as read-only history, animate generated-task recognition for five seconds, and open completed generated tasks in the existing grading demo.

**Architecture:** Extend `collection-flow.js` with pure helpers for history records, snapshots, recognition progress, and generated-task completion. Each HTML page reads the same versioned localStorage records and renders its own view. Generated tasks keep their metadata and open `grading-by-question-demo.html`, which uses query parameters to replace the demo title while preserving the existing grading interactions.

**Tech Stack:** HTML, CSS, vanilla JavaScript, browser `localStorage`, Node.js built-in test runner.

---

### Task 1: Lifecycle Model

**Files:**
- Modify: `collection-flow.js`
- Modify: `tests/collection-flow.test.cjs`

- [ ] Add failing tests for `recognitionProgress(task, now, 5000)`, confirming history records, counting pending history items, and converting completed generated tasks to `待确认`.
- [ ] Run `node --test tests/collection-flow.test.cjs` and verify failures identify missing helpers.
- [ ] Implement the minimal pure helpers and add `recognitionStartedAt`, `sourceTaskId`, and `generated: true` to `buildTasks()` output.
- [ ] Run the model tests and verify all pass.

### Task 2: Confirmation Snapshot and Read-only Mode

**Files:**
- Modify: `collection-confirm.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] Add failing page contracts for `mode=view`, `fxCollectionHistoryState`, disabled fields, non-draggable pages, hidden add/confirm controls, and saved snapshot loading.
- [ ] Run page tests and verify the new contracts fail.
- [ ] On confirmation, persist a versioned record keyed by `sourceTaskId` with `status: 已确认`, `confirmedAt`, title/class metadata, and the final non-empty groups.
- [ ] In `mode=view`, load the saved snapshot, mark the body read-only, disable selects and inputs, render pages without drag support, and hide add/confirm controls.
- [ ] Run all tests.

### Task 3: Dynamic History List and Main Reminder

**Files:**
- Modify: `collection-history.html`
- Modify: `index.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] Add failing contracts for dynamic history rendering, `已确认 / 查看`, a permanent history button, a separate pending badge, and badge suppression at zero.
- [ ] Run page tests and verify failures.
- [ ] Replace hard-coded history task states with a seed array merged with `fxCollectionHistoryState`; confirmed items link to `collection-confirm.html?task=<id>&mode=view`, pending items link to edit mode.
- [ ] Render the main fixed button with static “历史采集任务” text and a badge created only when pending count is greater than zero.
- [ ] Run all tests.

### Task 4: Five-second Recognition Demo

**Files:**
- Modify: `index.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] Add failing contracts for a task progress bar, `recognitionStartedAt`, 5000 ms duration, persistence on completion, and processing-click guard.
- [ ] Run page tests and verify failures.
- [ ] Render progress markup only for generated tasks in `AI识别中`; update widths and percentages on an animation timer using stored start time.
- [ ] At 100%, persist `status/listTag: 待确认` and `progress: 100`, rerender once, and stop the timer. Reloads calculate from the original start time.
- [ ] While processing, clicking shows a list toast; after completion, clicking opens the grading demo with encoded task metadata.
- [ ] Run all tests.

### Task 5: Reuse Existing Grading Interaction

**Files:**
- Modify: `grading-by-question-demo.html`
- Modify: `tests/collection-pages.test.cjs`

- [ ] Add failing contracts for `taskTitle`, `taskKind`, `className`, `students`, and `pages` query parameters and visible metadata rendering.
- [ ] Run page tests and verify failures.
- [ ] Add a title/meta block in the existing topbar and fill it from sanitized query parameters; leave question grouping and grading handlers unchanged.
- [ ] Run all tests.

### Task 6: Browser and Final Verification

**Files:**
- Verify: `collection-confirm.html`
- Verify: `collection-history.html`
- Verify: `index.html`
- Verify: `grading-by-question-demo.html`

- [ ] Run `node --check collection-flow.js`, parse every inline script, run `node --test tests/*.test.cjs`, and run `git diff --check`.
- [ ] In a local browser, confirm one historical task, verify the history row becomes read-only `已确认 / 查看`, and verify the main badge count decreases.
- [ ] Verify generated task progress advances for five seconds, reload continues from the original start time, completion changes to `待确认`, and clicking opens the existing grading interaction with current task metadata.
- [ ] Confirm all-history-complete state keeps the fixed button and removes only the badge.
