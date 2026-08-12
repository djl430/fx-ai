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
    status: 'AI识别中',
    listTag: 'AI识别中',
    progress: 0,
    updated: '刚刚',
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

  return {
    normalizeKind,
    normalizeName,
    validGroups,
    buildTasks,
    parseBatch,
    mergeTasks,
    movePage,
  };
});
