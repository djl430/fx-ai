const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const confirmPage = fs.readFileSync('collection-confirm.html', 'utf8');
const indexPage = fs.readFileSync('index.html', 'utf8');
const historyPage = fs.readFileSync('collection-history.html', 'utf8');
const gradingPage = fs.readFileSync('grading-by-question-demo.html', 'utf8');

test('confirmation page exposes the required group controls', () => {
  assert.match(confirmPage, /data-action="add-sample"/);
  assert.match(confirmPage, /data-action="edit-sample-name"/);
  assert.match(confirmPage, /data-action="change-sample-kind"/);
  assert.match(confirmPage, /本次扫描识别到以下/);
});

test('sample pages wrap instead of scrolling horizontally', () => {
  assert.match(confirmPage, /\.pages\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.doesNotMatch(confirmPage, /\.pages\s*\{[^}]*overflow-x:\s*auto/s);
});

test('confirmation serializes through the shared collection flow', () => {
  assert.match(confirmPage, /FxCollectionFlow\.validGroups\(groups\)/);
  assert.match(confirmPage, /fxConfirmedCollectionBatch/);
});

test('confirmation goes directly to the main list', () => {
  assert.match(confirmPage, /location\.href\s*=\s*['"]index\.html\?collectionCreated=1['"]/);
});

test('empty sample groups do not block non-empty groups', () => {
  assert.match(confirmPage, /空样卷不会创建任务/);
  assert.match(confirmPage, /validGroups\.length\s*===\s*0/);
});

test('confirmation persists history state and supports read-only snapshot mode', () => {
  assert.match(confirmPage, /fxCollectionHistoryState/);
  assert.match(confirmPage, /mode['"]?\)\s*===\s*['"]view['"]/);
  assert.match(confirmPage, /confirmHistoryRecord/);
  assert.match(confirmPage, /readOnly/);
  assert.match(confirmPage, /disabled/);
});

test('all collection confirmation views hide the highlighted acquisition details', () => {
  assert.match(confirmPage, /(?:^|\n)\s*\.page-head\s+\.eyebrow\s*,/);
  assert.match(confirmPage, /(?:^|\n)\s*\.sample-meta\s*,/);
  assert.match(confirmPage, /(?:^|\n)\s*\.scan-mark\s*\{\s*display:\s*none/);
});

test('editable collection pages can delete a sample or page with confirmation', () => {
  assert.match(confirmPage, /data-action="request-delete-sample"/);
  assert.match(confirmPage, /data-action="request-delete-page"/);
  assert.match(confirmPage, /data-action="confirm-delete-collection-item"/);
  assert.match(confirmPage, /removeSampleGroup/);
  assert.match(confirmPage, /removeSamplePage/);
  assert.match(confirmPage, /readOnly\s*\?\s*['"]['"]/);
});

test('main list loads and persists confirmed collection tasks', () => {
  assert.match(indexPage, /fxConfirmedCollectionBatch/);
  assert.match(indexPage, /fxGeneratedCollectionTasks/);
  assert.match(indexPage, /FxCollectionFlow\.buildTasks/);
  assert.match(indexPage, /FxCollectionFlow\.mergeTasks/);
});

test('main list stays on the home view after collection creation', () => {
  assert.match(indexPage, /collectionCreated/);
  assert.doesNotMatch(indexPage, /location\.href\s*=\s*['"]grading-by-question-demo\.html/);
});

test('main list always keeps the three original grading tasks visible', () => {
  for (const taskId of ['cluster-homework', 'similar-homework', 'quiz']) {
    assert.match(indexPage, new RegExp(`id:\\s*["']${taskId}["']`));
  }
  assert.doesNotMatch(indexPage, /tasks\.slice\(0,\s*7\)\.filter/);
});

test('all grading tasks expose persistent confirmed deletion', () => {
  assert.match(indexPage, /data-action="request-delete-task"/);
  assert.match(indexPage, /data-action="confirm-delete-task"/);
  assert.match(indexPage, /role="dialog"/);
  assert.match(indexPage, /fxTaskListState/);
  assert.match(indexPage, /markTaskDeleted/);
  assert.match(indexPage, /fxGeneratedCollectionTasks/);
});

test('history button is permanent and its pending badge is conditional', () => {
  assert.match(indexPage, />历史采集任务</);
  assert.match(indexPage, /pendingHistoryCount/);
  assert.match(indexPage, /collection-history-entry__badge/);
  assert.match(indexPage, /pendingCount\s*>\s*0/);
});

test('history page does not auto-redirect after confirmation', () => {
  assert.doesNotMatch(historyPage, /location\.href\s*=\s*['"]index\.html['"]/);
  assert.doesNotMatch(historyPage, /fxCollectionProcessing/);
  assert.doesNotMatch(historyPage, /fxCollectionConfirmedTask/);
});

test('history page renders pending and confirmed actions dynamically', () => {
  assert.match(historyPage, /fxCollectionHistoryState/);
  assert.match(historyPage, /已确认/);
  assert.match(historyPage, /mode=view/);
  assert.match(historyPage, /data-action="open-history-task"/);
  assert.match(historyPage, /collection-confirm\.html\?task=/);
});

test('generated tasks render a five-second recognition progress bar', () => {
  assert.match(indexPage, /task-recognition-progress/);
  assert.match(indexPage, /recognitionStartedAt/);
  assert.match(indexPage, /advanceRecognition/);
  assert.match(indexPage, /5000/);
  assert.match(indexPage, /requestAnimationFrame/);
});

test('processing generated tasks are guarded and completed tasks open grading', () => {
  assert.match(indexPage, /task\.generated\s*&&\s*task\.status\s*===\s*["']AI识别中["']/);
  assert.match(indexPage, /grading-by-question-demo\.html/);
  assert.match(indexPage, /taskTitle/);
  assert.match(indexPage, /className/);
});

test('generated homework and exams select grading mode from task kind', () => {
  assert.match(indexPage, /mode:\s*task\.kind\s*===\s*["']考试["']\s*\?\s*["']exam["']\s*:\s*["']homework["']/);
  assert.match(indexPage, /taskId:\s*task\.id/);
});

test('grading demo renders generated task metadata from query parameters', () => {
  for (const key of ['taskTitle', 'taskKind', 'className', 'students', 'pages']) {
    assert.match(gradingPage, new RegExp(`params\\.get\\(["']${key}["']\\)`));
  }
  assert.match(gradingPage, /gradingTaskTitle/);
  assert.match(gradingPage, /gradingTaskMeta/);
});
