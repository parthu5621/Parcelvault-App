
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { Dashboard } from "./components/dashboard";
import "./styles/index.css";

const isReport = window.location.pathname.includes('report') || window.location.search.includes('report');

createRoot(document.getElementById("root")!).render(isReport ? <Dashboard /> : <App />);
  