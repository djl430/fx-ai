# Student Grading Reference Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the supplied per-student grading interaction with roster-level confirmation and structured check/cross grading tools.

**Architecture:** Keep `questions[].students[]` as the single source of truth. Add derived part results for compound answers and consolidate task completion into a shared function used by both grading modes.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in test runner.

---

### Task 1: Specify the reference interaction

**Files:**
- Modify: `tests/collection-pages.test.cjs`

- [ ] Add a failing test that requires `confirmAllStudents`, `student-tool-page`, correct/wrong judge buttons, compound bulk actions, part rows, and shared completion handling.
- [ ] Run `node --test --test-name-pattern='student grading matches the reference interaction' tests/collection-pages.test.cjs` and confirm it fails because these controls do not exist.

### Task 2: Implement the roster and structured tool

**Files:**
- Modify: `grading-by-question-demo.html`

- [ ] Add a fixed roster footer with `#confirmAllStudents`.
- [ ] Replace the current four rectangular homework result buttons with circular correct/wrong judge controls.
- [ ] Add compound-question part derivation, per-part updates, and all-correct/all-wrong updates that synchronize `student.result`.
- [ ] Restyle the tool header, question rows, judge controls, answer copy, and sticky footer to match the reference density and hierarchy.
- [ ] Extract shared task-completion handling and bind it to both confirmation entry points.
- [ ] Run the focused test and confirm it passes.

### Task 3: Verify and commit

**Files:**
- Verify: `grading-by-question-demo.html`
- Verify: `tests/collection-pages.test.cjs`

- [ ] Validate inline script syntax.
- [ ] Run `node --test tests/*.test.cjs` and confirm all tests pass.
- [ ] Run `git diff --check`, inspect the focused diff, and commit the implementation.

