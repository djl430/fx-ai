# Question Stem Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a current-question stem image above the answer card and open the same image in a larger preview dialog.

**Architecture:** Add static thumbnail and modal markup to the existing single-file grading page. A small SVG image generator converts the active question's stem metadata into an image data URL; `renderAssistant()` keeps the thumbnail, modal image, labels, and title synchronized.

**Tech Stack:** HTML, CSS, vanilla JavaScript, inline SVG data URLs, Node.js built-in test runner

---

### Task 1: Specify the screenshot preview contract

**Files:**
- Modify: `tests/collection-pages.test.cjs`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add a focused source contract test**

Require `#questionSnapshotThumbnail`, `#questionSnapshotModal`, `#questionSnapshotPreview`, the `questionSnapshotDataUrl()` generator, synchronization in `renderAssistant()`, modal registration, and accessible button text.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="question grading shows a clickable stem snapshot above the answer" tests/collection-pages.test.cjs`

Expected: FAIL because the screenshot card and modal do not exist.

### Task 2: Implement dynamic screenshots and image preview

**Files:**
- Modify: `grading-by-question-demo.html`
- Test: `tests/collection-pages.test.cjs`

- [ ] **Step 1: Add the thumbnail card and preview modal markup**

Place a button containing `#questionSnapshotThumbnail` immediately before `.answer-card`, and add a dedicated image modal with `#questionSnapshotPreview` after the existing modal markup.

- [ ] **Step 2: Add compact paper-snapshot styling**

Style the card, 16:9 thumbnail crop, hover/focus zoom affordance, and large responsive preview image while preserving the existing blue-gray visual language.

- [ ] **Step 3: Add the SVG data URL generator**

Implement XML escaping, safe line wrapping, first-homework stem copy, fallback copy, and `questionSnapshotDataUrl(question)` without external dependencies.

- [ ] **Step 4: Synchronize and bind the preview**

Update both images, alt text, button label, and modal title in `renderAssistant()`. Register `questionSnapshotModal` in the existing modal map so close button, backdrop click, and Esc work without duplicate event code.

- [ ] **Step 5: Run focused and complete verification**

Run:

```bash
node --test --test-name-pattern="question grading shows a clickable stem snapshot above the answer" tests/collection-pages.test.cjs
node --test tests/*.test.cjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 6: Validate scripts and diff**

Parse all inline scripts with `new Function`, run `git diff --check`, and review the changed page and test file before committing.
