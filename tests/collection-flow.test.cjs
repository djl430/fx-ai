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
    sourceTaskId: 'today-1942',
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
  assert.ok(tasks.every((task) => task.status === 'AI分析中'));
  assert.ok(tasks.every((task) => task.generated === true));
  assert.ok(tasks.every((task) => task.recognitionStartedAt === 1786550400000));
  assert.ok(tasks.every((task) => task.sourceTaskId === 'today-1942'));
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
  const stablePage = {
    id: 'p2',
    sourcePageNumber: 4,
    paperTitle: '第三单元测试',
    content: ['7. 计算下面各题'],
  };
  const groups = [
    { id: 'sample-1', students: 31, pages: [{ id: 'p1' }, stablePage] },
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
  assert.deepEqual(groups[1].pages[0], stablePage);
  assert.equal(groups[1].students, 31);
});

test('adds only unassigned selected submission pages in source order', () => {
  const groups = [
    { id: 'sample-1', pages: [{ id: 'a-1' }] },
    { id: 'sample-2', pages: [] },
  ];
  const submissions = [
    { id: 'a-1', studentId: 'a', sourcePageNumber: 1 },
    { id: 'b-2', studentId: 'b', sourcePageNumber: 2 },
    { id: 'b-1', studentId: 'b', sourcePageNumber: 1 },
  ];

  const next = flow.addSubmissionPages(groups, 'sample-2', submissions, ['a-1', 'b-2', 'b-1']);

  assert.deepEqual(next[1].pages.map((page) => page.id), ['b-1', 'b-2']);
  assert.equal(flow.pageOwner(groups, 'a-1').id, 'sample-1');
});

test('calculates five-second recognition progress from the original start time', () => {
  const task = { recognitionStartedAt: 1000 };

  assert.deepEqual(flow.recognitionProgress(task, 1000, 5000), { percent: 0, complete: false });
  assert.deepEqual(flow.recognitionProgress(task, 3500, 5000), { percent: 50, complete: false });
  assert.deepEqual(flow.recognitionProgress(task, 6000, 5000), { percent: 100, complete: true });
});

test('marks a completed generated task as pending confirmation', () => {
  const task = { id: 'generated-1', generated: true, recognitionStartedAt: 1000, status: 'AI分析中', listTag: 'AI分析中', progress: 0 };
  const completed = flow.advanceRecognition(task, 6000, 5000);

  assert.equal(completed.status, '待确认');
  assert.equal(completed.listTag, '待确认');
  assert.equal(completed.progress, 100);
});

test('confirms a history record with a final sample snapshot', () => {
  const next = flow.confirmHistoryRecord(null, {
    version: 1,
    batchId: 'batch-1',
    sourceTaskId: 'today-1942',
    className: '六年级3班 · 数学',
    createdAt: 2000,
    groups: [{ id: 'sample-1', name: '练习', kind: '作业', pages: [{ id: 'p1' }] }],
  }, { title: '今天 19:42 · 六年级3班 · 数学' });

  assert.equal(next.version, 1);
  assert.equal(next.records['today-1942'].status, '已确认');
  assert.equal(next.records['today-1942'].groups[0].name, '练习');
});

test('counts only unconfirmed seeded collection tasks', () => {
  const seeds = [{ id: 'today-1942' }, { id: 'today-1618' }];
  const history = { version: 1, records: { 'today-1942': { status: '已确认' } } };

  assert.equal(flow.pendingHistoryCount(seeds, history), 1);
  assert.equal(flow.pendingHistoryCount(seeds, { version: 1, records: { 'today-1942': { status: '已确认' }, 'today-1618': { status: '已确认' } } }), 0);
});

test('seeded confirmed history tasks are excluded from the pending count', () => {
  const seeds = [{ id: 'today-1942' }, { id: 'today-1618', confirmed: true }];
  assert.equal(flow.pendingHistoryCount(seeds, null), 1);
});

test('applies persistent deleted and confirmed task state by task id', () => {
  const tasks = [
    { id: 'keep', status: '待确认', listTag: '待确认' },
    { id: 'done', status: '待确认', listTag: '待确认' },
    { id: 'remove', status: '待确认', listTag: '待确认' },
  ];
  const state = {
    version: 1,
    deletedTaskIds: ['remove'],
    confirmedTaskIds: ['done'],
  };

  assert.deepEqual(flow.applyTaskListState(tasks, state).map((task) => [task.id, task.status]), [
    ['keep', '待确认'],
    ['done', '已确认'],
  ]);
});

test('marks one task deleted or confirmed without affecting other ids', () => {
  const deleted = flow.markTaskDeleted(null, 'task-1');
  const confirmed = flow.markTaskConfirmed(deleted, 'task-2');

  assert.deepEqual(confirmed.deletedTaskIds, ['task-1']);
  assert.deepEqual(confirmed.confirmedTaskIds, ['task-2']);
});

test('removes an entire sample group or one page', () => {
  const groups = [
    { id: 'g1', pages: [{ id: 'p1' }, { id: 'p2' }] },
    { id: 'g2', pages: [{ id: 'p3' }] },
  ];

  assert.deepEqual(flow.removeSampleGroup(groups, 'g2').map((group) => group.id), ['g1']);
  assert.deepEqual(flow.removeSamplePage(groups, 'g1', 'p1')[0].pages.map((page) => page.id), ['p2']);
});

test('normalizes and updates grading progress by task id', () => {
  const initial = flow.normalizeGradingProgress({
    version: 1,
    tasks: { taskA: { completedQuestionIds: [1, 2, 2, 'bad'], updatedAt: 10 } },
  });
  assert.deepEqual(initial.tasks.taskA.completedQuestionIds, [1, 2]);

  const next = flow.markQuestionCompleted(initial, 'taskA', 3, 20);
  assert.deepEqual(next.tasks.taskA.completedQuestionIds, [1, 2, 3]);
  assert.equal(next.tasks.taskA.updatedAt, 20);
});

test('applies only valid completed question ids and finds first pending', () => {
  const questions = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const applied = flow.applyGradingProgress(questions, {
    version: 1,
    tasks: { taskA: { completedQuestionIds: [2, 99] } },
  }, 'taskA');

  assert.deepEqual(applied.map((question) => question.status), ['pending', 'completed', 'pending']);
  assert.equal(flow.firstPendingQuestionId(applied), 1);
});
