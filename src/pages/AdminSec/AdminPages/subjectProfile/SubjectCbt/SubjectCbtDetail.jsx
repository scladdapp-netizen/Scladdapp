import { useParams } from "react-router-dom";
import CbtDetailPage from "../../../../Cbt/CbtDetailPage";
import { adminCbtPaths } from "../../../../Cbt/cbtPaths";

// Full page at /admin/:schoolId/subjects/:subjectId/:subseasion/cbt/:testId/detail
const SubjectCbtDetail = () => {
  const { schoolId, subjectId, subseasion, testId } = useParams();
  const paths = adminCbtPaths({ schoolId, subjectId, subseasion });
  return <CbtDetailPage testId={testId} listPath={paths.list} editorPath={paths.editor} />;
};

export default SubjectCbtDetail;
