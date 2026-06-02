import "./App.css";
import { useNotification } from "./context/NotificationProvider/NotificationProvider";
import Nav from "./navigation/nav";

function App() {
  const { addNotification } = useNotification();
  return (
    <>
      <Nav />
    </>
  );
}

export default App;
