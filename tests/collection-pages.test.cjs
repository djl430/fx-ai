const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const confirmPage = fs.readFileSync('collection-confirm.html', 'utf8');
const anomaliesPage = fs.existsSync('collection-anomalies.html') ? fs.readFileSync('collection-anomalies.html', 'utf8') : '';
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

test('sample confirmation persists a draft and opens the independent anomaly page', () => {
  assert.match(confirmPage, /collectionDraftKey\(task\)/);
  assert.match(confirmPage, /collection-anomalies\.html\?task=/);
  assert.doesNotMatch(confirmPage, /stage = 'anomalies'/);
});

test('independent page contains the full-document anomaly workflow without a home list entry', () => {
  assert.match(anomaliesPage, /anomaly-document-viewer/);
  assert.match(anomaliesPage, /data-action="select-anomaly-page"/);
  assert.match(anomaliesPage, /返回修改样卷/);
  assert.match(anomaliesPage, /data-action="resolve-anomaly"/);
  assert.match(anomaliesPage, /开始分析/);
  assert.match(anomaliesPage, /缺页/);
  assert.match(anomaliesPage, /未识别学生/);
  assert.doesNotMatch(anomaliesPage, /type:\s*'多页'/);
  assert.doesNotMatch(anomaliesPage, /重复提交/);
  assert.doesNotMatch(confirmPage, /data-stage="anomalies"/);
  assert.doesNotMatch(indexPage, /异常待处理/);
});

test('anomaly review is grouped by sample before student', () => {
  assert.match(anomaliesPage, /anomaly-sample-nav/);
  assert.match(anomaliesPage, /data-action="select-anomaly-sample"/);
  assert.match(anomaliesPage, /未识别学生/);
  assert.doesNotMatch(anomaliesPage, /type:\s*'多页'/);
});

