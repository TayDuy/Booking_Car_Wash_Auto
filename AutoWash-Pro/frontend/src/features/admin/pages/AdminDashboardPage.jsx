import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import bookingApi from "../../../api/bookingApi";
import paymentApi from "../../../api/paymentApi";
import { getBranches } from "../../../api/branchService";

import {
  CalendarCheck,
  Building2,
  CircleCheckBig,
  Banknote,
  Eye,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";

import "./AdminDashboardPage.css";

function unwrapList(response) {
  const root = response?.data;
  const result = root?.data ?? root;

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.content)) {
    return result.content;
  }

  return [];
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) return "N/A";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPaymentDate(payment) {
  return (
    parseDate(payment.paidAt) ||
    parseDate(payment.updatedAt) ||
    parseDate(payment.createdAt)
  );
}

function getBookingDate(booking) {
  if (booking.slotDate) {
    const time = booking.slotStartTime || "00:00:00";
    return parseDate(`${booking.slotDate}T${time}`);
  }

  return (
    parseDate(booking.startTime) ||
    parseDate(booking.bookingDate) ||
    parseDate(booking.createdAt)
  );
}

function formatBookingDate(booking) {
  const date = getBookingDate(booking);

  if (!date) return "N/A";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getServiceNames(booking) {
  if (Array.isArray(booking.serviceNames)) {
    return booking.serviceNames.join(", ");
  }

  if (booking.serviceNames) {
    return booking.serviceNames;
  }

  if (booking.serviceName) {
    return booking.serviceName;
  }

  if (Array.isArray(booking.details)) {
    const names = booking.details
      .map(
        (detail) =>
          detail.serviceName ||
          detail.service?.serviceName
      )
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(", ");
    }
  }

  return "N/A";
}

function getStatusLabel(status) {
  switch (normalizeValue(status)) {
    case "pending":
      return "Chờ xác nhận";

    case "confirmed":
      return "Đã xác nhận";

    case "checked_in":
      return "Đã tiếp nhận";

    case "in_progress":
      return "Đang thực hiện";

    case "completed":
      return "Hoàn thành";

    case "cancelled":
      return "Đã hủy";

    case "no_show":
      return "Khách không đến";

    default:
      return status || "N/A";
  }
}

function getStatusClass(status) {
  switch (normalizeValue(status)) {
    case "confirmed":
    case "completed":
    case "paid":
      return "success";

    case "checked_in":
    case "in_progress":
      return "info";

    case "cancelled":
    case "no_show":
    case "failed":
      return "danger";

    default:
      return "warning";
  }
}

