import React, { useEffect, useState } from "react";
import bookingApi from "../../../api/bookingApi";
import { getBranches } from "../../../api/branchService";
import {
  CalendarCheck,
  DollarSign,
  Users,
  Car,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import "./AdminDashboardPage.css";

const logs = [
  { icon: "📅", text: "Admin Dashboard đã tải dữ liệu đặt lịch", time: "Vừa xong", type: "blue" },
  { icon: "🏢", text: "Admin Dashboard đã tải dữ liệu chi nhánh", time: "Vừa xong", type: "green" },
  { icon: "🛡️", text: "Nhật ký hệ thống sẽ hiển thị khi backend cung cấp API audit log", time: "System", type: "orange" },
];

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);

  const [branches, setBranches] = useState([]);
  const [branchLoading, setBranchLoading] = useState(true);

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
      change: "Dữ liệu từ hệ thống",
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
      change: "Booking completed",
      icon: Users,
      color: "purple",
    },
    {
      title: "Xe đã phục vụ",
      value: bookingLoading ? "..." : completedBookings,
      change: "Tạm tính theo đơn hoàn thành",
      icon: Car,
      color: "orange",
    },
  ];

  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await bookingApi.list();

        console.log("BOOKING API RESPONSE:", response.data);

        const result = response.data?.data || response.data || [];

        if (Array.isArray(result)) {
          setBookings(result);
        } else if (Array.isArray(result.content)) {
          setBookings(result.content);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error("Load bookings failed:", error);
        setBookings([]);
      } finally {
        setBookingLoading(false);
      }
    }

    async function loadBranches() {
      try {
        const response = await getBranches();

        console.log("BRANCH API RESPONSE:", response.data);

        const result = response.data?.data || response.data || [];

        if (Array.isArray(result)) {
          setBranches(result);
        } else if (Array.isArray(result.content)) {
          setBranches(result.content);
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error("Load branches failed:", error);
        setBranches([]);
      } finally {
        setBranchLoading(false);
      }
    }

    loadBookings();
    loadBranches();
  }, []);
  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Xin chào, Admin! 👋</h1>
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

          <div className="fake-chart">
            <div className="chart-line"></div>
            <div className="chart-point point-1"></div>
            <div className="chart-point point-2"></div>
            <div className="chart-point point-3"></div>
            <div className="chart-point point-4"></div>
            <div className="chart-tooltip">
              <strong>25.680.000 đ</strong>
              <span>09/06/2025</span>
            </div>
          </div>

          <div className="chart-labels">
            <span>03/06</span>
            <span>04/06</span>
            <span>05/06</span>
            <span>06/06</span>
            <span>07/06</span>
            <span>08/06</span>
            <span>09/06</span>
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
            <a href="/admin/logs">Xem tất cả</a>
          </div>

          <div className="log-list">
            {logs.map((log, index) => (
              <div className="log-item" key={index}>
                <div className={`log-icon ${log.type}`}>{log.icon}</div>
                <p>{log.text}</p>
                <span>{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}