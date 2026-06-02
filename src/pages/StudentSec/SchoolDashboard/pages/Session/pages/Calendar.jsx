import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import useSchoolCalendar from "../../../../../../api_call/useSchoolCalendar";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../../../components/infoField/InfoField";
import Button from "../../../../../../components/Button/Button";
import "../../../../../AdminSec/AdminPages/Communication/Notifications/Notifications.css";
import "../../../../../AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";
import "../../../../../TeacherSec/pages/EventsCalendar/EventsCalendar.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const TYPE_COLORS = {
  Academic: "#eff6ff", Sports: "#f0fdf4", Cultural: "#fdf4ff",
  Holiday: "#fff7ed", Meeting: "#f0f9ff", General: "#f4f4f4",
};

const Calendar = () => {
  const { subseasion } = useParams();
  const { getCalendarItemsPaginated } = useSchoolCalendar();
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(
    (params) => getCalendarItemsPaginated(subseasion, params),
    [subseasion]
  );

  const columns = [
    {
      accessor: "title",
      label: "Item",
      searchable: true,
      render: (val, row) => (
        <div>
          <div className="as-student-name">{val}</div>
          <div className="as-student-id">{fmt(row.calendar_date)}{row.calendar_time ? ` · ${row.calendar_time}` : ""}</div>
        </div>
      ),
    },
    {
      accessor: "type",
      label: "Type",
      render: (v) => v ? <span className="notif-target-badge">{v}</span> : "—",
    },
    { accessor: "location", label: "Location", render: (v) => v || "—" },
    { accessor: "priority", label: "Priority",  render: (v) => v || "—" },
  ];

  return (
    <InnerTabCon>
      <div className="notifications-container">
        <div className="notif-header">
          <div className="notif-header-left">
            <h2 className="notif-title">School Calendar</h2>
            <p className="notif-subtitle">Calendar items for this subsession</p>
          </div>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          onRowClick={(row) => setSelected(row)}
          enableSelect={false}
          showcreatbut={false}
          initialPageSize={20}
          reloadKey={subseasion}
        />
      </div>

      <SlideInMenu isShow={!!selected} onClose={() => setSelected(null)} width="520px">
        {selected && (
          <div className="cs-panel">
            <div className="cs-panel-header default">
              <span className="cs-panel-header-deco" aria-hidden="true"/>
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.7"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>{selected.title}</h2>
                  <p>{fmt(selected.calendar_date)}{selected.calendar_time ? ` · ${selected.calendar_time}` : ""}</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              {selected.type && (
                <div style={{ marginBottom: 4 }}>
                  <span className="ev-type-pill" style={{ background: TYPE_COLORS[selected.type] || "#f4f4f4" }}>
                    {selected.type}
                  </span>
                </div>
              )}
              <div className="cs-panel-grid">
                <InfoField label="Location"     value={selected.location} />
                <InfoField label="Duration"     value={selected.duration} />
                <InfoField label="Priority"     value={selected.priority} />
                <InfoField label="Participants" value={selected.participants} />
                <InfoField label="Status"       value={selected.status} />
              </div>
              {selected.description && (
                <>
                  <span className="sc-section-label">Description</span>
                  <p className="ev-detail-desc">{selected.description}</p>
                </>
              )}
            </div>
            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default Calendar;
