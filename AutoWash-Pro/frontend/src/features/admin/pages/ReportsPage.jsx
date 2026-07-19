import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  DollarSign,
  Download,
  Filter,
  RotateCcw,
  Users,
} from "lucide-react";
import reportApi from "../../../api/reportApi";
import * as XLSX from "xlsx";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import "./ReportsPage.css";

export default function ReportsPage() {
  const { showMessage } = useAppDialog();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports("", "");
  }, []);

  async function loadReports(
    selectedFromDate = appliedFromDate,
    selectedToDate = appliedToDate
  ) {
    setLoading(true);

    try {
      const response = await reportApi.dashboard(
        selectedFromDate,
        selectedToDate
      );

      setReportData(
        response.data?.data ||
        response.data
      );
    } catch (error) {
      console.error(
        "Load reports failed:",
        error
      );

      setReportData(null);

      await showMessage({
        title: "Tải báo cáo thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được dữ liệu báo cáo.",
        variant: "error",
      });
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
    confirmedBookings: 0,
    checkedInBookings: 0,
    inProgressBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    totalCustomers: 0,
    totalBranches: 0,
    totalServices: 0,
    revenue: 0,
  };

  const statusRows = [
    {
      label: "Đang chờ xác nhận",
      value: data.pendingBookings,
    },
    {
      label: "Đã xác nhận",
      value: data.confirmedBookings,
    },
    {
      label: "Đã check-in",
      value: data.checkedInBookings,
    },
    {
      label: "Đang thực hiện",
      value: data.inProgressBookings,
    },
    {
      label: "Hoàn thành",
      value: data.completedBookings,
    },
    {
      label: "Đã hủy",
      value: data.cancelledBookings,
    },
    {
      label: "Không đến",
      value: data.noShowBookings,
    },
  ];

  const maxStatus = Math.max(...statusRows.map((x) => x.value), 1);
  async function handleApplyFilter() {
    if (!fromDate && !toDate) {
      setAppliedFromDate("");
      setAppliedToDate("");
      await loadReports("", "");
      return;
    }

    if (!fromDate || !toDate) {
      await showMessage({
        title: "Thiếu khoảng thời gian",
        message:
          "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.",
        variant: "warning",
      });
      return;
    }

    if (fromDate > toDate) {
      await showMessage({
        title: "Khoảng thời gian không hợp lệ",
        message:
          "Ngày bắt đầu không được sau ngày kết thúc.",
        variant: "warning",
      });
      return;
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);

    await loadReports(fromDate, toDate);
  }

  async function handleResetFilter() {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");

    await loadReports("", "");
  }
  async function handleExportReport() {
    try {
      const periodText =
        appliedFromDate && appliedToDate
          ? `${appliedFromDate} đến ${appliedToDate}`
          : "Toàn thời gian";

      const overviewRows = [
        ["BÁO CÁO TỔNG QUAN WASHFLOW PRO"],
        ["Khoảng thời gian", periodText],
        [
          "Ngày xuất",
          new Date().toLocaleString("vi-VN"),
        ],
        [],
        ["Chỉ số", "Giá trị"],
        ["Tổng đặt lịch", Number(data.totalBookings || 0)],
        [
          "Đang chờ xác nhận",
          Number(data.pendingBookings || 0),
        ],
        [
          "Đã xác nhận",
          Number(data.confirmedBookings || 0),
        ],
        [
          "Đã check-in",
          Number(data.checkedInBookings || 0),
        ],
        [
          "Đang thực hiện",
          Number(data.inProgressBookings || 0),
        ],
        [
          "Hoàn thành",
          Number(data.completedBookings || 0),
        ],
        [
          "Đã hủy",
          Number(data.cancelledBookings || 0),
        ],
        [
          "Không đến",
          Number(data.noShowBookings || 0),
        ],
        ["Khách hàng", Number(data.totalCustomers || 0)],
        ["Chi nhánh", Number(data.totalBranches || 0)],
        ["Dịch vụ", Number(data.totalServices || 0)],
        ["Doanh thu", Number(data.revenue || 0)],
      ];

      const bookingStatusRows = [
        ["TRẠNG THÁI ĐẶT LỊCH"],
        ["Khoảng thời gian", periodText],
        [],
        ["Trạng thái", "Số lượng"],
        [
          "Đang chờ xác nhận",
          Number(data.pendingBookings || 0),
        ],
        [
          "Đã xác nhận",
          Number(data.confirmedBookings || 0),
        ],
        [
          "Đã check-in",
          Number(data.checkedInBookings || 0),
        ],
        [
          "Đang thực hiện",
          Number(data.inProgressBookings || 0),
        ],
        [
          "Hoàn thành",
          Number(data.completedBookings || 0),
        ],
        [
          "Đã hủy",
          Number(data.cancelledBookings || 0),
        ],
        [
          "Không đến",
          Number(data.noShowBookings || 0),
        ],
      ];

      const overviewSheet =
        XLSX.utils.aoa_to_sheet(overviewRows);

      const bookingStatusSheet =
        XLSX.utils.aoa_to_sheet(
          bookingStatusRows
        );

      overviewSheet["!cols"] = [
        { wch: 30 },
        { wch: 24 },
      ];

      bookingStatusSheet["!cols"] = [
        { wch: 24 },
        { wch: 16 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        overviewSheet,
        "Tổng quan"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        bookingStatusSheet,
        "Trạng thái booking"
      );

      const fileDate =
        new Date()
          .toISOString()
          .slice(0, 10);

      const rangeSuffix =
        appliedFromDate && appliedToDate
          ? `_${appliedFromDate}_${appliedToDate}`
          : "";

      XLSX.writeFile(
        workbook,
        `bao-cao-washflow${rangeSuffix}_${fileDate}.xlsx`
      );
    } catch (error) {
      console.error(
        "Export report failed:",
        error
      );

      await showMessage({
        title: "Xuất báo cáo thất bại",
        message:
          "Không thể tạo file báo cáo Excel.",
        variant: "error",
      });
    }
  }
  return (
    <div className="reports-page">
      <div className="manage-header">
        <div>
          <h1>Báo cáo</h1>
          <p>
            Tổng hợp số liệu đặt lịch, khách hàng,
            chi nhánh và dịch vụ.
          </p>
        </div>

        <div className="report-header-actions">
          <button
            type="button"
            className="report-export-btn"
            onClick={handleExportReport}
            disabled={loading}
          >
            <Download size={18} />
            Xuất Excel
          </button>

          <button
            type="button"
            className="refresh-btn"
            onClick={() =>
              loadReports(
                appliedFromDate,
                appliedToDate
              )
            }
            disabled={loading}
          >
            Làm mới
          </button>
        </div>
      </div>

      <div className="report-filter-card">
        <div className="report-filter-heading">
          <div>
            <Filter size={20} />
            <strong>Bộ lọc thời gian</strong>
          </div>

          {appliedFromDate && appliedToDate && (
            <span>
              Đang xem: {appliedFromDate} đến{" "}
              {appliedToDate}
            </span>
          )}
        </div>

        <div className="report-filter-controls">
          <label className="report-date-field">
            <span>Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
            />
          </label>

          <label className="report-date-field">
            <span>Đến ngày</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) =>
                setToDate(event.target.value)
              }
            />
          </label>

          <button
            type="button"
            className="report-apply-btn"
            onClick={handleApplyFilter}
            disabled={loading}
          >
            <Filter size={17} />
            Áp dụng
          </button>

          <button
            type="button"
            className="report-reset-btn"
            onClick={handleResetFilter}
            disabled={loading}
          >
            <RotateCcw size={17} />
            Xóa lọc
          </button>
        </div>
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
                {statusRows.map((row) => (
                  <div key={`summary-${row.label}`}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}