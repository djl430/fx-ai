const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const confirmPage = fs.readFileSync('collection-confirm.html', 'utf8');
const indexPage = fs.readFileSync('index.html', 'utf8');
const historyPage = fs.readFileSync('collection-history.html', 'utf8');

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

test('history reminder uses the required wording', () => {
  assert.match(indexPage, />2批采集任务待确认</);
  assert.doesNotMatch(indexPage, />次待确认</);
});

test('history page does not auto-redirect after confirmation', () => {
  assert.doesNotMatch(historyPage, /location\.href\s*=\s*['"]index\.html['"]/);
  assert.doesNotMatch(historyPage, /fxCollectionProcessing/);
  assert.doesNotMatch(historyPage, /fxCollectionConfirmedTask/);
});

test('history pending rows still open the confirmation page', () => {
  assert.match(historyPage, /collection-confirm\.html\?task=/);
});
