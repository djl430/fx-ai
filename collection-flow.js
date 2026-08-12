(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FxCollectionFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const normalizeKind = (value) => value === '考试' ? '考试' : '作业';

  const normalizeName = (value) => String(value || '').trim() || '未命名样卷';

  const validGroups = (groups) => Array.isArray(groups)
    ? groups
      .filter((group) => group && Array.isArray(group.pages) && group.pages.length > 0)
      .map((group) => ({
        ...group,
        name: normalizeName(group.name),
        kind: normalizeKind(group.kind),
        students: Math.max(0, Number(group.students) || 0),
      }))
    : [];

  const buildTasks = (batch) => validGroups(batch && batch.groups).map((group, index) => ({
    id: `collection-${batch.batchId}-${index + 1}`,
    title: group.name,
    kind: group.kind,
    className: batch.className || '扫描采集',
    students: group.students,
    pages: group.pages.length,
    anomalyCount: 0,
    status: 'AI分析中',
    listTag: 'AI分析中',
    progress: 0,
    updated: '刚刚',
    generated: true,
    sourceTaskId: batch.sourceTaskId || '',
    recognitionStartedAt: Number(batch.createdAt) || Date.now(),
    anomalies: [],
    studentRows: [],
  }));

  const parseBatch = (raw) => {
    try {
      const batch = JSON.parse(raw);
      return batch
        && batch.version === 1
        && typeof batch.batchId === 'string'
        && Array.isArray(batch.groups)
        ? batch
        : null;
    } catch (_) {
      return null;
    }
  };

  const mergeTasks = (existing, incoming) => {
    const ids = new Set();
    return [...(incoming || []), ...(existing || [])].filter((task) => {
      if (!task || !task.id || ids.has(task.id)) return false;
      ids.add(task.id);
      return true;
    });
  };

  const movePage = (groups, move) => {
    if (!Array.isArray(groups) || !move) return false;
    const sourceGroup = groups.find((group) => group.id === move.sourceGroupId);
    const targetGroup = groups.find((group) => group.id === move.targetGroupId);
    const sourceIndex = sourceGroup?.pages.findIndex((page) => page.id === move.pageId) ?? -1;
    if (!sourceGroup || !targetGroup || sourceIndex < 0) return false;
    if (sourceGroup === targetGroup && move.beforePageId === move.pageId) return false;

    const [page] = sourceGroup.pages.splice(sourceIndex, 1);
    const beforeIndex = move.beforePageId
      ? targetGroup.pages.findIndex((item) => item.id === move.beforePageId)
      : -1;
    targetGroup.pages.splice(beforeIndex < 0 ? targetGroup.pages.length : beforeIndex, 0, page);
    if (!targetGroup.students) targetGroup.students = sourceGroup.students;
    return true;
  };

  const pageOwner = (groups, pageId) => (Array.isArray(groups) ? groups : [])
    .find((group) => Array.isArray(group?.pages) && group.pages.some((page) => page?.id === pageId)) || null;

  const addSubmissionPages = (groups, targetGroupId, submissions, pageIds) => {
    const sourceGroups = Array.isArray(groups) ? groups : [];
    const targetGroup = sourceGroups.find((group) => group?.id === targetGroupId);
    if (!targetGroup) return sourceGroups;

    const selectedPageIds = new Set(Array.isArray(pageIds) ? pageIds : []);
    const assignedPageIds = new Set(sourceGroups.flatMap((group) => (Array.isArray(group?.pages) ? group.pages : [])
      .map((page) => page?.id)));
    const studentOrder = new Map();
    const additions = (Array.isArray(submissions) ? submissions : [])
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => page?.id && selectedPageIds.has(page.id) && !assignedPageIds.has(page.id))
      .filter(({ page, index }) => {
        if (!studentOrder.has(page.studentId)) studentOrder.set(page.studentId, index);
        return true;
      })
      .sort((left, right) => studentOrder.get(left.page.studentId) - studentOrder.get(right.page.studentId)
        || Number(left.page.sourcePageNumber) - Number(right.page.sourcePageNumber)
        || left.index - right.index)
      .map(({ page }) => page);

    return sourceGroups.map((group) => group?.id === targetGroupId
      ? { ...group, pages: [...(Array.isArray(group.pages) ? group.pages : []), ...additions] }
      : group);
  };

  const recognitionProgress = (task, now = Date.now(), duration = 5000) => {
    const safeDuration = Math.max(1, Number(duration) || 5000);
    const startedAt = Number(task && task.recognitionStartedAt);
    const safeStart = Number.isFinite(startedAt) ? startedAt : Number(now) || Date.now();
    const elapsed = Math.max(0, (Number(now) || safeStart) - safeStart);
    const complete = elapsed >= safeDuration;
    const percent = complete ? 100 : Math.floor((elapsed / safeDuration) * 100);
    return { percent, complete };
  };

  const advanceRecognition = (task, now = Date.now(), duration = 5000) => {
    if (!task || !task.generated || !['AI分析中', 'AI识别中'].includes(task.status)) return task;
    const progress = recognitionProgress(task, now, duration);
    return {
      ...task,
      progress: progress.percent,
      status: progress.complete ? '待确认' : 'AI分析中',
      listTag: progress.complete ? '待确认' : 'AI分析中',
    };
  };

  const normalizeHistoryState = (state) => state
    && state.version === 1
    && state.records
    && typeof state.records === 'object'
    ? { version: 1, records: { ...state.records } }
    : { version: 1, records: {} };

  const confirmHistoryRecord = (state, batch, metadata = {}) => {
    const next = normalizeHistoryState(state);
    if (!batch || !batch.sourceTaskId) return next;
    next.records[batch.sourceTaskId] = {
      taskId: batch.sourceTaskId,
      status: '已确认',
      confirmedAt: Number(batch.createdAt) || Date.now(),
      title: metadata.title || '',
      className: batch.className || metadata.className || '',
      groups: validGroups(batch.groups),
      anomalies: Array.isArray(batch.anomalies) ? batch.anomalies.map((anomaly) => ({ ...anomaly })) : [],
    };
    return next;
  };

  const pendingHistoryCount = (seeds, state) => {
    const history = normalizeHistoryState(state);
    return (Array.isArray(seeds) ? seeds : []).filter((seed) => {
      const record = seed && history.records[seed.id];
      return !seed?.confirmed && (!record || record.status !== '已确认');
    }).length;
  };

  const normalizeTaskListState = (state) => ({
    version: 1,
    deletedTaskIds: [...new Set(Array.isArray(state && state.deletedTaskIds) ? state.deletedTaskIds : [])],
    confirmedTaskIds: [...new Set(Array.isArray(state && state.confirmedTaskIds) ? state.confirmedTaskIds : [])],
  });

  const markTaskDeleted = (state, taskId) => {
    const next = normalizeTaskListState(state);
    if (taskId && !next.deletedTaskIds.includes(taskId)) next.deletedTaskIds.push(taskId);
    next.confirmedTaskIds = next.confirmedTaskIds.filter((id) => id !== taskId);
    return next;
  };

  const markTaskConfirmed = (state, taskId) => {
    const next = normalizeTaskListState(state);
    if (taskId && !next.confirmedTaskIds.includes(taskId)) next.confirmedTaskIds.push(taskId);
    return next;
  };

  const applyTaskListState = (tasks, state) => {
    const normalized = normalizeTaskListState(state);
    return (Array.isArray(tasks) ? tasks : [])
      .filter((task) => task && !normalized.deletedTaskIds.includes(task.id))
      .map((task) => normalized.confirmedTaskIds.includes(task.id)
        ? { ...task, status: '已确认', listTag: '已确认', progress: 100 }
        : task);
  };

  const removeSampleGroup = (groups, groupId) => (Array.isArray(groups) ? groups : [])
    .filter((group) => group && group.id !== groupId);

  const removeSamplePage = (groups, groupId, pageId) => (Array.isArray(groups) ? groups : [])
    .map((group) => group && group.id === groupId
      ? { ...group, pages: (Array.isArray(group.pages) ? group.pages : []).filter((page) => page.id !== pageId) }
      : group);

  const normalizeGradingProgress = (value) => {
    const tasks = {};
    if (value && value.version === 1 && value.tasks && typeof value.tasks === 'object') {
      Object.entries(value.tasks).forEach(([taskId, record]) => {
        const completedQuestionIds = [...new Set((Array.isArray(record?.completedQuestionIds) ? record.completedQuestionIds : [])
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0))];
        tasks[taskId] = { completedQuestionIds, updatedAt: Number(record?.updatedAt) || 0 };
      });
    }
    return { version: 1, tasks };
  };

  const markQuestionCompleted = (state, taskId, questionId, updatedAt = Date.now()) => {
    const next = normalizeGradingProgress(state);
    const current = next.tasks[taskId] || { completedQuestionIds: [], updatedAt: 0 };
    const normalizedId = Number(questionId);
    if (!taskId || !Number.isInteger(normalizedId) || normalizedId < 1) return next;
    return {
      ...next,
      tasks: {
        ...next.tasks,
        [taskId]: {
          completedQuestionIds: [...new Set([...current.completedQuestionIds, normalizedId])],
          updatedAt,
        },
      },
    };
  };

  const applyGradingProgress = (questions, state, taskId) => {
    const completedIds = new Set(normalizeGradingProgress(state).tasks[taskId]?.completedQuestionIds || []);
    return (Array.isArray(questions) ? questions : []).map((question) => ({
      ...question,
      status: completedIds.has(Number(question.id)) ? 'completed' : 'pending',
    }));
  };

  const firstPendingQuestionId = (questions) =>
    (Array.isArray(questions) ? questions : []).find((question) => question.status !== 'completed')?.id
      ?? (Array.isArray(questions) ? questions : [])[0]?.id
      ?? null;

  return {
    normalizeKind,
    normalizeName,
    validGroups,
    buildTasks,
    parseBatch,
    mergeTasks,
    movePage,
    pageOwner,
    addSubmissionPages,
    recognitionProgress,
    advanceRecognition,
    normalizeHistoryState,
    confirmHistoryRecord,
    pendingHistoryCount,
    normalizeTaskListState,
    markTaskDeleted,
    markTaskConfirmed,
    applyTaskListState,
    removeSampleGroup,
    removeSamplePage,
    normalizeGradingProgress,
    markQuestionCompleted,
    applyGradingProgress,
    firstPendingQuestionId,
  };
});
