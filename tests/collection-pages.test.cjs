const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const confirmPage = fs.readFileSync('collection-confirm.html', 'utf8');
const indexPage = fs.readFileSync('index.html', 'utf8');
const historyPage = fs.readFileSync('collection-history.html', 'utf8');
const gradingPage = fs.readFileSync('grading-by-question-demo.html', 'utf8');

test('confirmation page exposes the required group controls', () => {
  assert.match(confirmPage, /data-action="add-sample"/);
  assert.match(confirmPage, /<div class="notice-actions">[\s\S]*data-action="add-sample"/);
  assert.doesNotMatch(confirmPage, /<div class="add-row">/);
  assert.match(confirmPage, /data-action="edit-sample-name"/);
  assert.match(confirmPage, /data-action="change-sample-kind"/);
  assert.match(confirmPage, /本次扫描识别到以下/);
});

test('collection confirmation contains a focused anomaly workflow without a home list entry', () => {
  assert.match(confirmPage, /发现 <strong id="anomalyCount">5<\/strong> 份异常提交/);
  assert.match(confirmPage, /<div class="notice-actions__right">[\s\S]*id="anomalySummary"/);
  assert.match(confirmPage, /data-action="open-anomaly-drawer"/);
  assert.match(confirmPage, /data-action="resolve-anomaly"/);
  assert.match(confirmPage, /data-action="continue-analysis"/);
  assert.match(confirmPage, /未处理异常不会自动归属，也不会进入批改/);
  assert.doesNotMatch(confirmPage, /anomaly-chip/);
  assert.doesNotMatch(confirmPage, /sample-risk/);
  assert.doesNotMatch(indexPage, /异常待处理/);
});

test('collection confirmation uses simplified analysis copy', () => {
  assert.match(confirmPage, /确认无误后 AI 开始分析/);
  assert.match(confirmPage, /<button class="confirm"[^>]*>确认无误并开始分析<\/button>/);
  assert.doesNotMatch(confirmPage, /\.scan-notice::before/);
  assert.doesNotMatch(confirmPage, /\.scan-notice \{[^}]*\b(?:border|background|box-shadow):/);
  assert.doesNotMatch(confirmPage, /确认并开始识别或批改/);
});

test('confirmation supports compact submission page selection', () => {
  assert.match(confirmPage, /data-action="open-submission-picker"/);
  assert.match(confirmPage, /data-action="add-selected-submissions"/);
  assert.match(confirmPage, /仅看未归属页面/);
  assert.match(confirmPage, /已添加至样卷/);
  assert.match(confirmPage, /min-height:\s*216px/);
  assert.match(confirmPage, /font-size:\s*clamp\(24px, 2\.4vw, 30px\)/);
});

