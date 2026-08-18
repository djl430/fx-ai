const test = require('node:test');
const assert = require('node:assert/strict');
const flow = require('../collection-flow.js');

test('shares the original grading task names between list and grading pages', () => {
  assert.deepEqual(flow.gradingTaskContext('cluster-homework'), {
    title: '总复习 1·数与代数｜正比例与反比例',
    className: '六年级 · 扫描作业',
    kind: '作业',
  });
  assert.deepEqual(flow.gradingTaskContext('similar-homework'), {
    title: '小数乘法计算专项作业（相似作答分组批改）',
    className: '六年级 2 班',
    kind: '作业',
  });
  assert.deepEqual(flow.gradingTaskContext('quiz'), {
    title: '一次函数随堂检测',
    className: '八年级 3 班',
    kind: '考试',
  });
  assert.equal(flow.gradingTaskContext('unknown'), null);
});

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

test('keeps collection anomalies in confirmed history records', () => {
  const anomalies = [{ id: 'missing-zhang', status: 'pending' }];
  const next = flow.confirmHistoryRecord(null, {
    version: 1,
    batchId: 'batch-1',
    sourceTaskId: 'today-1942',
    groups: [],
    anomalies,
  });

  assert.deepEqual(next.records['today-1942'].anomalies, anomalies);
  assert.notEqual(next.records['today-1942'].anomalies, anomalies);
});

test('chooses anomaly review only when a supported anomaly is pending', () => {
  assert.equal(flow.nextCollectionStep([]), 'start-analysis');
  assert.equal(flow.nextCollectionStep([{ type: '缺页', status: 'pending' }]), 'review-anomalies');
  assert.equal(flow.nextCollectionStep([{ type: '多页', status: 'resolved' }]), 'start-analysis');
  assert.equal(flow.nextCollectionStep([{ type: '重复提交', status: 'pending' }]), 'start-analysis');
});

test('resolves one collection anomaly without mutating the source list', () => {
  const source = [{ id: 'missing-1', type: '缺页', status: 'pending' }];
  const next = flow.resolveCollectionAnomaly(source, 'missing-1', '标记缺页');

  assert.equal(source[0].status, 'pending');
  assert.deepEqual(next[0], {
    id: 'missing-1',
    type: '缺页',
    status: 'resolved',
    choice: '标记缺页',
  });
});

test('applies an unrecognized student ownership decision without mutating source data', () => {
  const source = [
    { id: 'owner-1', type: '未识别学生', student: '未识别', status: 'pending', pages: [{ id: 'page-1', studentName: '未识别' }] },
  ];

  const assigned = flow.resolveCollectionAnomaly(source, 'owner-1', '王芳');

  assert.equal(assigned[0].student, '王芳');
  assert.equal(assigned[0].pages[0].studentName, '王芳');
  assert.equal(assigned[0].status, 'resolved');
  assert.equal(source[0].student, '未识别');
  assert.equal(source[0].pages[0].studentName, '未识别');
});

test('groups supported anomalies by sample and excludes samples without anomalies', () => {
  const groups = [
    { id: 'sample-1', name: '分数练习', kind: '作业' },
    { id: 'sample-2', name: '单元测试', kind: '考试' },
    { id: 'sample-3', name: '无异常样卷', kind: '作业' },
  ];
  const result = flow.groupCollectionAnomalies(groups, [
    { id: 'a1', groupId: 'sample-1', type: '缺页', status: 'pending' },
    { id: 'a2', groupId: 'sample-1', type: '未识别学生', status: 'pending' },
    { id: 'a3', groupId: 'sample-2', type: '缺页', status: 'resolved' },
    { id: 'ignored', groupId: 'sample-2', type: '多页', status: 'pending' },
  ]);

  assert.deepEqual(result.map((item) => item.groupId), ['sample-1', 'sample-2']);
  assert.deepEqual(result.map((item) => item.anomalies.length), [2, 1]);
  assert.deepEqual(result.map((item) => item.name), ['分数练习', '单元测试']);
});

test('summarizes pending anomaly labels for one sample', () => {
  assert.deepEqual(flow.summarizeCollectionAnomalies([
    { id: 'm1', groupId: 'g1', type: '缺页', student: '张三', status: 'pending' },
    { id: 'm2', groupId: 'g1', type: '缺页', student: '张三', status: 'pending' },
    { id: 'u1', groupId: 'g1', type: '未识别学生', status: 'pending' },
    { id: 'u2', groupId: 'g1', type: '未识别学生', status: 'pending' },
    { id: 'done', groupId: 'g1', type: '缺页', student: '李四', status: 'resolved' },
    { id: 'other', groupId: 'g2', type: '缺页', student: '王五', status: 'pending' },
  ], 'g1'), {
    missingStudents: 1,
    unrecognizedPages: 2,
    firstPendingIds: { missing: 'm1', unrecognized: 'u1' },
  });
});

test('only unresolved ownership anomalies block analysis', () => {
  assert.deepEqual(flow.blockingCollectionAnomalies([
    { id: 'missing', type: '缺页', status: 'pending' },
    { id: 'owner', type: '未识别学生', status: 'pending' },
    { id: 'done', type: '未识别学生', status: 'resolved' },
  ]).map((item) => item.id), ['owner']);
});

test('normalizes only the draft for the requested collection task', () => {
  const source = {
    taskId: 'today-1942',
    groups: [{ id: 'g1', name: '练习', kind: '作业', pages: [{ id: 'p1' }] }],
    anomalies: [{ id: 'a1', groupId: 'g1', type: '未识别学生', status: 'pending', pages: [{ id: 'scan-1' }] }],
  };
  const draft = flow.normalizeCollectionDraft(source, 'today-1942');

  assert.equal(flow.collectionDraftKey('today-1942'), 'fxCollectionDraft:today-1942');
  assert.equal(draft.taskId, 'today-1942');
  assert.equal(draft.groups[0].pages[0].id, 'p1');
  assert.equal(draft.anomalies[0].pages[0].id, 'scan-1');
  assert.notEqual(draft.groups, source.groups);
  assert.notEqual(draft.anomalies, source.anomalies);
  assert.equal(flow.normalizeCollectionDraft(source, 'today-2026'), null);
  assert.equal(flow.normalizeCollectionDraft({ taskId: 'today-1942' }, 'today-1942'), null);
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
