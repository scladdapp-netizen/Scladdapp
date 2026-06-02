import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../../../components/infoField/InfoField";
import Button from "../../../../../../components/Button/Button";
import { useClassSubjects } from "../../../../../../api_call/useClassSubjects";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";

const ClassSubjects = () => {
  const { classId } = useParams();
  const { makeClassSubjectsFetcher } = useClassSubjects();

  const [reloadKey]               = useState(0);
  const [detailRow, setDetailRow] = useState(null);

  const fetchData = useMemo(() => makeClassSubjectsFetcher(classId), [classId, reloadKey]);

  const columns = [
    {
      label: "Subject", accessor: "subject_name",
      render: (val, row) => (
        <div className="cs-subject-cell">
          <div className="cs-subject-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="cs-subject-name">{val}</p>
            <span className="cs-subject-code">{row.subject_code}</span>
          </div>
        </div>
      ),
    },
    { label: "Description",   accessor: "subject_description" },
    { label: "Teacher",       accessor: "teacher_name" },
    { label: "Teacher Email", accessor: "teacher_email" },
    {
      label: "Status", accessor: "is_active", searchable: false,
      render: (val) => (
        <span className={`cs-status ${val ? "active" : "inactive"}`}>
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <InnerTabCon>
      <div className="classSubjects">
        <div className="csHeader">
          <div className="csHeaderLeft">
            <h2 className="csTitle">Subjects</h2>
            <p className="csSubtitle">All subjects assigned to this class</p>
          </div>
        </div>

        <div className="csTableContainer">
          <ServerSmartTable
            columns={columns}
            fetchData={fetchData}
            onRowClick={(row) => setDetailRow(row)}
            enableSelect={false}
            showcreatbut={false}
            initialPageSize={20}
            reloadKey={reloadKey}
          />
        </div>
      </div>

      {/* Detail panel */}
      <SlideInMenu isShow={!!detailRow} onClose={() => setDetailRow(null)} width="480px">
        {detailRow && (
          <div className="cs-panel">
            <div className="cs-panel-header default">
              <span className="cs-panel-header-deco" aria-hidden="true" />
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>{detailRow.subject_name}</h2>
                  <p>Subject details</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              <div className="cs-panel-grid">
                <InfoField label="Subject Name"  value={detailRow.subject_name} />
                <InfoField label="Subject Code"  value={detailRow.subject_code} />
                <InfoField label="Description"   value={detailRow.subject_description} />
                <InfoField label="Status"        value={detailRow.is_active ? "Active" : "Inactive"} />
                <InfoField label="Teacher"       value={detailRow.teacher_name} />
                <InfoField label="Teacher Email" value={detailRow.teacher_email} />
                {detailRow.teacher_phone && (
                  <InfoField label="Teacher Phone" value={detailRow.teacher_phone} />
                )}
              </div>
            </div>
            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setDetailRow(null)}>Close</Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default ClassSubjects;
