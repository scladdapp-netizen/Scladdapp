import { Route, Routes } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import Settings from "../AdminPages/Settings/Settings";

const SettingsRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<Settings />} />
      <Route path="/*" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default SettingsRoute;
