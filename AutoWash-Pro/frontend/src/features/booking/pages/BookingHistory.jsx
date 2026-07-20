import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import bookingApi from '../../../api/bookingApi';
import refundApi from '../../../api/refundApi';
import { getCustomerId } from '../../../api/authService';
import SiteHeader from '../../../components/layout/SiteHeader';

import './BookingHistory.css';

// ── Status config ────────────────────────────────────────────
const STATUS_MAP = {
  pending:     { label: 'Chờ xử lý',    badge: 'badge-pending' },
  confirmed:   { label: 'Đã xác nhận',   badge: 'badge-confirmed' },
  checked_in:  { label: 'Đã check-in',  badge: 'badge-checked_in' },
  in_progress: { label: 'Đang thực hiện', badge: 'badge-in_progress' },
  completed:   { label: 'Hoàn thành',    badge: 'badge-completed' },
  cancelled:   { label: 'Đã hủy',       badge: 'badge-cancelled' },
  no_show:     { label: 'Vắng mặt',     badge: 'badge-no_show' },
};

const PAYMENT_STATUS_MAP = {
  unpaid:    { label: 'Chưa thanh toán', badge: 'payment-badge-unpaid' },
  paid:      { label: 'Đã thanh toán',   badge: 'payment-badge-paid' },
  failed:    { label: 'Thanh toán lỗi',  badge: 'payment-badge-failed' },
  cancelled: { label: 'Hủy thanh toán',  badge: 'payment-badge-cancelled' },
};

const PAYMENT_METHOD_MAP = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  pos: 'Quẹt thẻ POS',
  paypal: 'PayPal',
  at_shop: 'Tại tiệm',
};

const FILTER_TABS = [
  { key: 'all',         label: 'Tất cả' },
  { key: 'pending',     label: 'Chờ xử lý' },
  { key: 'confirmed',   label: 'Đã xác nhận' },
  { key: 'checked_in',  label: 'Đã check-in' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'completed',   label: 'Hoàn thành' },
  { key: 'cancelled',   label: 'Đã hủy' },
];

const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (t) => (t ? t.substring(0, 5) : '');

