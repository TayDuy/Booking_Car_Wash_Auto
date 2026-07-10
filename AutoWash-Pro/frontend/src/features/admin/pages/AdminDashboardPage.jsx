import { useEffect, useState } from "react";
import bookingApi from "../../../api/bookingApi";
import { getBranches } from "../../../api/branchService";
import auditLogApi from "../../../api/auditLogApi";
import {
  CalendarCheck,
  DollarSign,
  Users,
  Car,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import "./AdminDashboardPage.css";

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);

  const [branches, setBranches] = useState([]);
  const [branchLoading, setBranchLoading] = useState(true);

  const [auditLogs, setAuditLogs] = useState([]);

  const totalBookings = bookings.length;
  const totalBranches = branches.length;

  const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const activeBranches = branches.filter(
    (branch) => branch.status === "active"
  ).length;

  const todayText = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const kpis = [
    {
      title: "Tổng đặt lịch",
      value: bookingLoading ? "..." : totalBookings,
      change: "Tổng số đơn trong hệ thống",
      icon: CalendarCheck,
      color: "blue",
    },
    {
      title: "Chi nhánh",
      value: branchLoading ? "..." : totalBranches,
      change: `${activeBranches} đang hoạt động`,
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Đơn hoàn thành",
      value: bookingLoading ? "..." : completedBookings,
      change: "Đã hoàn tất",
      icon: Users,
      color: "purple",
    },
    {
      title: "Đang hoạt động",
      value: bookingLoading ? "..." : (totalBookings - completedBookings),
      change: "Đơn chưa hoàn thành",
      icon: Car,
      color: "orange",
    },
  ];

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await bookingApi.adminList();
        const result = response.data?.data || response.data || [];
        if (Array.isArray(result)) {
          setBookings(result);
        } else if (Array.isArray(result.content)) {
          setBookings(result.content);
        } else {
          setBookings([]);
        }
      } catch {
        setBookings([]);
      } finally {
        setBookingLoading(false);
      }
    }

    async function loadBranches() {
      try {
        const response = await getBranches();
        const result = response.data?.data || response.data || [];
        if (Array.isArray(result)) {
          setBranches(result);
        } else if (Array.isArray(result.content)) {
          setBranches(result.content);
        } else {
          setBranches([]);
        }
      } catch {
        setBranches([]);
      } finally {
        setBranchLoading(false);
      }
    }

    async function loadAuditLogs() {
      try {
        const response = await auditLogApi.getAll();
        const result = response.data?.data || response.data || [];
        setAuditLogs(Array.isArray(result) ? result.slice(0, 5) : []);
      } catch {
        setAuditLogs([]);
      }
    }

    loadBookings();
    loadBranches();
    loadAuditLogs();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Xin chào, Admin!</h1>
          <p>Chào mừng bạn quay trở lại hệ thống WashFlow Pro.</p>
        </div>

        <button className="date-filter">
          Hôm nay: {todayText}
        </button>
      </div>

      <section className="kpi-grid">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div className="kpi-card" key={item.title}>
              <div className={`kpi-icon ${item.color}`}>
                <Icon size={24} />
              </div>

              <div>
                <p>{item.title}</p>
                <h2>{item.value}</h2>
                <span>
                  <ArrowUpRight size={14} />
                  {item.change}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel revenue-panel">
          <div className="panel-header">
            <h3>Doanh thu theo ngày</h3>
            <button>7 ngày qua</button>
          </div>

          <div className="revenue-placeholder">
            <p>Biểu đồ doanh thu sẽ được hiển thị tại đây.</p>
            <p><small>Kết nối với API reports/dashboard để có dữ liệu thực tế.</small></p>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Tình trạng chi nhánh</h3>
            <a href="/admin/branches">Xem tất cả</a>
          </div>

          <div className="branch-list">
            {branchLoading ? (
              <p>Đang tải chi nhánh...</p>
            ) : branches.length === 0 ? (
              <p>Chưa có dữ liệu chi nhánh.</p>
            ) : (
              branches.map((branch, index) => (
                <div className="branch-item" key={branch.branchId || branch.id || index}>
                  <div className="branch-thumb">🏢</div>

                  <div className="branch-info">
                    <strong>{branch.branchName || branch.name || "N/A"}</strong>
                    <p>{branch.address || "N/A"}</p>
                  </div>

                  <div className="branch-meta">
                    <span
                      className={
                        branch.status === "active"
                          ? "status-pill success"
                          : "status-pill danger"
                      }
                    >
                      {branch.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </span>

                    <small>Sức chứa: {branch.capacity || 0}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-grid bottom-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Đặt lịch mới nhất</h3>
            <a href="/admin/bookings">Xem tất cả</a>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Khách hàng</th>
                <th>Chi nhánh</th>
                <th>Dịch vụ</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {bookingLoading ? (
                <tr>
                  <td colSpan="7">Đang tải dữ liệu đặt lịch...</td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7">Chưa có dữ liệu đặt lịch.</td>
                </tr>
              ) : (
                bookings.slice(0, 5).map((booking, index) => (
                  <tr key={booking.bookingId || booking.id || index}>
                    <td>{index + 1}</td>
                    <td>{booking.customerName || booking.customer?.fullName || booking.customer || "N/A"}</td>
                    <td>{booking.branchName || booking.branch?.branchName || booking.branch || "N/A"}</td>
                    <td>{booking.serviceName || booking.service?.serviceName || booking.service || "N/A"}</td>
                    <td>{booking.bookingDate || booking.startTime || booking.time || "N/A"}</td>
                    <td>
                      <span
                        className={
                          booking.status === "confirmed" || booking.status === "Đã xác nhận"
                            ? "table-status success"
                            : booking.status === "cancelled" || booking.status === "Đã hủy"
                              ? "table-status danger"
                              : "table-status warning"
                        }
                      >
                        {booking.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <button className="view-btn">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Nhật ký hệ thống mới nhất</h3>
            <a href="/admin/audit-logs">Xem tất cả</a>
          </div>

          <div className="log-list">
            {auditLogs.length === 0 ? (
              <p>Chưa có nhật ký hệ thống.</p>
            ) : (
              auditLogs.map((log, index) => (
                <div className="log-item" key={log.id || index}>
                  <div className="log-icon blue">📋</div>
                  <p>{log.action || log.details || "Không có mô tả"}</p>
                  <span>{log.performedBy || ""}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}