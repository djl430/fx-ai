const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const confirmPage = fs.readFileSync('collection-confirm.html', 'utf8');

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
