import "./DashboardLayout.css";
import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("adminSidebarCollapsed") === "true";
  });

  function handleToggleSidebar() {
    setSidebarCollapsed((previousValue) => {
      const nextValue = !previousValue;

      localStorage.setItem(
        "adminSidebarCollapsed",
        String(nextValue)
      );

      return nextValue;
    });
  }

  return (
    <div
      className={`dashboard-shell ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <Sidebar />

      <div className="dashboard-main">
        <Header onToggleSidebar={handleToggleSidebar} />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}