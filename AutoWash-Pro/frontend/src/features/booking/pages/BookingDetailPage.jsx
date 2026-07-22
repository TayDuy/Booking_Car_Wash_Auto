import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import bookingApi from "../../../api/bookingApi";
import refundApi from "../../../api/refundApi";
import "./BookingHistory.css";

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
  const { showMessage } = useAppDialog();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Yêu cầu hoàn tiền (khách tự gửi, giống luồng ở trang Lịch sử đặt lịch) ──
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRefundSuccess, setShowRefundSuccess] = useState(false);
  const [refundForm, setRefundForm] = useState({
    reason: "",
    refundMethod: "bank_transfer",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundSent, setRefundSent] = useState(false);

  const [refundRecord, setRefundRecord] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    bookingApi.get(bookingId)
        .then((res) => {
          const bData = res.data;
          setBooking(bData);
          setError(null);

          refundApi.myRefunds().then((rRes) => {
            const refunds = rRes.data?.data ?? rRes.data ?? [];
            if (Array.isArray(refunds)) {
              const matched = refunds.find(
                (r) => r.bookingId === Number(bookingId) || (bData?.bookingCode && r.bookingCode === bData.bookingCode)
              );
              if (matched) {
                setRefundRecord(matched);
                setRefundSent(true);
              }
            }
          }).catch(() => {});
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

  // Điều kiện được yêu cầu hoàn tiền: đã thanh toán + CHƯA HOÀN THÀNH (chưa completed) + chưa gửi yêu cầu nào
  const canRequestRefund = booking.paymentStatus?.toLowerCase() === "paid" && booking.status !== "completed" && !refundSent;

  const openRefundModal = () => {
    setRefundForm({
      reason: "",
      refundMethod: "bank_transfer",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
    });
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    if (!refundForm.reason.trim()) {
      await showMessage({ title: "Thông báo", message: "Vui lòng nhập lý do hoàn tiền.", variant: "warning" });
      return;
    }
    if (
        refundForm.refundMethod === "bank_transfer" &&
        (!refundForm.bankName.trim() || !refundForm.bankAccountNumber.trim() || !refundForm.bankAccountName.trim())
    ) {
      await showMessage({ title: "Thông báo", message: "Vui lòng nhập đầy đủ thông tin ngân hàng.", variant: "warning" });
      return;
    }

    try {
      setSubmittingRefund(true);
      await refundApi.createMine({
        bookingId: booking.bookingId,
        reason: refundForm.reason.trim(),
        refundMethod: refundForm.refundMethod,
        bankName: refundForm.refundMethod === "bank_transfer" ? refundForm.bankName.trim() : null,
        bankAccountNumber: refundForm.refundMethod === "bank_transfer" ? refundForm.bankAccountNumber.trim() : null,
        bankAccountName: refundForm.refundMethod === "bank_transfer" ? refundForm.bankAccountName.trim() : null,
      });
      setRefundSent(true);
      setShowRefundModal(false);
      setShowRefundSuccess(true);
    } catch (err) {
      console.error("Lỗi gửi yêu cầu hoàn tiền:", err);
      await showMessage({ title: "Thông báo", message: err.response?.data?.message || "Gửi yêu cầu hoàn tiền không thành công. Vui lòng thử lại.", variant: "danger" });
    } finally {
      setSubmittingRefund(false);
    }
  };

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
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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

                {refundRecord ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                    ...(refundRecord.status === "completed" ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" } :
                       refundRecord.status === "approved" ? { background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd" } :
                       refundRecord.status === "rejected" ? { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" } :
                       { background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" })
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>currency_exchange</span>
                    {refundRecord.status === "completed" ? `Đã hoàn tiền (${fmt.format(refundRecord.amount || 0)})` :
                     refundRecord.status === "approved" ? "Đã duyệt · chờ chuyển tiền" :
                     refundRecord.status === "rejected" ? "Hoàn tiền bị từ chối" :
                     "Đang xử lý hoàn tiền"}
                  </span>
                ) : booking.paymentStatus?.toLowerCase() === "refunded" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                    background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0"
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>currency_exchange</span>
                    Đã hoàn tiền
                  </span>
                ) : null}
              </div>
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

                  {/* Bảng tổng kết tiền tính trực tiếp từ tổng các dòng dịch vụ (tableSubtotal) */}
                  {(() => {
                    const tableSubtotal = booking.details && booking.details.length > 0
                      ? booking.details.reduce((acc, d) => acc + (d.subTotal || ((d.unitPrice || 0) * (d.quantity || 1))), 0)
                      : (booking.totalAmount || 0);

                    const finalPaid = booking.finalAmount != null ? booking.finalAmount : (booking.totalAmount || tableSubtotal);
                    const effectiveDiscount = tableSubtotal > finalPaid
                      ? (tableSubtotal - finalPaid)
                      : (booking.discountAmount || 0);

                    return (
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-end",
                        gap: "6px", fontSize: "14px", padding: "16px 0 8px", borderTop: "1px solid #e2e8f0", marginTop: "12px"
                      }}>
                        {effectiveDiscount > 0 ? (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "280px", color: "#64748b" }}>
                              <span>Tạm tính dịch vụ:</span>
                              <span>{fmt.format(tableSubtotal)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "280px", color: "#16a34a", fontWeight: 600 }}>
                              <span>Giảm giá (Voucher):</span>
                              <span>-{fmt.format(effectiveDiscount)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "280px", fontSize: "16px", fontWeight: 700, marginTop: "4px", paddingTop: "6px", borderTop: "1px solid #e2e8f0" }}>
                              <span>Thành tiền thanh toán:</span>
                              <span style={{ color: "var(--color-primary, #003d9b)", fontSize: "18px" }}>
                                {fmt.format(finalPaid)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", width: "280px", fontSize: "16px", fontWeight: 700 }}>
                            <span>Tổng cộng thanh toán:</span>
                            <span style={{ color: "var(--color-primary, #003d9b)", fontSize: "18px" }}>
                              {fmt.format(finalPaid)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
            )}

            {(() => {
              const isPaid = booking.status === "completed" || booking.paymentStatus?.toLowerCase() === "paid" || booking.paymentStatus?.toLowerCase() === "refunded";
              const isCancelled = booking.status === "cancelled";
              const isTerminal = isCancelled || booking.status === "no_show";
              const canPay = !isPaid && !isTerminal;

              const payMethod = booking.paymentMethod === "bank_transfer" ? "Chuyển khoản (VNPAY)" : booking.paymentMethod === "paypal" ? "PayPal" : "Tại tiệm";

              return (
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-border, #eee)" }}>
                  {/* Nếu đã có yêu cầu hoàn tiền: CHỈ HIỂN THỊ HỘP HOÀN TIỀN DUY NHẤT (bỏ hộp thanh toán lặp lại bên dưới) */}
                  {refundRecord ? (
                    <div style={{
                      background: refundRecord.status === "completed" ? "#f0fdf4" : refundRecord.status === "rejected" ? "#fff5f5" : "#f8fafc",
                      borderRadius: "12px", padding: "20px", marginBottom: "16px",
                      border: `1px solid ${refundRecord.status === "completed" ? "#bbf7d0" : refundRecord.status === "rejected" ? "#fecaca" : "#e2e8f0"}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="material-symbols-outlined" style={{ color: "#003d9b" }}>currency_exchange</span>
                          Thông tin hoàn tiền (Yêu cầu #{refundRecord.refundId})
                        </span>
                        <span style={{
                          padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                          ...(refundRecord.status === "completed" ? { background: "#dcfce7", color: "#15803d" } :
                             refundRecord.status === "approved" ? { background: "#bae6fd", color: "#0369a1" } :
                             refundRecord.status === "rejected" ? { background: "#fee2e2", color: "#b91c1c" } :
                             { background: "#fef3c7", color: "#b45309" })
                        }}>
                          {refundRecord.status === "completed" ? "Đã hoàn tiền" :
                           refundRecord.status === "approved" ? "Đã duyệt · chờ chuyển tiền" :
                           refundRecord.status === "rejected" ? "Đã bị từ chối" :
                           "Đang xử lý"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
                        <div>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>Số tiền hoàn</span>
                          <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#003d9b", fontSize: "16px" }}>
                            {fmt.format(refundRecord.amount || booking.finalAmount || booking.totalAmount || 0)}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>Phương thức nhận tiền</span>
                          <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#334155" }}>
                            {refundRecord.refundMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" : "Tiền mặt tại tiệm"}
                          </p>
                        </div>
                        {refundRecord.reason && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <span style={{ color: "#64748b", fontSize: "13px" }}>Lý do bạn đã gửi</span>
                            <p style={{ margin: "4px 0 0", color: "#334155", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              {refundRecord.reason}
                            </p>
                          </div>
                        )}
                        {refundRecord.adminNote && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <span style={{ color: "#64748b", fontSize: "13px" }}>Ghi chú từ Admin</span>
                            <p style={{ margin: "4px 0 0", color: "#b91c1c", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                              {refundRecord.adminNote}
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Thời gian yêu cầu: {fmtDateTime(refundRecord.createdAt || refundRecord.requestedAt)}
                        </span>
                        <button
                          onClick={() => navigate("/customer/refunds")}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "8px 16px", borderRadius: "8px", border: "none",
                            background: "#003d9b", color: "#fff", fontWeight: 600,
                            fontSize: "13px", cursor: "pointer",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>open_in_new</span>
                          Theo dõi chi tiết tại Trang Hoàn Tiền →
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Nếu CHƯA có yêu cầu hoàn tiền thì mới hiển thị Hộp thanh toán ban đầu */
                    isPaid && (
                      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>Thông tin thanh toán</span>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "4px 12px", borderRadius: "20px",
                            background: booking.paymentStatus?.toLowerCase() === "refunded" ? "#f0fdf4" : "#e8f5e9",
                            color: booking.paymentStatus?.toLowerCase() === "refunded" ? "#16a34a" : "#2e7d32",
                            fontWeight: 600, fontSize: "13px",
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {booking.paymentStatus?.toLowerCase() === "refunded" ? "Đã hoàn tiền" : "Đã thanh toán"}
                          </span>
                        </div>

                        {booking.originalAmount && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "#64748b" }}>
                            <span>Tạm tính</span>
                            <span>{fmt.format(booking.originalAmount)}</span>
                          </div>
                        )}
                        {booking.discountAmount > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "#16a34a" }}>
                            <span>Giảm giá (Voucher)</span>
                            <span>-{fmt.format(booking.discountAmount)}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: "16px", fontWeight: 700, borderTop: "1px solid #e2e8f0", marginTop: "4px" }}>
                          <span>Thành tiền</span>
                          <span style={{ color: "#003d9b" }}>{fmt.format(booking.finalAmount || booking.totalAmount || 0)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                          <span>Phương thức</span>
                          <span>{payMethod}{booking.vnpayBankCode ? ` (${booking.vnpayBankCode})` : ""}</span>
                        </div>
                      </div>
                    )
                  )}

                  {/* Nút gửi yêu cầu hoàn tiền nếu chưa gửi */}
                  {canRequestRefund && !refundRecord && (
                    <button
                      className="bh-btn-refund"
                      onClick={openRefundModal}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        width: "100%", padding: "12px 24px", borderRadius: "8px",
                        border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626",
                        fontWeight: 600, cursor: "pointer", fontSize: "14px", marginBottom: "12px",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>currency_exchange</span>
                      Yêu cầu hoàn tiền
                    </button>
                  )}

                  {/* Link mở trang Customer Refunds */}
                  <p style={{ fontSize: "13px", color: "#64748b", textAlign: "center", margin: "12px 0 0" }}>
                    Quản lý danh sách các yêu cầu hoàn tiền tại{" "}
                    <Link to="/customer/refunds" style={{ color: "#003d9b", fontWeight: 600, textDecoration: "underline" }}>
                      Yêu cầu hoàn tiền của tôi →
                    </Link>
                  </p>

                  {/* Tiến hành thanh toán nếu chưa trả */}
                  {canPay && (
                    <button onClick={() => navigate(`/customer/payment?bookingId=${booking.bookingId}`)} style={{
                      padding: "10px 24px", borderRadius: "8px", border: "none",
                      background: "var(--color-primary, #003d9b)", color: "#fff",
                      fontWeight: 600, cursor: "pointer", fontSize: "14px", width: "100%", marginTop: "12px"
                    }}>
                      Tiến hành thanh toán
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {showRefundModal && (
            <div className="bh-modal-overlay" onClick={() => !submittingRefund && setShowRefundModal(false)}>
              <div className="bh-modal bh-refund-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bh-modal-head">
                  <div className="bh-modal-title">
                    <span className="material-symbols-outlined">currency_exchange</span>
                    Yêu cầu hoàn tiền
                  </div>
                  <button className="bh-modal-close" onClick={() => setShowRefundModal(false)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="bh-modal-body">
                  <div className="bh-refund-booking-info">
                    Lịch hẹn <strong>{booking.bookingCode || `#${booking.bookingId}`}</strong> · Số tiền hoàn:{" "}
                    <strong>{fmt.format(booking.finalAmount || booking.totalAmount || 0)}</strong>
                  </div>

                  <div className="bh-refund-field">
                    <label>Lý do hoàn tiền <span className="required">*</span></label>
                    <textarea
                        className="bh-refund-textarea"
                        rows={3}
                        maxLength={500}
                        placeholder="Ví dụ: Tôi phải hủy lịch vì lý do cá nhân, mong được hoàn lại tiền..."
                        value={refundForm.reason}
                        onChange={(e) => setRefundForm((prev) => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>

                  <div className="bh-refund-field">
                    <label>Phương thức hoàn tiền <span className="required">*</span></label>
                    <select
                        className="bh-refund-select"
                        value={refundForm.refundMethod}
                        onChange={(e) => setRefundForm((prev) => ({ ...prev, refundMethod: e.target.value }))}
                    >
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="cash">Tiền mặt tại chi nhánh</option>
                    </select>
                  </div>

                  {refundForm.refundMethod === "bank_transfer" && (
                      <>
                        <div className="bh-refund-field">
                          <label>Tên ngân hàng <span className="required">*</span></label>
                          <input
                              className="bh-refund-input"
                              type="text"
                              placeholder="Ví dụ: Vietcombank"
                              value={refundForm.bankName}
                              onChange={(e) => setRefundForm((prev) => ({ ...prev, bankName: e.target.value }))}
                          />
                        </div>
                        <div className="bh-refund-field">
                          <label>Số tài khoản <span className="required">*</span></label>
                          <input
                              className="bh-refund-input"
                              type="text"
                              placeholder="Số tài khoản ngân hàng"
                              value={refundForm.bankAccountNumber}
                              onChange={(e) => setRefundForm((prev) => ({ ...prev, bankAccountNumber: e.target.value }))}
                          />
                        </div>
                        <div className="bh-refund-field">
                          <label>Tên chủ tài khoản <span className="required">*</span></label>
                          <input
                              className="bh-refund-input"
                              type="text"
                              placeholder="Tên đúng như trên thẻ ngân hàng"
                              value={refundForm.bankAccountName}
                              onChange={(e) => setRefundForm((prev) => ({ ...prev, bankAccountName: e.target.value }))}
                          />
                        </div>
                      </>
                  )}

                  <div className="bh-cancel-btns">
                    <button className="bh-cancel-keep" onClick={() => setShowRefundModal(false)} disabled={submittingRefund}>
                      Hủy bỏ
                    </button>
                    <button className="bh-refund-confirm" onClick={handleRefundSubmit} disabled={submittingRefund}>
                      {submittingRefund ? "Đang gửi…" : "Gửi yêu cầu hoàn tiền"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {showRefundSuccess && (
            <div className="bh-modal-overlay" onClick={() => setShowRefundSuccess(false)}>
              <div className="bh-modal" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
                <div className="bh-modal-body" style={{ textAlign: "center", padding: "40px 32px" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: "#d1fae5", display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 20px",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#059669" }}>
                      check_circle
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 700 }}>
                    Đã gửi yêu cầu hoàn tiền thành công
                  </h3>
                  <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#64748b", lineHeight: "1.6" }}>
                    Bạn có thể theo dõi trạng thái tại mục "Yêu cầu hoàn tiền của tôi".
                  </p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button className="bh-cancel-keep" onClick={() => setShowRefundSuccess(false)}>
                      Đóng
                    </button>
                    <button className="bh-refund-confirm" onClick={() => navigate("/customer/refunds")}>
                      Xem yêu cầu của tôi
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
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