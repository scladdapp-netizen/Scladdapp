import { useParams } from "react-router-dom";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import CbtDesk from "../../../../Cbt/CbtDesk";
import { adminCbtPaths } from "../../../../Cbt/cbtPaths";

// Opened from /admin/:schoolId/subjects/:subjectId/:subseasion/cbt. The subject and term come
// from the address, so they cannot be changed from inside the page.

const SubjectCbt = () => {
  const { schoolId, subjectId, subseasion } = useParams();
  const paths = adminCbtPaths({ schoolId, subjectId, subseasion });

  return (
    <InnerTabCon>
      <CbtDesk subjectId={subjectId} subsessionId={subseasion} editorPath={paths.editor} detailPath={paths.detail} />
    </InnerTabCon>
  );
};

export default SubjectCbt;
