import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import bookingApi from "../../../api/bookingApi";

const STATUS_MAP = {
  pending:     { label: "Chờ xử lý",    badge: "badge-pending" },
  confirmed:   { label: "Đã xác nhận",   badge: "badge-confirmed" },
  checked_in:  { label: "Đã check-in",  badge: "badge-checked_in" },
  in_progress: { label: "Đang thực hiện", badge: "badge-in_progress" },
  completed:   { label: "Hoàn thành",    badge: "badge-completed" },
  cancelled:   { label: "Đã hủy",       badge: "badge-cancelled" },
  no_show:     { label: "Vắng mặt",     badge: "badge-no_show" },
};

const fmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};
const fmtTime = (t) => (t ? t.substring(0, 5) : "");

function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    bookingApi.get(bookingId)
      .then((res) => {
        setBooking(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Không thể tải chi tiết booking.");
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: "72px 0" }}>
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <p>Đang tải chi tiết...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ padding: "72px 0" }}>
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <p style={{ color: "var(--color-error, #e53935)" }}>{error}</p>
          <Link to="/customer/history" className="primary-button" style={{ marginTop: "16px", display: "inline-block" }}>
            Quay lại lịch sử
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const statusConfig = STATUS_MAP[booking.status] || STATUS_MAP.pending;

  return (
    <div className="app-container" style={{ padding: "72px 0" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
        <Link to="/customer/history" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--color-primary, #003d9b)", textDecoration: "none",
          marginBottom: "24px", fontSize: "14px", fontWeight: 500,
        }}>
          ← Quay lại lịch sử
        </Link>

        <div className="card" style={{ padding: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                Booking #{booking.bookingCode || booking.bookingId}
              </h1>
              <p style={{ margin: "6px 0 0", color: "var(--color-text-muted, #666)", fontSize: "14px" }}>
                {booking.bookingDate ? fmtDateTime(booking.bookingDate) : ""}
              </p>
            </div>
            <span className={`bh-status-badge ${statusConfig.badge}`} style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
            }}>
              <span className="bh-status-dot" style={{
                width: "8px", height: "8px", borderRadius: "50%", display: "inline-block",
                background: "currentColor",
              }} />
              {statusConfig.label}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            <DetailItem label="Ngày hẹn" value={`${booking.slotDate ? fmtDate(booking.slotDate) : ""}${booking.slotStartTime ? ` — ${fmtTime(booking.slotStartTime)}` : ""}${booking.slotEndTime ? ` → ${fmtTime(booking.slotEndTime)}` : ""}`} />
            <DetailItem label="Chi nhánh" value={booking.branchName || "—"} />
            <DetailItem label="Biển số xe" value={booking.licensePlate || "—"} />
            <DetailItem label="Loại xe" value={booking.vehicleType || "—"} />
            <DetailItem label="Nhân viên phụ trách" value={booking.assignedStaffName || "Chưa phân công"} />
            <DetailItem label="Khách hàng" value={booking.customerName || "—"} />
            {booking.note && <DetailItem label="Ghi chú" value={booking.note} fullWidth />}
          </div>

          {booking.details && booking.details.length > 0 && (
            <>
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                Dịch vụ đã chọn
              </h3>
              <table style={{
                width: "100%", borderCollapse: "collapse", fontSize: "14px",
                border: "1px solid var(--color-border, #e0e0e0)", borderRadius: "8px",
                overflow: "hidden", marginBottom: "16px",
              }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover, #f5f5f5)", textAlign: "left" }}>
                    <th style={thStyle}>Dịch vụ</th>
                    <th style={thStyle}>Mô tả</th>
                    <th style={thStyle}>Thời gian</th>
                    <th style={thStyle}>SL</th>
                    <th style={thStyle}>Đơn giá</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.details.map((d) => (
                    <tr key={d.bookingDetailId} style={{ borderBottom: "1px solid var(--color-border, #eee)" }}>
                      <td style={tdStyle}>{d.serviceName}</td>
                      <td style={{ ...tdStyle, color: "var(--color-text-muted, #666)", maxWidth: "200px" }}>
                        {d.description || "—"}
                      </td>
                      <td style={tdStyle}>{d.durationMinutes ? `${d.durationMinutes} phút` : "—"}</td>
                      <td style={tdStyle}>{d.quantity}</td>
                      <td style={tdStyle}>{fmt.format(d.unitPrice || 0)}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmt.format(d.subTotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{
                display: "flex", justifyContent: "flex-end", alignItems: "center",
                gap: "8px", fontSize: "16px", fontWeight: 700, padding: "8px 0",
              }}>
                <span>Tổng cộng:</span>
                <span style={{ color: "var(--color-primary, #003d9b)", fontSize: "18px" }}>
                  {fmt.format(booking.totalAmount || 0)}
                </span>
              </div>
            </>
          )}

          {(() => {
            const isPaid = booking.status === "completed" || booking.paymentStatus?.toLowerCase() === "paid";
            const isTerminal = booking.status === "cancelled" || booking.status === "no_show";
            const canPay = !isPaid && !isTerminal;

            if (isPaid) {
              const payMethod = booking.status === "completed" ? "Tại tiệm" : (booking.paymentMethod || "Tiền mặt");
              return (
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-border, #eee)" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 18px", borderRadius: "8px",
                    background: "#e8f5e9", color: "#2e7d32",
                    fontWeight: 600, fontSize: "14px",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Đã thanh toán ({payMethod})
                  </span>
                </div>
              );
            }

            if (canPay) {
              return (
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-border, #eee)" }}>
                  <button onClick={() => navigate(`/customer/payment?bookingId=${booking.bookingId}`)} style={{
                    padding: "10px 24px", borderRadius: "8px", border: "none",
                    background: "var(--color-primary, #003d9b)", color: "#fff",
                    fontWeight: 600, cursor: "pointer", fontSize: "14px",
                  }}>
                    Tiến hành thanh toán
                  </button>
                </div>
              );
            }

            return null;
          })()}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, fullWidth }) {
  return (
    <div style={fullWidth ? { gridColumn: "1 / -1" } : {}}>
      <div style={{ fontSize: "12px", color: "var(--color-text-muted, #888)", marginBottom: "4px", fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

const thStyle = {
  padding: "10px 12px",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--color-text-muted, #555)",
  borderBottom: "1px solid var(--color-border, #e0e0e0)",
};

const tdStyle = {
  padding: "10px 12px",
  fontSize: "14px",
};

export default BookingDetailPage;