test('anomaly sample navigation is horizontal above the workspace', () => {
  assert.match(anomaliesPage, /\.anomaly-sample-nav\s*\{[^}]*display:\s*flex/s);
  assert.match(anomaliesPage, /<nav class="anomaly-sample-nav"[\s\S]*?<div class="anomaly-workspace /);
  assert.doesNotMatch(anomaliesPage, /anomaly-student-rail">[\s\S]*?anomaly-sample-nav/);
});

test('unrecognized pages use a direct grouped student selector without search', () => {
  assert.match(anomaliesPage, /优先推荐/);
  assert.match(anomaliesPage, /全部学生/);
  assert.doesNotMatch(anomaliesPage, /type="search"/);
  assert.match(anomaliesPage, /data-action="select-owner-student"/);
  assert.match(anomaliesPage, /确认归属给/);
  assert.match(confirmPage, /makeStudentPreviewPages\('identity-wang-1',[^\n]+\[paperTemplates\.homework\[1\]\]\)/);
  assert.doesNotMatch(confirmPage, /unrecognizedPageCount/);
});

test('all students are collapsed by default', () => {
  assert.match(anomaliesPage, /<details class="owner-group owner-all-students">/);
  assert.match(anomaliesPage, /<summary>全部学生<\/summary>/);
  assert.doesNotMatch(anomaliesPage, /<details class="owner-group owner-all-students" open>/);
});

test('missing pages only show rescan guidance and do not block analysis', () => {
  assert.match(anomaliesPage, /请重新扫描缺失页面/);
  assert.doesNotMatch(anomaliesPage, /确认缺页并继续/);
  assert.match(anomaliesPage, /blockingCollectionAnomalies/);
});

test('anomaly preview removes the document header and right-aligns missing guidance', () => {
  assert.doesNotMatch(anomaliesPage, /class="anomaly-viewer-head"/);
  assert.match(anomaliesPage, /missing-rescan-inline[^}]*margin-left:\s*auto/s);
  assert.match(anomaliesPage, /selected\.type === '缺页' \? '' : renderDecision\(selected\)/);
});

test('ownership assignment toasts, persists, updates the rail and advances', () => {
  assert.match(anomaliesPage, /已归属给 \${escapeHtml\(choice\)}/);
  assert.match(anomaliesPage, /localStorage\.setItem\(draftKey/);
  assert.match(anomaliesPage, /nextBlockingAnomaly/);
  assert.match(anomaliesPage, /anomaly\.choice \|\| '未识别学生'/);
  assert.doesNotMatch(anomaliesPage, /class="anomaly-type"/);
  assert.doesNotMatch(anomaliesPage, /<h3>未识别<\/h3>/);
});

test('independent anomaly page creates the batch only after ownership blockers clear', () => {
  assert.match(anomaliesPage, /blockingCollectionAnomalies\(anomalies\)/);
  assert.match(anomaliesPage, /fxConfirmedCollectionBatch/);
  assert.match(anomaliesPage, /confirmHistoryRecord/);
  assert.match(anomaliesPage, /localStorage\.removeItem\(draftKey\)/);
  assert.match(anomaliesPage, /index\.html\?collectionCreated=1/);
});

test('returning from anomaly review restores the task-scoped sample draft', () => {
  assert.match(anomaliesPage, /collection-confirm\.html\?task=\${encodeURIComponent\(task\)}&resumeCollection=1/);
  assert.match(confirmPage, /params\.get\('resumeCollection'\) === '1'/);
  assert.match(confirmPage, /normalizeCollectionDraft/);
});

test('editable sample confirmation hides the top anomaly summary', () => {
  assert.match(confirmPage, /if \(!readOnly \|\| !anomalies\.length \|\| stage === 'anomalies'\)/);
});

test('collection confirmation uses simplified analysis copy', () => {
  assert.match(confirmPage, /确认无误后 AI 开始分析/);
  assert.match(confirmPage, /确认无误并开始分析/);
  assert.doesNotMatch(confirmPage, /确认样卷，处理/);
  assert.match(confirmPage, /confirmButton\.textContent = '确认无误并开始分析'/);
  assert.doesNotMatch(confirmPage, /\.scan-notice::before/);
  assert.doesNotMatch(confirmPage, /\.scan-notice \{[^}]*\b(?:border|background|box-shadow):/);
  assert.doesNotMatch(confirmPage, /确认并开始识别或批改/);
});

test('history demo contains two pending tasks with different anomaly conditions', () => {
  assert.match(historyPage, /id:'today-2026'[\s\S]*?anomalyCount:0/);
  assert.match(historyPage, /id:'today-1942'[\s\S]*?anomalyCount:4/);
  assert.match(indexPage, /today-2026/);
  assert.match(indexPage, /today-1942/);
});

test('confirmation supports compact submission page selection', () => {
  assert.match(confirmPage, /data-action="open-submission-picker"/);
  assert.match(confirmPage, /data-action="add-selected-submissions"/);
  assert.match(confirmPage, /仅看未归属页面/);
  assert.match(confirmPage, /已添加至样卷/);
  assert.match(confirmPage, /min-height:\s*216px/);
  assert.match(confirmPage, /font-size:\s*clamp\(24px, 2\.4vw, 30px\)/);
});

test('submission picker entry follows the final page in each sample', () => {
  assert.match(confirmPage, /class="submission-picker-trigger submission-picker-card"/);
  assert.match(confirmPage, /group\.pages\.map\([\s\S]*?\.join\(''\)[\s\S]*?submission-picker-card/);
  assert.doesNotMatch(confirmPage, /<div class="sample-head">[\s\S]*?submission-picker-trigger[\s\S]*?<\/div>\s*<div class="pages"/);
});

test('sample headers expose clickable anomaly type labels', () => {
  assert.match(confirmPage, /sample-anomaly-tags/);
  assert.match(confirmPage, /data-action="open-sample-anomaly"/);
  assert.match(confirmPage, /缺页[^<]*人/);
  assert.match(confirmPage, /未识别[^<]*页/);
  assert.match(confirmPage, /data-anomaly-type="未识别学生"/);
});

test('sample anomaly labels deep-link to the selected anomaly student', () => {
  assert.match(confirmPage, /openIndependentAnomalyPage\(targetAnomaly\.id\)/);
  assert.match(confirmPage, /focus=\$\{encodeURIComponent\(anomalyId\)\}/);
  assert.match(anomaliesPage, /const focusedAnomalyId = params\.get\('focus'\) \|\| ''/);
  assert.match(anomaliesPage, /const focusedAnomaly = anomalies\.find\(\(anomaly\) => anomaly\.id === focusedAnomalyId\)/);
  assert.match(anomaliesPage, /let selectedGroupId = focusedAnomaly\?\.groupId \|\| initialGroup\?\.groupId \|\| ''/);
  assert.match(anomaliesPage, /let selectedAnomalyId = focusedAnomaly\?\.id \|\|/);
});

test('sample pages wrap instead of scrolling horizontally', () => {
  assert.match(confirmPage, /\.pages\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.doesNotMatch(confirmPage, /\.pages\s*\{[^}]*overflow-x:\s*auto/s);
});

test('drag guidance appears once above the sample list', () => {
  assert.equal((confirmPage.match(/拖动页面调整顺序或归属/g) || []).length, 1);
  assert.match(confirmPage, /id="sampleDragHint"[^>]*>拖动页面调整顺序或归属<\/p>[\s\S]*<div class="sample-list"/);
  assert.doesNotMatch(confirmPage, /<span class="hint">[^<]*拖动页面调整顺序或归属/);
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
  for (const page of [indexPage, historyPage, gradingPage, anomaliesPage]) {
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
  assert.match(gradingPage, /groupsScroll\.scrollTop \+ groupsScroll\.clientHeight >= groupsScroll\.scrollHeight - 2/);
});