function getPaymentStatusLabel(status) {
  switch (normalizeValue(status)) {
    case "paid":
      return "Đã thanh toán";

    case "unpaid":
      return "Chưa thanh toán";

    case "failed":
      return "Thất bại";

    case "cancelled":
      return "Đã hủy";

    default:
      return status || "N/A";
  }
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayText = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      try {
        const [
          bookingResponse,
          branchResponse,
          paymentResponse,
        ] = await Promise.all([
          bookingApi.adminList(),
          getBranches(),
          paymentApi.list(),
        ]);

        const bookingList = unwrapList(bookingResponse);
        const branchList = unwrapList(branchResponse);
        const paymentList = unwrapList(paymentResponse);

        setBookings(bookingList);
        setBranches(branchList);
        setPayments(paymentList);

        console.log("ADMIN DASHBOARD DATA:", {
          bookings: bookingList,
          branches: branchList,
          payments: paymentList,
        });
      } catch (error) {
        console.error("Load admin dashboard failed:", error);

        setBookings([]);
        setBranches([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const completedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          normalizeValue(booking.status) === "completed"
      ).length,
    [bookings]
  );

  const activeBranches = useMemo(
    () =>
      branches.filter(
        (branch) =>
          normalizeValue(branch.status) === "active"
      ).length,
    [branches]
  );

  const totalRevenue = useMemo(
    () =>
      payments
        .filter(
          (payment) =>
            normalizeValue(payment.paymentStatus) === "paid"
        )
        .reduce(
          (total, payment) =>
            total + Number(payment.finalAmount || 0),
          0
        ),
    [payments]
  );

  const latestBookings = useMemo(
    () => bookings.slice(0, 5),
    [bookings]
  );

  const latestPayments = useMemo(() => {
    return [...payments]
      .sort((first, second) => {
        const firstTime =
          getPaymentDate(first)?.getTime() || 0;

        const secondTime =
          getPaymentDate(second)?.getTime() || 0;

        return secondTime - firstTime;
      })
      .slice(0, 5);
  }, [payments]);

  const revenueDays = useMemo(() => {
    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      days.push({
        key: getLocalDateKey(date),
        label: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        value: 0,
      });
    }

    const dayMap = new Map(
      days.map((day) => [day.key, day])
    );

    payments.forEach((payment) => {
      if (
        normalizeValue(payment.paymentStatus) !== "paid"
      ) {
        return;
      }

      const paymentDate = getPaymentDate(payment);

      if (!paymentDate) return;

      const matchingDay = dayMap.get(
        getLocalDateKey(paymentDate)
      );

      if (matchingDay) {
        matchingDay.value += Number(
          payment.finalAmount || 0
        );
      }
    });

    return days;
  }, [payments]);

  const sevenDayRevenue = revenueDays.reduce(
    (total, day) => total + day.value,
    0
  );

  const maximumDailyRevenue = Math.max(
    ...revenueDays.map((day) => day.value),
    1
  );

  const kpis = [
    {
      title: "Tổng đặt lịch",
      value: loading ? "..." : bookings.length,
      change: "Tất cả booking trong hệ thống",
      icon: CalendarCheck,
      color: "blue",
    },
    {
      title: "Chi nhánh hoạt động",
      value: loading ? "..." : activeBranches,
      change: `${branches.length} chi nhánh trong hệ thống`,
      icon: Building2,
      color: "green",
    },
    {
      title: "Đơn hoàn thành",
      value: loading ? "..." : completedBookings,
      change: "Booking đã hoàn thành dịch vụ",
      icon: CircleCheckBig,
      color: "purple",
    },
    {
      title: "Tổng thực thu",
      value: loading
        ? "..."
        : `${formatMoney(totalRevenue)} đ`,
      change: "Từ giao dịch đã thanh toán",
      icon: Banknote,
      color: "orange",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Xin chào, Admin! 👋</h1>

          <p>
            Tổng quan hoạt động của hệ thống WashFlow Pro.
          </p>
        </div>

        <div className="date-filter">
          Hôm nay: {todayText}
        </div>
      </div>

      <section className="kpi-grid">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div className="kpi-card" key={item.title}>
              <div className={`kpi-icon ${item.color}`}>
                <Icon size={24} />
              </div>

              <div className="kpi-content">
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
            <div>
              <h3>Doanh thu 7 ngày gần nhất</h3>

              <small>
                Tổng: {formatMoney(sevenDayRevenue)} đ
              </small>
            </div>

            <Link to="/admin/payments">
              Xem thanh toán
            </Link>
          </div>

          <div className="revenue-chart">
            {revenueDays.map((day) => {
              const percentage =
                (day.value / maximumDailyRevenue) * 100;

              return (
                <div
                  className="revenue-column"
                  key={day.key}
                >
                  <div className="revenue-bar-area">
                    <span className="revenue-bar-value">
                      {formatMoney(day.value)} đ
                    </span>

                    <div
                      className="revenue-bar"
                      style={{
                        height:
                          day.value > 0
                            ? `${Math.max(percentage, 6)}%`
                            : "3px",
                      }}
                    />
                  </div>

                  <span className="revenue-day-label">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Tình trạng chi nhánh</h3>

            <Link to="/admin/branches">
              Xem tất cả
            </Link>
          </div>

          <div className="branch-list">
            {loading ? (
              <p>Đang tải chi nhánh...</p>
            ) : branches.length === 0 ? (
              <p>Chưa có dữ liệu chi nhánh.</p>
            ) : (
              branches.slice(0, 5).map((branch, index) => (
                <div
                  className="branch-item"
                  key={
                    branch.branchId ||
                    branch.id ||
                    index
                  }
                >
                  <div className="branch-thumb">🏢</div>

                  <div className="branch-info">
                    <strong>
                      {branch.branchName ||
                        branch.name ||
                        "N/A"}
                    </strong>

                    <p>{branch.address || "N/A"}</p>
                  </div>

                  <div className="branch-meta">
                    <span
                      className={`status-pill ${
                        normalizeValue(branch.status) ===
                        "active"
                          ? "success"
                          : "danger"
                      }`}
                    >
                      {normalizeValue(branch.status) ===
                      "active"
                        ? "Hoạt động"
                        : "Tạm dừng"}
                    </span>

                    <small>
                      Sức chứa: {branch.capacity || 0}
                    </small>
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

            <Link to="/admin/bookings">
              Xem tất cả
            </Link>
          </div>

          <div className="dashboard-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Khách hàng</th>
                  <th>Chi nhánh</th>
                  <th>Dịch vụ</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      Đang tải dữ liệu đặt lịch...
                    </td>
                  </tr>
                ) : latestBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      Chưa có dữ liệu đặt lịch.
                    </td>
                  </tr>
                ) : (
                  latestBookings.map((booking, index) => (
                    <tr
                      key={
                        booking.bookingId ||
                        booking.id ||
                        index
                      }
                    >
                      <td>{index + 1}</td>

                      <td>
                        {booking.customerName ||
                          booking.customer?.fullName ||
                          "N/A"}
                      </td>

                      <td>
                        {booking.branchName ||
                          booking.branch?.branchName ||
                          "N/A"}
                      </td>

                      <td className="dashboard-service-cell">
                        {getServiceNames(booking)}
                      </td>

                      <td>
                        {formatBookingDate(booking)}
                      </td>

                      <td>
                        <span
                          className={`table-status ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="view-btn"
                          title="Mở trang quản lý đặt lịch"
                          onClick={() =>
                            navigate("/admin/bookings")
                          }
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Thanh toán mới nhất</h3>

            <Link to="/admin/payments">
              Xem tất cả
            </Link>
          </div>

          <div className="recent-payment-list">
            {loading ? (
              <p>Đang tải thanh toán...</p>
            ) : latestPayments.length === 0 ? (
              <p>Chưa có dữ liệu thanh toán.</p>
            ) : (
              latestPayments.map((payment) => (
                <div
                  className="recent-payment-item"
                  key={payment.paymentId}
                >
                  <div className="recent-payment-icon">
                    <CreditCard size={18} />
                  </div>

                  <div className="recent-payment-info">
                    <strong>
                      {payment.bookingCode ||
                        `PAY-${payment.paymentId}`}
                    </strong>

                    <span>
                      {formatDateTime(
                        payment.paidAt ||
                          payment.createdAt
                      )}
                    </span>
                  </div>

                  <div className="recent-payment-meta">
                    <strong>
                      {formatMoney(payment.finalAmount)} đ
                    </strong>

                    <span
                      className={`table-status ${getStatusClass(
                        payment.paymentStatus
                      )}`}
                    >
                      {getPaymentStatusLabel(
                        payment.paymentStatus
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}