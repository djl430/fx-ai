const test = require('node:test');
const assert = require('node:assert/strict');
const flow = require('../collection-flow.js');

test('keeps only non-empty sample groups', () => {
  const groups = flow.validGroups([
    { name: '分数乘法练习', kind: '作业', pages: [{ id: 'p1' }] },
    { name: '空分组', kind: '考试', pages: [] },
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, '分数乘法练习');
});

test('normalizes empty names and unsupported kinds', () => {
  const [group] = flow.validGroups([
    { name: '   ', kind: '练习', students: -2, pages: [{ id: 'p1' }] },
  ]);

  assert.equal(group.name, '未命名样卷');
  assert.equal(group.kind, '作业');
  assert.equal(group.students, 0);
});

test('maps homework and exam groups to list tasks', () => {
  const tasks = flow.buildTasks({
    version: 1,
    batchId: 'batch-1',
    createdAt: 1786550400000,
    className: '六年级3班 · 数学',
    groups: [
      { name: '分数乘法练习', kind: '作业', students: 31, pages: [{}, {}, {}, {}] },
      { name: '第三单元测试', kind: '考试', students: 30, pages: [{}, {}] },
    ],
  });

  assert.deepEqual(tasks.map((task) => task.kind), ['作业', '考试']);
  assert.deepEqual(tasks.map((task) => task.pages), [4, 2]);
  assert.deepEqual(tasks.map((task) => task.title), ['分数乘法练习', '第三单元测试']);
  assert.ok(tasks.every((task) => task.status === 'AI识别中'));
});

test('returns null for malformed stored batches', () => {
  assert.equal(flow.parseBatch('{broken'), null);
  assert.equal(flow.parseBatch(JSON.stringify({ version: 1, groups: 'wrong' })), null);
  assert.equal(flow.parseBatch(JSON.stringify({ version: 2, batchId: 'batch-1', groups: [] })), null);
});

test('deduplicates generated tasks by id and keeps incoming order', () => {
  const task = { id: 'collection-batch-1-1', title: '练习' };
  const existing = [{ id: 'seed-task', title: '历史任务' }, task];

  assert.deepEqual(flow.mergeTasks(existing, [task]), [task, existing[0]]);
});

test('moves a page into a new sample group and preserves target order', () => {
  const groups = [
    { id: 'sample-1', students: 31, pages: [{ id: 'p1' }, { id: 'p2' }] },
    { id: 'sample-2', students: 0, pages: [{ id: 'p3' }] },
  ];

  const moved = flow.movePage(groups, {
    sourceGroupId: 'sample-1',
    pageId: 'p2',
    targetGroupId: 'sample-2',
    beforePageId: 'p3',
  });

  assert.equal(moved, true);
  assert.deepEqual(groups[0].pages.map((page) => page.id), ['p1']);
  assert.deepEqual(groups[1].pages.map((page) => page.id), ['p2', 'p3']);
  assert.equal(groups[1].students, 31);
});
