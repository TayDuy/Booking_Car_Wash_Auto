import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  PlayCircle,
  Plus,
  RefreshCw,
  UserRound,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import employeeApi from "../../../api/employeeApi";
import BookingStatusBadge from "../components/BookingStatusBadge";

import "./EmployeeDashboardPage.css";

function getTodayValue() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getErrorMessage(error) {
  return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Không thể tải dữ liệu Dashboard."
  );
}

function formatTime(time) {
  if (!time) {
    return "--:--";
  }

  return String(time).slice(0, 5);
}

function formatRole(role) {
  const roleLabels = {
    washer: "Nhân viên rửa xe",
    supervisor: "Giám sát",
    manager: "Quản lý chi nhánh",
  };

  const normalizedRole = String(role ?? "").toLowerCase();

  return roleLabels[normalizedRole] || role || "Nhân viên";
}

function EmployeeDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [noShowCount, setNoShowCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const today = getTodayValue();

  const loadDashboard = useCallback(async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        profileResponse,
        queueResponse,
        completedResponse,
        noShowResponse,
      ] = await Promise.all([
        employeeApi.getProfile(),
        employeeApi.getQueue({
          date: today,
        }),
        employeeApi.getQueue({
          date: today,
          status: "completed",
        }),
        employeeApi.getQueue({
          date: today,
          status: "no_show",
        }),
      ]);

      const profileData = unwrapResponse(profileResponse);
      const queueData = unwrapResponse(queueResponse);
      const completedData = unwrapResponse(completedResponse);
      const noShowData = unwrapResponse(noShowResponse);

      setProfile(profileData ?? null);
      setBookings(Array.isArray(queueData) ? queueData : []);
      setCompletedCount(
          Array.isArray(completedData) ? completedData.length : 0
      );
      setNoShowCount(
          Array.isArray(noShowData) ? noShowData.length : 0
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDashboard]);

  const summary = useMemo(() => {
    return {
      total: bookings.length,

      pending: bookings.filter(
          (booking) => String(booking.status).toLowerCase() === "pending"
      ).length,

      confirmed: bookings.filter(
          (booking) => String(booking.status).toLowerCase() === "confirmed"
      ).length,

      checkedIn: bookings.filter(
          (booking) => String(booking.status).toLowerCase() === "checked_in"
      ).length,

      inProgress: bookings.filter(
          (booking) => String(booking.status).toLowerCase() === "in_progress"
      ).length,

      completed: completedCount,
      noShow: noShowCount,
    };
  }, [bookings, completedCount, noShowCount]);

  const recentBookings = useMemo(() => {
    return [...bookings]
        .sort((firstBooking, secondBooking) => {
          const firstTime =
              firstBooking.slotStartTime || "00:00:00";

          const secondTime =
              secondBooking.slotStartTime || "00:00:00";

          return firstTime.localeCompare(secondTime);
        })
        .slice(0, 5);
  }, [bookings]);

  if (loading) {
    return (
        <section className="employee-dashboard-page">
          <div className="employee-dashboard-page__loading">
            <div className="employee-dashboard-page__spinner" />
            <p>Đang tải Dashboard...</p>
          </div>
        </section>
    );
  }

  return (
      <section className="employee-dashboard-page">
        <header className="employee-dashboard-page__header">
          <div>
            <p className="employee-dashboard-page__eyebrow">
              Employee Dashboard
            </p>

            <h1>
              Xin chào, {profile?.fullName || "nhân viên"}
            </h1>

            <p>
              Theo dõi tình hình vận hành tại chi nhánh trong ngày.
            </p>
          </div>

          <button
              type="button"
              className="employee-dashboard-page__refresh"
              onClick={() => {
                void loadDashboard(true);
              }}
              disabled={refreshing}
          >
            <RefreshCw
                size={18}
                className={refreshing ? "is-spinning" : ""}
                aria-hidden="true"
            />

            {refreshing ? "Đang tải..." : "Tải lại"}
          </button>
        </header>

        {error && (
            <div
                className="employee-dashboard-page__error"
                role="alert"
            >
              {error}
            </div>
        )}

        <section className="employee-dashboard-profile">
          <div className="employee-dashboard-profile__avatar">
            <UserRound size={30} aria-hidden="true" />
          </div>

          <div className="employee-dashboard-profile__identity">
            <span>Nhân viên đang đăng nhập</span>

            <h2>{profile?.fullName || "Chưa xác định"}</h2>

            <p>
              {formatRole(profile?.role)} ·{" "}
              {profile?.position || "staff"}
            </p>
          </div>

          <div className="employee-dashboard-profile__branch">
            <Building2 size={22} aria-hidden="true" />

            <div>
              <span>Chi nhánh làm việc</span>

              <strong>
                {profile?.branchName || "Chưa được phân chi nhánh"}
              </strong>

              <small>
                {profile?.branchAddress || "Chưa có địa chỉ"}
              </small>
            </div>
          </div>
        </section>

        <section className="employee-dashboard-summary">
          <article className="employee-dashboard-summary__card">
            <div className="employee-dashboard-summary__icon total">
              <ClipboardList size={22} aria-hidden="true" />
            </div>

            <div>
              <span>Tổng hàng đợi</span>
              <strong>{summary.total}</strong>
              <small>booking đang xử lý</small>
            </div>
          </article>

          <article className="employee-dashboard-summary__card">
            <div className="employee-dashboard-summary__icon completed">
              <CheckCircle2 size={22} aria-hidden="true" />
            </div>

            <div>
              <span>Hoàn thành hôm nay</span>
              <strong>{summary.completed}</strong>
              <small>đã rửa và cộng điểm</small>
            </div>
          </article>

          <article className="employee-dashboard-summary__card">
            <div className="employee-dashboard-summary__icon no-show">
              <UserX size={22} aria-hidden="true" />
            </div>

            <div>
              <span>Khách không đến</span>
              <strong>{summary.noShow}</strong>
              <small>booking no-show hôm nay</small>
            </div>
          </article>

          <article className="employee-dashboard-summary__card">
            <div className="employee-dashboard-summary__icon pending">
              <Clock3 size={22} aria-hidden="true" />
            </div>

            <div>
              <span>Chờ xác nhận</span>
              <strong>{summary.pending}</strong>
              <small>booking pending</small>
            </div>
          </article>

          <article className="employee-dashboard-summary__card">
            <div className="employee-dashboard-summary__icon confirmed">
              <CheckCircle2 size={22} aria-hidden="true" />
            </div>

            <div>
              <span>Đã xác nhận</span>
              <strong>{summary.confirmed}</strong>
              <small>chờ khách check-in</small>
            </div>
          </article>

          <article className="employee-dashboard-summary__card">
            <div className="employee-dashboard-summary__icon checked-in">
              <UserRound size={22} aria-hidden="true" />
            </div>

            <div>
              <span>Đã check-in</span>
              <strong>{summary.checkedIn}</strong>
              <small>chờ bắt đầu rửa</small>
            </div>
          </article>

          <article className="employee-dashboard-summary__card">
            <div className="employee-dashboard-summary__icon progress">
              <PlayCircle size={22} aria-hidden="true" />
            </div>

            <div>
              <span>Đang rửa</span>
              <strong>{summary.inProgress}</strong>
              <small>booking in progress</small>
            </div>
          </article>
        </section>

        <section className="employee-dashboard-actions">
          <Link
              to="/employee/queue"
              className="employee-dashboard-action"
          >
            <ClipboardList size={24} aria-hidden="true" />

            <div>
              <strong>Mở hàng đợi</strong>
              <span>
              Xác nhận, check-in và cập nhật booking
            </span>
            </div>

            <ArrowRight size={20} aria-hidden="true" />
          </Link>

          <Link
              to="/employee/bookings/new"
              className="employee-dashboard-action"
          >
            <Plus size={24} aria-hidden="true" />

            <div>
              <strong>Tạo booking tại quầy</strong>
              <span>
              Tạo lịch cho khách đến trực tiếp
            </span>
            </div>

            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </section>

        <section className="employee-dashboard-recent">
          <div className="employee-dashboard-recent__header">
            <div>
              <h2>Booking hôm nay</h2>
              <p>
                Hiển thị tối đa 5 booking đang xử lý gần nhất.
              </p>
            </div>

            <Link to="/employee/queue">
              Xem toàn bộ
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
              <div className="employee-dashboard-recent__empty">
                <ClipboardList size={38} aria-hidden="true" />

                <h3>Chưa có booking trong hàng đợi</h3>

                <p>
                  Các booking pending, confirmed, checked-in hoặc
                  đang rửa sẽ xuất hiện tại đây.
                </p>
              </div>
          ) : (
              <div className="employee-dashboard-recent__list">
                {recentBookings.map((booking) => (
                    <article
                        key={booking.bookingId}
                        className="employee-dashboard-booking-row"
                    >
                      <div className="employee-dashboard-booking-row__time">
                        <Clock3 size={17} aria-hidden="true" />

                        <strong>
                          {formatTime(booking.slotStartTime)}
                        </strong>
                      </div>

                      <div className="employee-dashboard-booking-row__main">
                        <strong>
                          {booking.licensePlate || "Chưa có biển số"}
                        </strong>

                        <span>
                    {booking.customerName || "Khách tại quầy"}
                  </span>
                      </div>

                      <div className="employee-dashboard-booking-row__service">
                        <span>Dịch vụ</span>

                        <strong>
                          {booking.serviceNames?.join(", ") ||
                              "Chưa có dịch vụ"}
                        </strong>
                      </div>

                      <div className="employee-dashboard-booking-row__bay">
                        <span>Bay</span>

                        <strong>
                          {booking.bayName || "Chưa phân bay"}
                        </strong>
                      </div>

                      <BookingStatusBadge status={booking.status} />
                    </article>
                ))}
              </div>
          )}
        </section>
      </section>
  );
}

export default EmployeeDashboardPage;