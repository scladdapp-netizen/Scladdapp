import { useParams } from "react-router-dom";
import CbtDetailPage from "../../../../../Cbt/CbtDetailPage";
import { teacherCbtPaths } from "../../../../../Cbt/cbtPaths";

// Full page at /teacher/:schoolId/subject/:subjectId/[:assignmentId/]tests/:subseasionId/:testId/detail
const TeacherCbtDetail = () => {
  const { schoolId, subjectId, assignmentId, subseasionId, testId } = useParams();
  const paths = teacherCbtPaths({ schoolId, subjectId, assignmentId, subseasionId });
  return <CbtDetailPage testId={testId} listPath={paths.list} editorPath={paths.editor} />;
};

export default TeacherCbtDetail;
