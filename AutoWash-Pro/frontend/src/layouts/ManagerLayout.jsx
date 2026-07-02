import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/authService";

function ManagerLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutFromServer();
    navigate("/");
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-top">
          <h2 className="dashboard-logo">Manager</h2>

          <nav className="dashboard-menu">
            <NavLink to="/manager/dashboard">Dashboard</NavLink>
            <NavLink to="/manager/bookings">Bookings</NavLink>
            <NavLink to="/manager/time-slots">Khung giờ</NavLink>
            <NavLink to="/manager/staff">Staff</NavLink>
            <NavLink to="/manager/revenue">Revenue</NavLink>
            <NavLink to="/manager/service-status">Service Status</NavLink>
          </nav>
        </div>

        <button className="dashboard-logout-btn" type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

export default ManagerLayout;