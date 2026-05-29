import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout({ children }) {

  useEffect(() => {
    document.body.classList.add("panel-body");

    return () => {
      document.body.classList.remove("panel-body");
    };
  }, []);

  return (
    <div className="panel-scope layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}