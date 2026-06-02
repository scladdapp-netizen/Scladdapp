import { Route, Routes } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import FeeBillingDashboard from "../AdminPages/FeeBilling/FeeBillingDashboard";
import BillDetail from "../AdminPages/FeeBilling/BillDetail";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

const FeeBillingRoute = () => {
  return (
    <Routes>
      <Route path="/bill/:billId/*" element={<SubAdminGuard permission="bill_income_expense"><BillDetail /></SubAdminGuard>} />
      <Route path="/*" element={<SubAdminGuard permission="bill_income_expense"><FeeBillingDashboard /></SubAdminGuard>} />
    </Routes>
  );
};

export default FeeBillingRoute;
