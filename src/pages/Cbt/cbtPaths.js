// Addresses for the CBT list, the full-page test editor and the test detail page, for admins and teachers.
export const adminCbtPaths = ({ schoolId, subjectId, subseasion }) => {
  const list = `/admin/${schoolId}/subjects/${subjectId}/${subseasion}/cbt`;
  return { list, editor: (testId) => `${list}/${testId || "new"}`, detail: (testId) => `${list}/${testId}/detail` };
};

export const teacherCbtPaths = ({ schoolId, subjectId, assignmentId, subseasionId }) => {
  const subject = assignmentId ? `/teacher/${schoolId}/subject/${subjectId}/${assignmentId}` : `/teacher/${schoolId}/subject/${subjectId}`;
  const list = `${subject}/tests/${subseasionId}`;
  return { list, editor: (testId) => `${list}/${testId || "new"}`, detail: (testId) => `${list}/${testId}/detail` };
};
