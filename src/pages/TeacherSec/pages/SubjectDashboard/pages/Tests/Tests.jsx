import { useParams } from "react-router-dom";
import useTeacherSubjectAssignment from "../../../../../../api_call/useTeacherSubjectAssignment";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import CbtDesk from "../../../../../Cbt/CbtDesk";
import { teacherCbtPaths } from "../../../../../Cbt/cbtPaths";

// The teacher's assignment fixes the subject, class and term. The server also checks the
// assignment, so this page only shows what the teacher is allowed to manage.
const Tests = () => {
  const { schoolId, subjectId, assignmentId, subseasionId } = useParams();
  const { assignment, loading } = useTeacherSubjectAssignment(assignmentId);

  if (assignmentId && loading) return <LoadingData message="Loading class..." />;

  const paths = teacherCbtPaths({ schoolId, subjectId, assignmentId, subseasionId });
  return <CbtDesk subjectId={subjectId} subsessionId={subseasionId} lockedClassId={assignment?.class_id || ""} editorPath={paths.editor} detailPath={paths.detail} />;
};

export default Tests;
