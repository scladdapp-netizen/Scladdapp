import { useParams } from "react-router-dom";
import CbtEditorPage from "../../../../Cbt/CbtEditorPage";
import { adminCbtPaths } from "../../../../Cbt/cbtPaths";

// Full page at /admin/:schoolId/subjects/:subjectId/:subseasion/cbt/new or .../cbt/:testId
const SubjectCbtEditor = () => {
  const { schoolId, subjectId, subseasion, testId } = useParams();
  const paths = adminCbtPaths({ schoolId, subjectId, subseasion });

  return (
    <CbtEditorPage
      subjectId={subjectId}
      subsessionId={subseasion}
      testId={testId && testId !== "new" ? testId : ""}
      listPath={paths.list}
      editorPath={paths.editor}
    />
  );
};

export default SubjectCbtEditor;
