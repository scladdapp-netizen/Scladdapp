import { useCallback, useState } from "react";
import ServerSmartTable from "../../components/ServerSmartTable/ServerSmartTable";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtClose, cbtDelete, cbtList } from "../../api_call/useCbt";
import { ConfirmDialog } from "./CbtModal";
import CbtRowMenu from "./CbtRowMenu";
import { fmt } from "./cbtUtils";

const CbtList = ({ ctx, lockedClassId, go }) => {
  const { addNotification } = useNotification();
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const subjectId = ctx.subject.subject_id;
  const termId = ctx.term.term_id;

  const fetchData = useCallback(
    async ({ page, limit, search, searchField }) => {
      const res = await cbtList(subjectId, termId, { page, limit, search, searchField, classId: lockedClassId });
      if (!res.success) return { success: false, message: res.message || "Could not load tests." };
      return { success: true, data: res.data.map((row) => ({ ...row, id: row.test_id })), pagination: res.pagination };
    },
    [subjectId, termId, lockedClassId]
  );

  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    const res = confirm.kind === "delete" ? await cbtDelete(confirm.test.test_id) : await cbtClose(confirm.test.test_id);
    setBusy(false);
    if (!res.success) {
      addNotification(res.message || "That did not work.", "error");
      return;
    }
    addNotification(confirm.kind === "delete" ? (res.data?.archived ? "Test archived. Attempts and results are kept." : "Draft deleted.") : "Test closed. Results are not released until you release them.", "success");
    setConfirm(null);
    setReloadKey((key) => key + 1);
  };

  const canCreate = ctx.can_edit && ctx.classes.length > 0;

  const actionsFor = (test) => {
    const id = test.test_id;
    const items = [{ label: "View details", onClick: () => go("detail", { testId: id }) }];
    if (test.status === "draft") {
      items.push(
        { label: "Edit", onClick: () => go("editor", { testId: id }) },
        { label: "Delete", danger: true, onClick: () => setConfirm({ kind: "delete", test }) }
      );
    }
    if (test.status === "published") items.push({ label: "Close test", danger: true, onClick: () => setConfirm({ kind: "close", test }) });
    if (test.status === "closed") items.push({ label: "Archive", danger: true, onClick: () => setConfirm({ kind: "delete", test }) });
    return items;
  };

  const columns = [
    {
      accessor: "title",
      label: "Title",
      searchable: true,
      render: (value) => <strong>{value || "Untitled test"}</strong>,
    },
    { accessor: "class_name", label: "Class", searchable: true, render: (value) => value || "—" },
    {
      accessor: "subject_term",
      label: "Subject / term",
      searchable: false,
      render: () => (
        <>
          {ctx.subject.subject_name}
          <span className="cbt-sub">{ctx.term.term_name}</span>
        </>
      ),
    },
    { accessor: "question_count", label: "Questions", searchable: false },
    { accessor: "total_marks", label: "Total marks", searchable: false, render: (value) => fmt(value) },
    {
      accessor: "completed_count",
      label: "Completed",
      searchable: false,
      render: (value, row) => (row.status === "draft" ? "—" : value),
    },
    {
      accessor: "actions",
      label: "Actions",
      searchable: false,
      render: (_, row) => <CbtRowMenu items={actionsFor(row)} />,
    },
  ];

  return (
    <>
      <div className="cbt-head">
        <div className="cbt-head-copy">
          <h1>CBT</h1>
          <p className="cbt-muted">
            Computer-based tests for {ctx.subject.subject_name}, {ctx.term.term_name}. Scores feed the report card after you release results.
          </p>
        </div>
        <button type="button" className="cbt-btn" disabled={!canCreate} onClick={() => go("editor", {})}>New test</button>
      </div>

      {!canCreate && (
        <p className="cbt-note">
          {ctx.classes.length === 0 ? "This subject is not linked to a class you can use yet, so tests cannot be created." : "You can view tests here but not create them."}
        </p>
      )}

      <div className="cbt-list-table">
        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          showcreatbut={false}
          initialPageSize={20}
          reloadKey={reloadKey}
          onRowClick={(row) => go("detail", { testId: row.test_id })}
        />
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === "delete" ? (confirm.test.status === "draft" ? "Delete this draft?" : "Archive this test?") : "Close this test?"}
          message={
            confirm.kind === "delete"
              ? confirm.test.status === "draft"
                ? `"${confirm.test.title || "Untitled test"}" will be deleted. This cannot be undone.`
                : `"${confirm.test.title}" will be hidden from this list. Student attempts and released results are kept.`
              : `Students can no longer continue "${confirm.test.title}". Anything still being written is submitted as it stands. Results are not released automatically.`
          }
          confirmLabel={confirm.kind === "delete" ? (confirm.test.status === "draft" ? "Delete draft" : "Archive test") : "Close test"}
          danger
          busy={busy}
          onConfirm={run}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default CbtList;
