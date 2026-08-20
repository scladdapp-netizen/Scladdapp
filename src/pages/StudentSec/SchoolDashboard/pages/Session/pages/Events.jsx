import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import useSchoolEvents from "../../../../../../api_call/useSchoolEvents";
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

const Events = () => {
  const { subseasion } = useParams();
  const { getEventsPaginated } = useSchoolEvents();
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(
    (params) => getEventsPaginated(subseasion, params),
    [subseasion]
  );

  const columns = [
    {
      accessor: "title",
      label: "Event",
      searchable: true,
      render: (val, row) => (
        <div>
          <div className="as-student-name">{val}</div>
          <div className="as-student-id">{fmt(row.event_date)}{row.event_time ? ` · ${row.event_time}` : ""}</div>
        </div>
      ),
    },
    {
      accessor: "category",
      label: "Category",
      render: (v) => v ? <span className="notif-target-badge">{v}</span> : "—",
    },
    { accessor: "location", label: "Location", render: (v) => v || "—" },
  ];

  return (
    <InnerTabCon>
      <div className="notifications-container">
        <div className="notif-header">
          <div className="notif-header-left">
            <h2 className="notif-title">School Events</h2>
            <p className="notif-subtitle">Events for this subsession</p>
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
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>{selected.title}</h2>
                  <p>{fmt(selected.event_date)}{selected.event_time ? ` · ${selected.event_time}` : ""}</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              <div className="cs-panel-grid">
                <InfoField label="Location"     value={selected.location} />
                <InfoField label="Category"     value={selected.category} />
                <InfoField label="Organizer"    value={selected.organizer} />
                <InfoField label="Participants" value={selected.participants} />
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

export default Events;