export default function BookingHistory() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail modal
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Refund request modal (khách tự gửi yêu cầu hoàn tiền)
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundForm, setRefundForm] = useState({
    reason: '',
    refundMethod: 'original_payment_method',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundedBookingIds, setRefundedBookingIds] = useState([]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingApi.myBookings(getCustomerId());
      setBookings(res.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử đặt lịch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => ['confirmed','checked_in','in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

  const filtered = bookings.filter(b => {
    if (activeFilter !== 'all' && b.status !== activeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const code = (b.bookingCode || '').toLowerCase();
      const plate = (b.licensePlate || '').toLowerCase();
      const branch = (b.branchName || '').toLowerCase();
      if (!code.includes(q) && !plate.includes(q) && !branch.includes(q)) return false;
    }
    return true;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const filterCount = (key) => key === 'all'
      ? bookings.length
      : bookings.filter(b => b.status === key).length;

  const openDetail = async (bookingId) => {
    try {
      setDetailLoading(true);
      setDetailModal({});
      const res = await bookingApi.get(bookingId);
      setDetailModal(res.data);
    } catch (err) {
      console.error('Lỗi tải chi tiết:', err);
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      await bookingApi.cancel(cancelTarget.bookingId);
      setBookings(prev =>
          prev.map(b => b.bookingId === cancelTarget.bookingId ? { ...b, status: 'cancelled' } : b)
      );
      setCancelTarget(null);
    } catch (err) {
      console.error('Lỗi hủy lịch:', err);
      alert('Hủy lịch không thành công. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (status) => status === 'pending' || status === 'confirmed';

  // ── Refund request handler ─────────────────────────────────
  const canRequestRefund = (booking) => {
    const isPaid = booking.status === 'completed' || booking.paymentStatus?.toLowerCase() === 'paid';
    const eligibleStatus = booking.status === 'cancelled' || booking.status === 'completed';
    return isPaid && eligibleStatus && !refundedBookingIds.includes(booking.bookingId);
  };

  const openRefundModal = (booking) => {
    setRefundForm({
      reason: '',
      refundMethod: 'original_payment_method',
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: '',
    });
    setRefundTarget(booking);
  };

  const handleRefundSubmit = async () => {
    if (!refundTarget) return;
    if (!refundForm.reason.trim()) {
      alert('Vui lòng nhập lý do hoàn tiền.');
      return;
    }
    if (
        refundForm.refundMethod === 'bank_transfer' &&
        (!refundForm.bankName.trim() || !refundForm.bankAccountNumber.trim() || !refundForm.bankAccountName.trim())
    ) {
      alert('Vui lòng nhập đầy đủ thông tin ngân hàng.');
      return;
    }

    try {
      setSubmittingRefund(true);
      await refundApi.createMine({
        bookingId: refundTarget.bookingId,
        reason: refundForm.reason.trim(),
        refundMethod: refundForm.refundMethod,
        bankName: refundForm.refundMethod === 'bank_transfer' ? refundForm.bankName.trim() : null,
        bankAccountNumber: refundForm.refundMethod === 'bank_transfer' ? refundForm.bankAccountNumber.trim() : null,
        bankAccountName: refundForm.refundMethod === 'bank_transfer' ? refundForm.bankAccountName.trim() : null,
      });
      setRefundedBookingIds(prev => [...prev, refundTarget.bookingId]);
      setRefundTarget(null);
      alert('Đã gửi yêu cầu hoàn tiền thành công. Bạn có thể theo dõi trạng thái tại mục "Yêu cầu hoàn tiền của tôi".');
    } catch (err) {
      console.error('Lỗi gửi yêu cầu hoàn tiền:', err);
      alert(err.response?.data?.message || 'Gửi yêu cầu hoàn tiền không thành công. Vui lòng thử lại.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
      <div className="bh-page">

        <div className="bh-container">

          <div className="bh-page-header">
            <div className="bh-header-left">
              <button className="bh-back-btn" onClick={() => navigate(-1)}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="bh-page-title">Lịch Sử Đặt Lịch</h1>
                <p className="bh-page-subtitle">Theo dõi và quản lý tất cả lịch hẹn rửa xe của bạn</p>
              </div>
            </div>
            <div className="bh-header-badge-group">
              <Link to="/customer/refunds" className="bh-header-badge bh-header-badge-link">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>currency_exchange</span>
                Yêu cầu hoàn tiền của tôi
              </Link>
              <div className="bh-header-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                {stats.total} lịch hẹn
              </div>
            </div>
          </div>

          <div className="bh-toolbar">
            <div className="bh-search-box">
              <span className="bh-search-icon material-symbols-outlined">search</span>
              <input
                  className="bh-search-input"
                  type="text"
                  placeholder="Tìm theo mã đặt, biển số, chi nhánh…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bh-filter-tabs">
              {FILTER_TABS.map(tab => (
                  <button
                      key={tab.key}
                      className={`bh-filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveFilter(tab.key)}
                  >
                    {tab.label}
                    <span className="bh-filter-count">{filterCount(tab.key)}</span>
                  </button>
              ))}
            </div>
          </div>

          {loading ? (
              <div className="bh-skeleton">
                {[1, 2, 3, 4].map(i => <div key={i} className="bh-skeleton-card" />)}
              </div>
          ) : filtered.length === 0 ? (
              <div className="bh-empty-state">
                <div className="bh-empty-icon">🚗</div>
                <div className="bh-empty-title">
                  {searchTerm || activeFilter !== 'all'
                      ? 'Không tìm thấy lịch hẹn phù hợp'
                      : 'Chưa có lịch hẹn nào'}
                </div>
                <div className="bh-empty-desc">
                  {searchTerm || activeFilter !== 'all'
                      ? 'Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                      : 'Khi bạn đặt lịch rửa xe, tất cả sẽ hiển thị tại đây.'}
                </div>
              </div>
          ) : (
              <div className="bh-booking-list">
                {paginated.map((booking, idx) => {
                  const statusCfg = STATUS_MAP[booking.status] || STATUS_MAP.pending;
                  const isPaid = booking.status === 'completed' || booking.paymentStatus?.toLowerCase() === 'paid';
                  const paymentCfg = isPaid ? PAYMENT_STATUS_MAP.paid : (PAYMENT_STATUS_MAP[booking.paymentStatus?.toLowerCase()] || PAYMENT_STATUS_MAP.unpaid);
                  const payMethod = booking.status === 'completed' ? 'at_shop' : (booking.paymentMethod?.toLowerCase() || 'cash');
                  const paymentLabel = isPaid
                      ? `Đã thanh toán (${PAYMENT_METHOD_MAP[payMethod] || payMethod})`
                      : paymentCfg.label;
                  const dateStr = booking.slotDate ? fmtDate(booking.slotDate) : fmtDate(booking.bookingDate);
                  const timeStr = fmtTime(booking.slotStartTime);

                  return (
                      <div
                          className="bh-booking-card"
                          key={booking.bookingId}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className={`bh-card-stripe stripe-${booking.status}`} />

                        <div className="bh-card-body">
                          <div className="bh-card-primary">
                            <div className="bh-card-code">
                              {booking.bookingCode || `#${booking.bookingId}`}
                              <span className="bh-card-code-tag">BOOKING</span>
                            </div>
                            <div className="bh-card-datetime">
                              <span className="material-symbols-outlined">event</span>
                              {dateStr}
                              {timeStr && <> &middot; {timeStr}</>}
                            </div>
                          </div>

                          <div className="bh-card-meta">
                            <div className="bh-card-branch">
                              <span className="material-symbols-outlined">location_on</span>
                              {booking.branchName || 'AutoWash-Pro'}
                            </div>
                            {booking.licensePlate && (
                                <span className="bh-card-plate">
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>directions_car</span>
                                  {booking.vehicleNickname
                                      ? <>{booking.vehicleNickname} <span style={{ opacity: 0.6 }}>({booking.licensePlate})</span></>
                                      : booking.licensePlate}
                        </span>
                            )}
                          </div>

                          <div className="bh-card-status-amount">
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <div className={`bh-status-badge ${statusCfg.badge}`}>
                                <span className="bh-status-dot" />
                                {statusCfg.label}
                              </div>
                              <div className={`bh-status-badge ${paymentCfg.badge}`}>
                                <span className="bh-status-dot" />
                                {paymentLabel}
                              </div>
                            </div>
                            <div className="bh-card-amount">{fmt.format(booking.finalAmount || booking.totalAmount || 0)}</div>
                          </div>
                        </div>

                        <div className="bh-card-actions">
                          <button className="bh-btn-detail" onClick={() => openDetail(booking.bookingId)}>
                            <span className="material-symbols-outlined">visibility</span>
                            Chi tiết
                          </button>
                          {canCancel(booking.status) && (
                              <button className="bh-btn-cancel" onClick={() => setCancelTarget(booking)}>
                                <span className="material-symbols-outlined">close</span>
                                Hủy lịch
                              </button>
                          )}
                          {canRequestRefund(booking) && (
                              <button className="bh-btn-refund" onClick={() => openRefundModal(booking)}>
                                <span className="material-symbols-outlined">currency_exchange</span>
                                Yêu cầu hoàn tiền
                              </button>
                          )}
                          {refundedBookingIds.includes(booking.bookingId) && (
                              <span className="bh-refund-sent-tag">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                                Đã gửi yêu cầu hoàn tiền
                              </span>
                          )}
                        </div>
                      </div>
                  );
                })}

                {totalPages > 1 && (
                    <div className="bh-pagination">
                      <button
                          className="bh-page-btn"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                        Trang trước
                      </button>
                      <div className="bh-page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`bh-page-num ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                        ))}
                      </div>
                      <button
                          className="bh-page-btn"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                      >
                        Trang sau
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                )}
              </div>
          )}
        </div>

        {detailModal && (
            <div className="bh-modal-overlay" onClick={() => !detailLoading && setDetailModal(null)}>
              <div className="bh-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bh-modal-head">
                  <div className="bh-modal-title">
                    <span className="material-symbols-outlined">receipt_long</span>
                    Chi tiết lịch hẹn
                  </div>
                  <button className="bh-modal-close" onClick={() => setDetailModal(null)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="bh-modal-body">
                  {detailLoading ? (
                      <div className="bh-detail-loading">
                        <div className="bh-detail-spinner" />
                        Đang tải chi tiết…
                      </div>
                  ) : (
                      <>
                        <div className="bh-detail-grid">
                          <div className="bh-detail-item">
                            <div className="bh-detail-label">Mã đặt lịch</div>
                            <div className="bh-detail-value">{detailModal.bookingCode || `#${detailModal.bookingId}`}</div>
                          </div>
                          <div className="bh-detail-item">
                            <div className="bh-detail-label">Trạng thái</div>
                            <div className="bh-detail-value">
                              <span className={`bh-status-badge ${(STATUS_MAP[detailModal.status] || STATUS_MAP.pending).badge}`}>
                                <span className="bh-status-dot" />
                                {(STATUS_MAP[detailModal.status] || STATUS_MAP.pending).label}
                              </span>
                            </div>
                          </div>
                          <div className="bh-detail-item">
                            <div className="bh-detail-label">Thanh toán</div>
                            <div className="bh-detail-value">
                              {(() => {
                                const isPaid = detailModal.status === 'completed' || detailModal.paymentStatus?.toLowerCase() === 'paid';
                                const pmCfg = isPaid ? PAYMENT_STATUS_MAP.paid : (PAYMENT_STATUS_MAP[detailModal.paymentStatus?.toLowerCase()] || PAYMENT_STATUS_MAP.unpaid);
                                const payMethod = detailModal.status === 'completed' ? 'at_shop' : (detailModal.paymentMethod?.toLowerCase() || 'cash');
                                const pmLabel = isPaid
                                    ? `Đã thanh toán (${PAYMENT_METHOD_MAP[payMethod] || payMethod})`
                                    : pmCfg.label;
                                return (
                                    <span className={`bh-status-badge ${pmCfg.badge}`}>
                                    <span className="bh-status-dot" />
                                      {pmLabel}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="bh-detail-item">
                            <div className="bh-detail-label">Ngày hẹn</div>
                            <div className="bh-detail-value">
                              {detailModal.slotDate ? fmtDate(detailModal.slotDate) : fmtDate(detailModal.bookingDate)}
                              {detailModal.slotStartTime && ` — ${fmtTime(detailModal.slotStartTime)}`}
                              {detailModal.slotEndTime && ` → ${fmtTime(detailModal.slotEndTime)}`}
                            </div>
                          </div>
                          <div className="bh-detail-item">
                            <div className="bh-detail-label">Chi nhánh</div>
                            <div className="bh-detail-value">{detailModal.branchName || '—'}</div>
                          </div>
                          <div className="bh-detail-item">
                            <div className="bh-detail-label">Xe</div>
                            <div className="bh-detail-value">
                              {detailModal.vehicleNickname
                                  ? <>{detailModal.vehicleNickname} <span style={{ opacity: 0.6 }}>({detailModal.licensePlate})</span></>
                                  : detailModal.licensePlate || '—'}
                            </div>
                          </div>
                          <div className="bh-detail-item">
                            <div className="bh-detail-label">Nhân viên phụ trách</div>
                            <div className="bh-detail-value">{detailModal.assignedStaffName || 'Chưa phân công'}</div>
                          </div>
                          {detailModal.note && (
                              <div className="bh-detail-item full-width">
                                <div className="bh-detail-label">Ghi chú</div>
                                <div className="bh-detail-value">{detailModal.note}</div>
                              </div>
                          )}
                        </div>

                        {detailModal.details && detailModal.details.length > 0 && (
                            <>
                              <div className="bh-services-title">
                                <span className="material-symbols-outlined">local_car_wash</span>
                                Dịch vụ đã chọn
                              </div>
                              <table className="bh-services-table">
                                <thead>
                                <tr>
                                  <th>Dịch vụ</th>
                                  <th>Mô tả</th>
                                  <th>Thời gian</th>
                                  <th>SL</th>
                                  <th>Đơn giá</th>
                                  <th>Thành tiền</th>
                                </tr>
                                </thead>
                                <tbody>
                                {detailModal.details.map(d => (
                                    <tr key={d.bookingDetailId}>
                                      <td>{d.serviceName}</td>
                                      <td style={{ color: 'var(--on-surface-variant)', maxWidth: '180px', fontSize: '13px' }}>
                                        {d.description || '—'}
                                      </td>
                                      <td>{d.durationMinutes ? `${d.durationMinutes}p` : '—'}</td>
                                      <td>{d.quantity}</td>
                                      <td>{fmt.format(d.unitPrice || 0)}</td>
                                      <td>{fmt.format(d.subTotal || 0)}</td>
                                    </tr>
                                ))}
                                </tbody>
                              </table>
                              <div className="bh-services-total">
                                <span className="bh-services-total-label">Tổng cộng</span>
                                <span className="bh-services-total-value">{fmt.format(detailModal.finalAmount || detailModal.totalAmount || 0)}</span>
                              </div>
                              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                <button
                                    className="bh-btn-detail"
                                    onClick={() => navigate(`/customer/booking/${detailModal.bookingId}`)}
                                    style={{ fontSize: '13px', padding: '6px 16px' }}
                                >
                                  Xem chi tiết →
                                </button>
                              </div>
                            </>
                        )}
                      </>
                  )}
                </div>
              </div>
            </div>
        )}

        {refundTarget && (
            <div className="bh-modal-overlay" onClick={() => !submittingRefund && setRefundTarget(null)}>
              <div className="bh-modal bh-refund-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bh-modal-head">
                  <div className="bh-modal-title">
                    <span className="material-symbols-outlined">currency_exchange</span>
                    Yêu cầu hoàn tiền
                  </div>
                  <button className="bh-modal-close" onClick={() => setRefundTarget(null)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="bh-modal-body">
                  <div className="bh-refund-booking-info">
                    Lịch hẹn <strong>{refundTarget.bookingCode || `#${refundTarget.bookingId}`}</strong> · Số tiền hoàn:{' '}
                    <strong>{fmt.format(refundTarget.finalAmount || refundTarget.totalAmount || 0)}</strong>
                  </div>

                  <div className="bh-refund-field">
                    <label>Lý do hoàn tiền <span className="required">*</span></label>
                    <textarea
                        className="bh-refund-textarea"
                        rows={3}
                        maxLength={500}
                        placeholder="Ví dụ: Tôi phải hủy lịch vì lý do cá nhân, mong được hoàn lại tiền..."
                        value={refundForm.reason}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>

                  <div className="bh-refund-field">
                    <label>Phương thức hoàn tiền <span className="required">*</span></label>
                    <select
                        className="bh-refund-select"
                        value={refundForm.refundMethod}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, refundMethod: e.target.value }))}
                    >
                      <option value="original_payment_method">Hoàn về phương thức thanh toán gốc</option>
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="cash">Tiền mặt tại chi nhánh</option>
                    </select>
                  </div>

                  {refundForm.refundMethod === 'bank_transfer' && (
                      <>
                        <div className="bh-refund-field">
                          <label>Tên ngân hàng <span className="required">*</span></label>
                          <input
                              className="bh-refund-input"
                              type="text"
                              placeholder="Ví dụ: Vietcombank"
                              value={refundForm.bankName}
                              onChange={(e) => setRefundForm(prev => ({ ...prev, bankName: e.target.value }))}
                          />
                        </div>
                        <div className="bh-refund-field">
                          <label>Số tài khoản <span className="required">*</span></label>
                          <input
                              className="bh-refund-input"
                              type="text"
                              placeholder="Số tài khoản ngân hàng"
                              value={refundForm.bankAccountNumber}
                              onChange={(e) => setRefundForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                          />
                        </div>
                        <div className="bh-refund-field">
                          <label>Tên chủ tài khoản <span className="required">*</span></label>
                          <input
                              className="bh-refund-input"
                              type="text"
                              placeholder="Tên đúng như trên thẻ ngân hàng"
                              value={refundForm.bankAccountName}
                              onChange={(e) => setRefundForm(prev => ({ ...prev, bankAccountName: e.target.value }))}
                          />
                        </div>
                      </>
                  )}

                  <div className="bh-cancel-btns">
                    <button className="bh-cancel-keep" onClick={() => setRefundTarget(null)} disabled={submittingRefund}>
                      Hủy bỏ
                    </button>
                    <button className="bh-refund-confirm" onClick={handleRefundSubmit} disabled={submittingRefund}>
                      {submittingRefund ? 'Đang gửi…' : 'Gửi yêu cầu hoàn tiền'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {cancelTarget && (
            <div className="bh-modal-overlay" onClick={() => !cancelling && setCancelTarget(null)}>
              <div className="bh-modal bh-cancel-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bh-modal-head">
                  <div className="bh-modal-title">
                    <span className="material-symbols-outlined">warning</span>
                    Xác nhận hủy lịch
                  </div>
                  <button className="bh-modal-close" onClick={() => setCancelTarget(null)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="bh-modal-body">
                  <div className="bh-cancel-icon-wrapper">
                    <span className="material-symbols-outlined">event_busy</span>
                  </div>
                  <div className="bh-cancel-text">
                    <div className="bh-cancel-heading">Bạn chắc chắn muốn hủy?</div>
                    <div className="bh-cancel-desc">
                      Lịch hẹn <span className="bh-cancel-code">{cancelTarget.bookingCode || `#${cancelTarget.bookingId}`}</span> sẽ bị hủy và không thể hoàn tác.
                    </div>
                  </div>
                  <div className="bh-cancel-btns">
                    <button className="bh-cancel-keep" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                      Giữ lịch
                    </button>
                    <button className="bh-cancel-confirm" onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}