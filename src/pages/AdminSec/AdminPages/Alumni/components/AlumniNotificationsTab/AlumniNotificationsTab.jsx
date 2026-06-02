import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import useNotification from "../../../../../../api_call/useNotification";
import "./AlumniNotificationsTab.css";

const AlumniNotificationsTab = ({ alumniData }) => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { getUserNotificationsPaginated } = useNotification();

  // Fetch notifications for this alumni (matched by alumni_id as reference_id)
  const fetchData = useCallback(
    (params) => getUserNotificationsPaginated(alumniData.alumni_id, params),
    [alumniData.alumni_id]
  );

  const columns = [
    {
      label: "Title",
      accessor: "title",
      render: (v, row) => (
        <div className="ant-title-cell">
          <span className="ant-title-main"> {v ? v.replace(/<[^>]*>/g, "") : "—"}</span>
          <span className="ant-title-meta">By {row.created_by_name || "—"}</span>
        </div>
      ),
    },
    {
      label: "Target",
      accessor: "target_type",
      render: (v) => (
        <span className="ant-target-badge">{v?.replace(/_/g, " ") || "—"}</span>
      ),
    },
    {
      label: "Channels",
      accessor: "delivery_channels",
    },
    {
      label: "Read",
      accessor: "is_read",
      render: (v) => (
        <span className={`ant-read-badge ${v ? "read" : "unread"}`}>
          {v ? "Read" : "Unread"}
        </span>
      ),
    },
    {
      label: "Sent At",
      accessor: "created_at",
      render: (v) => v ? new Date(v).toLocaleString() : "—",
    },
  ];

  return (
    <div className="alumni-notifications-tab">
      <InnerTabCon>
        <div className="ant-header">
          <h2 className="ant-title">Notifications</h2>
          <p className="ant-subtitle">Notifications sent to {alumniData.fullName}</p>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          onRowClick={(row) =>
            navigate(`/admin/${schoolId}/communication/notifications/${row.notification_id}`)
          }
          initialPageSize={15}
          showcreatbut={false}
        />
      </InnerTabCon>
    </div>
  );
};

export default AlumniNotificationsTab;
