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

test('grading demo renders generated task title and class context from query parameters', () => {
  for (const key of ['taskTitle', 'className']) {
    assert.match(gradingPage, new RegExp(`params\\.get\\(["']${key}["']\\)`));
  }
  assert.match(gradingPage, /gradingTaskTitle/);
});

test('list and grading pages resolve original task names from the shared catalog', () => {
  assert.match(indexPage, /FxCollectionFlow\.gradingTaskContext\("cluster-homework"\)/);
  assert.match(indexPage, /FxCollectionFlow\.gradingTaskContext\("similar-homework"\)/);
  assert.match(indexPage, /FxCollectionFlow\.gradingTaskContext\("quiz"\)/);
  assert.match(gradingPage, /FxCollectionFlow\.gradingTaskContext\(taskId\)/);
  assert.match(gradingPage, /params\.get\("taskTitle"\) \|\| taskContext\.title/);
});

test('grading header hides the task metadata line', () => {
  assert.doesNotMatch(gradingPage, /id="gradingTaskMeta"/);
  assert.doesNotMatch(gradingPage, /getElementById\("gradingTaskMeta"\)/);
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

test('question grading shows a clickable stem snapshot above the answer', () => {
  assert.match(gradingPage, /<section class="assist-card question-snapshot-card">[\s\S]*?data-modal="questionSnapshot"[\s\S]*?id="questionSnapshotThumbnail"[\s\S]*?<section class="assist-card answer-card">/);
  assert.match(gradingPage, /id="questionSnapshotModal"[^>]*aria-hidden="true"/);
  assert.match(gradingPage, /id="questionSnapshotPreview"/);
  assert.match(gradingPage, /function questionSnapshotDataUrl\(question\)/);
  assert.match(gradingPage, /data:image\/svg\+xml/);
  assert.match(gradingPage, /questionSnapshotThumbnail\.src = snapshotUrl/);
  assert.match(gradingPage, /questionSnapshotPreview\.src = snapshotUrl/);
  assert.match(gradingPage, /questionSnapshotButton\.setAttribute\("aria-label", `放大查看第 \$\{question\.id\} 题题干截图`\)/);
  assert.match(gradingPage, /questionSnapshot:\s*document\.getElementById\("questionSnapshotModal"\)/);
  assert.match(gradingPage, /二次函数 y = 2x² − 4x \+ 1 的图像开口方向/);
});

test('question snapshot card removes redundant zoom copy', () => {
  assert.match(gradingPage, /<section class="assist-card question-snapshot-card">[\s\S]*?<div class="assist-label">题干<\/div>[\s\S]*?id="questionSnapshotThumbnail"/);
  assert.doesNotMatch(gradingPage, />点击放大<\/span>/);
  assert.doesNotMatch(gradingPage, />查看大图<\/span>/);
});

test('question grading swaps overall AI basis for student basis on hover', () => {
  assert.match(gradingPage, /id="basisScope">本题整体<\/span>/);
  assert.match(gradingPage, /function renderOverallBasis\(question\)/);
  assert.match(gradingPage, /function renderStudentBasis\(studentId\)/);
  assert.match(gradingPage, /data-student-card="\$\{student\.id\}"/);
  assert.match(gradingPage, /card\.addEventListener\("mouseenter", \(\) => renderStudentBasis\(card\.dataset\.studentCard\)\)/);
  assert.match(gradingPage, /card\.addEventListener\("mouseleave", \(\) => renderOverallBasis\(activeQuestion\(\)\)\)/);
  assert.match(gradingPage, /card\.addEventListener\("focusin", \(\) => renderStudentBasis\(card\.dataset\.studentCard\)\)/);
  assert.match(gradingPage, /card\.addEventListener\("focusout"/);
  assert.match(gradingPage, /basisCard\.classList\.toggle\("is-individual", individual\)/);
  assert.match(gradingPage, /renderStudentBasis\(studentId\);/);
});

test('grading page exposes a four-state top result navigation', () => {
  assert.match(gradingPage, /<div class="answer-toolbar">[\s\S]*?<nav class="result-navigation" id="resultNavigation"[\s\S]*?<div class="density-control"/);
  const labels = { correct: '正确', partial: '半对', wrong: '错误', ungraded: '未批改' };
  for (const [result, label] of Object.entries(labels)) {
    assert.match(gradingPage, new RegExp(`class="result-navigation__button[^\"]*"[^>]*data-result-target="${result}"[^>]*>${label}<`));
  }
  assert.match(gradingPage, /scrollTo\(\{[\s\S]*behavior:\s*"smooth"/);
  assert.match(gradingPage, /groupsScroll\.addEventListener\("scroll"/);
  assert.match(gradingPage, /function setActiveResultNavigation/);
  assert.match(gradingPage, /function syncResultNavigation/);
  assert.match(gradingPage, /aria-current/);
  assert.match(gradingPage, /groupsScroll\.scrollTop \+ groupsScroll\.clientHeight >= groupsScroll\.scrollHeight - 2/);
});

test('grading page switches between synchronized question and student dropdowns', () => {
  assert.doesNotMatch(gradingPage, /student-trace-preview\.html/);
  assert.match(gradingPage, /data-grading-view-dropdown/);
  assert.match(gradingPage, /data-grading-view-trigger/);
  assert.match(gradingPage, /data-grading-view-option="question"[^>]*>按题批改<\/button>/);
  assert.match(gradingPage, /data-grading-view-option="student"[^>]*>按学生批改<\/button>/);
  assert.doesNotMatch(gradingPage, /data-grading-view="question"/);
  assert.match(gradingPage, /id="questionWorkspace"/);
  assert.match(gradingPage, /id="studentWorkspace"[^>]*hidden/);
  assert.match(gradingPage, /\.workspace\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(gradingPage, /function setGradingView/);
  assert.match(gradingPage, /function syncGradingViewDropdowns\(\)/);
  assert.match(gradingPage, /trigger\.setAttribute\("aria-expanded", "false"\)/);
  assert.match(gradingPage, /option\.classList\.toggle\("is-selected", selected\)/);
  assert.match(gradingPage, /setGradingView\(option\.dataset\.gradingViewOption\)/);
  assert.match(gradingPage, /student\.result = result/);
  assert.match(gradingPage, /renderAll\(\)/);
});

test('grading mode dropdowns live above both question and student navigation lists', () => {
  assert.doesNotMatch(gradingPage, /<div class="top-actions">/);
  assert.equal((gradingPage.match(/class="grading-mode-dropdown" data-grading-view-dropdown/g) || []).length, 2);
  assert.match(gradingPage, /<aside class="rail"[^>]*>\s*<div class="grading-mode-dock">[\s\S]*?data-grading-view-trigger[\s\S]*?<nav class="question-list"/);
  assert.match(gradingPage, /<aside class="student-roster">\s*<div class="grading-mode-dock">[\s\S]*?data-grading-view-trigger[\s\S]*?<nav class="student-list"/);
  assert.match(gradingPage, /\.grading-mode-dropdown\s*\{[^}]*position:\s*relative/s);
  assert.match(gradingPage, /\.grading-mode-menu\s*\{[^}]*position:\s*absolute[^}]*box-shadow:/s);
  assert.match(gradingPage, /\.grading-mode-option\.is-selected\s*\{[^}]*background:\s*#eef5ff/s);
  assert.match(gradingPage, /event\.key === "Escape"[\s\S]*closeGradingViewDropdowns/s);
});

test('student grading mode provides a roster, centered paper, and structured tools', () => {
  assert.match(gradingPage, /id="studentList"/);
  assert.match(gradingPage, /id="studentPageStack"/);
  assert.match(gradingPage, /class="student-paper"/);
  assert.match(gradingPage, /class="student-question-tools"/);
  assert.match(gradingPage, /id="confirmStudent"/);
  assert.match(gradingPage, /data-student-result/);
  assert.match(gradingPage, /data-student-score/);
  assert.match(gradingPage, /function renderStudentWorkspace/);
});

test('third assignment defines a dedicated four-type exam paper', () => {
  assert.match(gradingPage, /if \(isExam && taskId === "quiz"\)/);
  assert.match(gradingPage, /title: "函数值判断"[\s\S]*type: "选择题/);
  assert.match(gradingPage, /title: "正比例函数判断"[\s\S]*type: "判断题/);
  assert.match(gradingPage, /title: "待定系数"[\s\S]*type: "填空题/);
  assert.match(gradingPage, /title: "一次函数应用"[\s\S]*type: "解答题/);
  assert.match(gradingPage, /function maxScore\(question\) \{[\s\S]*question\.maxScore/s);
  assert.match(gradingPage, /const size = isExam \? 2 : 3/);
});

test('exam student scoring uses judgments for objective questions and scores for subjective questions', () => {
  assert.match(gradingPage, /function isObjectiveQuestion\(question\)/);
  assert.match(gradingPage, /question\.type\.startsWith\("选择题"\)/);
  assert.match(gradingPage, /question\.type\.startsWith\("判断题"\)/);
  assert.match(gradingPage, /if \(isObjectiveQuestion\(question\)\)/);
  assert.match(gradingPage, /class="student-exam-judge-button[^\n]*data-student-result="correct"/);
  assert.match(gradingPage, /class="student-exam-judge-button[^\n]*data-student-result="wrong"/);
  assert.match(gradingPage, />对<\/span>/);
  assert.match(gradingPage, />错<\/span>/);
  assert.match(gradingPage, /class="student-exam-score-summary"/);
  assert.match(gradingPage, /class="student-subjective-score"[\s\S]*data-student-score/s);
});

test('exam student paper does not format an already formatted score twice', () => {
  assert.doesNotMatch(gradingPage, /formatScore\(studentScore\(/);
  assert.match(gradingPage, /class="student-paper-score">\$\{studentScore\(student, question\)\}/);
});

test('exam student workspace uses scoring labels and total points', () => {
  assert.match(gradingPage, /function studentExamTotal\(name\)/);
  assert.match(gradingPage, /isExam \? `\$\{studentExamTotal\(name\)\} 分` : `\$\{studentAccuracy\(name\)\}%`/);
  assert.match(gradingPage, /document\.querySelectorAll\('\[data-grading-view-option="question"\]'\)\.forEach[\s\S]*option\.textContent = isExam \? "按题赋分" : "按题批改"/s);
  assert.match(gradingPage, /document\.querySelectorAll\('\[data-grading-view-option="student"\]'\)\.forEach[\s\S]*option\.textContent = isExam \? "按学生赋分" : "按学生批改"/s);
  assert.match(gradingPage, /confirmStudent\.textContent = studentCompletion\.has\(activeStudentName\)[\s\S]*确认本学生赋分/s);
  assert.match(gradingPage, /confirmAllStudents\.textContent = studentCompletion\.size === studentNames\.length[\s\S]*一键确认赋分/s);
});

test('student roster omits the summary header', () => {
  assert.doesNotMatch(gradingPage, /class="student-roster__head"/);
  assert.doesNotMatch(gradingPage, /id="studentProgress"/);
  assert.doesNotMatch(gradingPage, /const studentProgress =/);
  assert.match(gradingPage, /\.student-roster\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,1fr\) auto/s);
  assert.match(gradingPage, /\.student-list\s*\{[^}]*padding:\s*12px 10px 16px/s);
});

test('student accuracy reuses the question grading color thresholds', () => {
  assert.match(gradingPage, /function accuracyClass\(accuracy\)/);
  assert.match(gradingPage, /if \(accuracy >= 80\) return "is-high"/);
  assert.match(gradingPage, /if \(accuracy >= 60\) return "is-mid"/);
  assert.match(gradingPage, /return "is-low"/);
  assert.match(gradingPage, /return accuracyClass\(question\.accuracy\)/);
  assert.match(gradingPage, /class="\$\{isExam \? "is-score" : accuracyClass\(studentAccuracy\(name\)\)\}"/);
  assert.match(gradingPage, /\.student-list-item b\.is-high\s*\{\s*color:\s*var\(--green\)/);
  assert.match(gradingPage, /\.student-list-item b\.is-mid\s*\{\s*color:\s*var\(--amber\)/);
  assert.match(gradingPage, /\.student-list-item b\.is-low\s*\{\s*color:\s*var\(--red\)/);
});

test('student grading pairs every paper page with its tools in one scroll stack', () => {
  assert.match(gradingPage, /id="studentPageStack"/);
  assert.match(gradingPage, /class="student-page-row"/);
  assert.match(gradingPage, /function studentPages/);
  assert.match(gradingPage, /function renderStudentPages/);
  assert.match(gradingPage, /data-student-page/);
  assert.match(gradingPage, /studentPageStack\.addEventListener\("click"/);
});

test('student confirmation lives in the overall review footer', () => {
  assert.match(gradingPage, /class="student-review-footer"[\s\S]*id="confirmStudent"/);
  assert.doesNotMatch(gradingPage, /class="student-tool-footer"/);
  assert.match(gradingPage, /\.student-review\s*\{[^}]*grid-template-rows:\s*minmax\(0,1fr\) auto/s);
});

test('student grading matches the reference interaction', () => {
  assert.match(gradingPage, /id="confirmAllStudents"[^>]*>一键确认批改</);
  assert.match(gradingPage, /class="student-tool-page">\$\{index \+ 1\}\/\$\{pages\.length\}</);
  assert.match(gradingPage, /data-student-result="correct"/);
  assert.match(gradingPage, /data-student-result="wrong"/);
  assert.match(gradingPage, /data-student-bulk-result="correct"/);
  assert.match(gradingPage, /data-student-bulk-result="wrong"/);
  assert.match(gradingPage, /data-student-part-result/);
  assert.match(gradingPage, /function studentQuestionParts/);
  assert.match(gradingPage, /function updateStudentPartResult/);
  assert.match(gradingPage, /function confirmAllGradingResults/);
  assert.match(gradingPage, /confirmAllStudents\.addEventListener/);
});

test('first homework grades directly on paper questions', () => {
  assert.match(gradingPage, /const usesPaperDirectGrading = taskId === "cluster-homework" && !isExam/);
  assert.match(gradingPage, /data-student-paper-question/);
  assert.match(gradingPage, /function cycleStudentPaperResult/);
  assert.match(gradingPage, /correct:\s*"wrong"/);
  assert.match(gradingPage, /wrong:\s*"partial"/);
  assert.match(gradingPage, /partial:\s*"correct"/);
  assert.match(gradingPage, /studentPageStack\.addEventListener\("keydown"/);
});

test('first homework omits structured tools and highlights paper questions', () => {
  assert.match(gradingPage, /function studentToolPanelMarkup/);
  assert.match(gradingPage, /if \(usesPaperDirectGrading\) return "";/);
  assert.match(gradingPage, /\.student-page-row\[data-paper-direct="true"\]/);
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:hover/);
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:focus-visible/);
});

test('first homework paper renders type-appropriate question content', () => {
  assert.match(gradingPage, /function firstHomeworkPaperQuestionMarkup/);
  assert.match(gradingPage, /二次函数 y = 2x² − 4x \+ 1 的图像开口方向是/);
  for (const option of ['A. 向下', 'B. 向上', 'C. 向左', 'D. 向右']) {
    assert.match(gradingPage, new RegExp(option.replace('.', '\\.')));
  }
  assert.match(gradingPage, /function studentChoiceSelection/);
  assert.match(gradingPage, /求函数 y = x² − 4x \+ 3 的对称轴/);
  assert.match(gradingPage, /写出函数在对称轴两侧的增减性/);
});

test('first homework places grading marks beside student responses', () => {
  assert.match(gradingPage, /class="student-paper-response/);
  assert.match(gradingPage, /student-paper-mark is-inline/);
  assert.match(gradingPage, /\.student-paper-mark\.is-inline/);
  assert.match(gradingPage, /usesPaperDirectGrading\s*\?\s*firstHomeworkPaperQuestionMarkup/);
});

test('student confirmation buttons reuse question grading button shape and color', () => {
  assert.match(gradingPage, /\.student-roster__footer \.button\s*\{[^}]*min-height:\s*38px[^}]*border-radius:\s*10px/s);
  assert.match(gradingPage, /\.student-review-footer \.button\s*\{[^}]*min-height:\s*38px[^}]*border-radius:\s*10px/s);
  assert.doesNotMatch(gradingPage, /\.student-roster__footer \.button\s*\{[^}]*#73c9f3/s);
  assert.doesNotMatch(gradingPage, /\.student-review-footer \.button\s*\{[^}]*#2585f4/s);
});

test('first homework shows an answer card beside the active paper question', () => {
  assert.match(gradingPage, /function studentAnswerPeekMarkup/);
  assert.match(gradingPage, /class="student-answer-peek"/);
  assert.match(gradingPage, /student-answer-peek__label">答案</);
  assert.doesNotMatch(gradingPage, /student-answer-peek__label">标准答案</);
  assert.match(gradingPage, /role="note"/);
  assert.match(gradingPage, /aria-describedby="studentAnswerPeek-/);
  assert.match(gradingPage, /开口向上/);
  assert.match(gradingPage, /对称轴 x = 2/);
  assert.match(gradingPage, /顶点（2，−1）/);
});

test('answer peek follows hover focus and recent paper grading', () => {
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:hover \.student-answer-peek/);
  assert.match(gradingPage, /\.student-paper-question\[data-student-paper-question\]:focus-visible \.student-answer-peek/);
  assert.match(gradingPage, /\.student-paper-question\.is-answer-pinned \.student-answer-peek/);
  assert.match(gradingPage, /function pinStudentPaperAnswer/);
  assert.match(gradingPage, /setTimeout\([\s\S]*1600/);
  assert.match(gradingPage, /focus\(\{ preventScroll: true \}\)/);
  assert.match(gradingPage, /@media \(max-width: 1400px\)[\s\S]*\.student-answer-peek/);
});

test('question grading uses the one-click confirmation label', () => {
  assert.match(gradingPage, /id="confirmAll">一键确认批改</);
  assert.match(gradingPage, /confirmAllButton\.textContent = isExam \? "确认全部题目赋分" : "一键确认批改"/);
  assert.match(gradingPage, /isExam \? "✓ 已确认全部题目赋分" : "✓ 已确认全部批改"/);
});

test('grading result navigation replaces the side rail', () => {
  assert.equal((gradingPage.match(/<button class="result-navigation__button[^>]*data-result-target=/g) || []).length, 4);
  assert.doesNotMatch(gradingPage, /class="result-rail/);
  assert.doesNotMatch(gradingPage, /\.result-rail/);
  assert.doesNotMatch(gradingPage, /id="resultRail"/);
  assert.match(gradingPage, /\.result-navigation\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(72px,\s*1fr\)\)/s);
  assert.match(gradingPage, /\.result-navigation__button\.is-active::after/);
  assert.match(gradingPage, /\.groups-scroll\s*\{[^}]*padding:\s*20px/s);
});

test('task cards expose grading, insights, and review actions', () => {
  assert.match(indexPage, /class="task-actions"/);
  assert.match(indexPage, /data-action="open-task"[^>]*data-task-id="\$\{task\.id\}"[^>]*>批改</);
  assert.match(indexPage, /data-action="open-insights"[^>]*data-task-id="\$\{task\.id\}"[^>]*>学情</);
  assert.match(indexPage, /data-action="open-review"[^>]*data-task-id="\$\{task\.id\}"[^>]*>讲评</);
  assert.match(indexPage, /action\.dataset\.action === "open-insights"/);
  assert.match(indexPage, /action\.dataset\.action === "open-review"/);
});

test('grading action uses the same visual style as insights and review', () => {
  assert.match(indexPage, /class="task-action"[^>]*data-action="open-task"/);
  assert.doesNotMatch(indexPage, /class="task-action primary"/);
  assert.doesNotMatch(indexPage, /\.task-action\.primary\s*\{/);
});

test('tasks hide all actions while AI analysis is in progress', () => {
  assert.match(indexPage, /const isAnalyzing = task\.status === "AI分析中" \|\| listTag === "AI分析中"/);
  assert.match(indexPage, /function taskActionButtons\(task\)/);
  assert.match(indexPage, /const taskActions = isAnalyzing \? "" : taskActionButtons\(task\)/);
  assert.match(indexPage, /<span class="task-actions"[^>]*>\s*\$\{taskActions\}\s*<\/span>/);
  assert.match(indexPage, /actions\.innerHTML = task\.status === "AI分析中" \? "" : taskActionButtons\(task\)/);
});