test('sample pages wrap instead of scrolling horizontally', () => {
  assert.match(confirmPage, /\.pages\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.doesNotMatch(confirmPage, /\.pages\s*\{[^}]*overflow-x:\s*auto/s);
});

test('sample paper content uses stable printed page metadata', () => {
  assert.match(confirmPage, /sourcePageNumber/);
  assert.match(confirmPage, /paper-page-number/);
  assert.match(confirmPage, /paperTitle/);
  assert.doesNotMatch(confirmPage, /<h4>\$\{escapeHtml\(groupName\)\}\s*·\s*第/);
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

test('whole samples confirm deletion while single pages delete immediately', () => {
  assert.match(confirmPage, /data-action="request-delete-sample"/);
  assert.match(confirmPage, /data-action="confirm-delete-sample"/);
  assert.match(confirmPage, /data-action="request-delete-page"/);
  assert.match(confirmPage, /removeSampleGroup/);
  assert.match(confirmPage, /removeSamplePage/);
  assert.doesNotMatch(confirmPage, /pendingDelete\.type\s*===\s*['"]page['"]/);
  assert.doesNotMatch(confirmPage, /确认删除这一页/);
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

test('direct home entry resets only collection demo data', () => {
  assert.match(indexPage, /collectionCreated\s*=.*===\s*['"]1['"]/);
  assert.match(indexPage, /resetCollectionDemoState/);
  assert.match(indexPage, /removeItem\(['"]fxGeneratedCollectionTasks['"]\)/);
  assert.match(indexPage, /delete[\s\S]*today-1942/);
});

test('grading back link preserves newly created collection tasks', () => {
  assert.match(gradingPage, /href="\.\/index\.html\?preserveCollection=1"/);
  assert.match(indexPage, /preserveCollection/);
  assert.match(indexPage, /!collectionCreated\s*&&\s*!preserveCollection/);
});

test('main list always keeps the three original grading tasks visible', () => {
  for (const taskId of ['cluster-homework', 'similar-homework', 'quiz']) {
    assert.match(indexPage, new RegExp(`id:\\s*["']${taskId}["']`));
  }
  assert.doesNotMatch(indexPage, /tasks\.slice\(0,\s*7\)\.filter/);
});

test('grading task list does not expose deletion controls', () => {
  assert.doesNotMatch(indexPage, /data-action="request-delete-task"/);
  assert.doesNotMatch(indexPage, /data-action="confirm-delete-task"/);
  assert.doesNotMatch(indexPage, /task-row__delete/);
  assert.doesNotMatch(indexPage, /markTaskDeleted/);
});

test('history button is permanent and its pending badge is conditional', () => {
  assert.match(indexPage, />采集记录</);
  assert.doesNotMatch(indexPage, />历史采集任务</);
  assert.doesNotMatch(indexPage, /link\.innerHTML\s*=\s*`<span class="collection-history-entry__icon"/);
  assert.match(indexPage, /pendingHistoryCount/);
  assert.match(indexPage, /collection-history-entry__badge/);
  assert.match(indexPage, /pendingCount\s*>\s*0/);
  assert.match(indexPage, /today-1618['"],\s*confirmed:\s*true/);
  assert.match(indexPage, /批待确认/);
  assert.match(historyPage, /today-1618[^\n]*confirmed:true/);
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
  assert.match(indexPage, /AI分析中/);
  assert.doesNotMatch(indexPage, /AI识别中/);
  assert.match(indexPage, /task-recognition-progress/);
  assert.match(indexPage, /recognitionStartedAt/);
  assert.match(indexPage, /advanceRecognition/);
  assert.match(indexPage, /5000/);
  assert.match(indexPage, /requestAnimationFrame/);
});

test('generated task timers update the existing DOM without rerendering the page', () => {
  assert.match(indexPage, /function updateRecognitionTaskRow/);
  assert.match(indexPage, /class="task-updated"/);
  assert.match(indexPage, /toastNode\?\.remove\(\)/);
  assert.doesNotMatch(indexPage, /if \(completed\) \{[\s\S]*?render\(\);[\s\S]*?return;/);
});

test('all toast messages are positioned at the upper center of their page', () => {
  for (const page of [indexPage, historyPage, gradingPage]) {
    assert.match(page, /\.toast\s*\{[^}]*position:\s*fixed[^}]*left:\s*50%[^}]*top:\s*88px[^}]*translateX\(-50%\)/s);
  }
});

test('processing generated tasks are guarded and completed tasks open grading', () => {
  assert.match(indexPage, /task\.generated\s*&&\s*task\.status\s*===\s*["']AI分析中["']/);
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

test('grading completion is persisted by task id and reflected on the list', () => {
  assert.match(gradingPage, /params\.get\(["']taskId["']\)/);
  assert.match(gradingPage, /questions\.every\(.*status\s*===\s*["']completed["']/s);
  assert.match(gradingPage, /markTaskConfirmed/);
  assert.match(gradingPage, /fxTaskListState/);
  assert.match(indexPage, /applyTaskListState/);
  assert.match(indexPage, /已确认/);
});

test('grading starts pending, restores progress, and selects the first pending question', () => {
  assert.doesNotMatch(gradingPage, /status:\s*["']completed["']/);
  assert.match(gradingPage, /applyGradingProgress/);
  assert.match(gradingPage, /firstPendingQuestionId/);
  assert.match(gradingPage, /fxGradingProgress/);
  assert.match(gradingPage, /markQuestionCompleted/);
  assert.match(gradingPage, /localStorage\.setItem\(["']fxGradingProgress["']/);
  assert.match(gradingPage, /find\(\(question\)\s*=>\s*question\.status\s*!==\s*["']completed["']/);
});

test('exam grading supports both direct score input and card click cycling', () => {
  assert.match(gradingPage, /class="score-input"/);
  assert.match(gradingPage, /type="number"/);
  assert.match(gradingPage, /step="0\.5"/);
  assert.match(gradingPage, /data-score-input/);
  assert.match(gradingPage, /commitExamScore/);
  assert.match(gradingPage, /const nextScore = numericScore <= 0 \? max : Math\.max\(0, Math\.round\(\(numericScore - 0\.5\) \* 2\) \/ 2\);/);
  assert.match(gradingPage, /data-score-editor.*stopPropagation/s);
});
