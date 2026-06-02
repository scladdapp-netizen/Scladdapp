import "./AdminIdentity.css";
import AdminInfoCard from "../../components/adminInfoCard/AdminInfoCard";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";

const AdminIdentity = ({ adminData, refreshAdminData, onToggleStatus, adminStatus }) => {
  return (
    <InnerTabCon>
      <AdminInfoCard
        adminData={adminData}
        refreshAdminData={refreshAdminData}
        onToggleStatus={onToggleStatus}
        adminStatus={adminStatus ?? (adminData?.admin?.is_active ? "active" : "inactive")}
      />
    </InnerTabCon>
  );
};

export default AdminIdentity;
