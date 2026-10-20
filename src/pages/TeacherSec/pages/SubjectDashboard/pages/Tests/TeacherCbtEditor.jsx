import { useParams } from "react-router-dom";
import useTeacherSubjectAssignment from "../../../../../../api_call/useTeacherSubjectAssignment";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import CbtEditorPage from "../../../../../Cbt/CbtEditorPage";
import { teacherCbtPaths } from "../../../../../Cbt/cbtPaths";

// Full page at /teacher/:schoolId/subject/:subjectId/:assignmentId/tests/:subseasionId/new or /:testId
const TeacherCbtEditor = () => {
  const { schoolId, subjectId, assignmentId, subseasionId, testId } = useParams();
  const { assignment, loading } = useTeacherSubjectAssignment(assignmentId);

  if (assignmentId && loading) return <LoadingData message="Loading class..." />;

  const paths = teacherCbtPaths({ schoolId, subjectId, assignmentId, subseasionId });
  return (
    <CbtEditorPage
      subjectId={subjectId}
      subsessionId={subseasionId}
      testId={testId && testId !== "new" ? testId : ""}
      lockedClassId={assignment?.class_id || ""}
      listPath={paths.list}
      editorPath={paths.editor}
    />
  );
};

export default TeacherCbtEditor;
