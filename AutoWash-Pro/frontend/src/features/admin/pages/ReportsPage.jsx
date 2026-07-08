import React, { useEffect, useState } from "react";
import { BarChart3, CalendarCheck, DollarSign, Users } from "lucide-react";
import reportApi from "../../../api/reportApi";
import "./ReportsPage.css";

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
  setLoading(true);

  try {
    const response = await reportApi.dashboard();
    setReportData(response.data);
  } catch (error) {
    console.error("Load reports failed:", error);
    setReportData(null);
  } finally {
    setLoading(false);
  }
}

  function money(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
  }

  
  const data = reportData || {
  totalBookings: 0,
  completedBookings: 0,
  pendingBookings: 0,
  cancelledBookings: 0,
  totalCustomers: 0,
  totalBranches: 0,
  totalServices: 0,
  revenue: 0,
};

const statusRows = [
  { label: "Hoàn thành", value: data.completedBookings },
  { label: "Đang chờ", value: data.pendingBookings },
  { label: "Đã hủy", value: data.cancelledBookings },
];

const maxStatus = Math.max(...statusRows.map((x) => x.value), 1);
  return (
    <div className="reports-page">
      <div className="manage-header">
        <div>
          <h1>Báo cáo</h1>
          <p>Tổng hợp số liệu đặt lịch, khách hàng, chi nhánh và dịch vụ.</p>
        </div>

        <button className="refresh-btn" onClick={loadReports}>
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="manage-card">
          <div className="empty-state">Đang tải báo cáo...</div>
        </div>
      ) : (
        <>
          <div className="report-stats">
            <div className="report-card">
              <div className="report-icon blue">
                <CalendarCheck size={24} />
              </div>
              <div>
                <p>Tổng đặt lịch</p>
                <h2>{data.totalBookings}</h2>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon green">
                <DollarSign size={24} />
              </div>
              <div>
                <p>Doanh thu tạm tính</p>
                <h2>{money(data.revenue)}</h2>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon purple">
                <Users size={24} />
              </div>
              <div>
                <p>Khách hàng</p>
                <h2>{data.totalCustomers}</h2>
              </div>
            </div>

            <div className="report-card">
              <div className="report-icon orange">
                <BarChart3 size={24} />
              </div>
              <div>
                <p>Đơn hoàn thành</p>
                <h2>{data.completedBookings}</h2>
              </div>
            </div>
          </div>

          <div className="report-grid">
            <div className="manage-card">
              <h2 className="report-title">Booking theo trạng thái</h2>

              <div className="bar-list">
                {statusRows.map((row) => (
                  <div className="bar-row" key={row.label}>
                    <div className="bar-label">
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(row.value / maxStatus) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="manage-card">
              <h2 className="report-title">Tổng quan hệ thống</h2>

              <div className="summary-list">
                <div>
                  <span>Chi nhánh</span>
                  <strong>{data.totalBranches}</strong>
                </div>
                <div>
                  <span>Dịch vụ</span>
                  <strong>{data.totalServices}</strong>
                </div>
                <div>
                  <span>Booking pending</span>
                  <strong>{data.pendingBookings}</strong>
                </div>
                <div>
                  <span>Booking cancelled</span>
                  <strong>{data.cancelledBookings}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}