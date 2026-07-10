import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="st-admin-layout">
      <Sidebar />
      <main className="st-main">
          <Outlet />
        </main>
    </div>
  );
}

export default AdminLayout;