import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDialog } from '../../../contexts/DialogContext.jsx';
import bookingApi from '../../../api/bookingApi';
import ratingApi from '../../../api/ratingApi';
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
  refunded:  { label: 'Đã hoàn tiền',    badge: 'payment-badge-paid' },
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

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════
export default function BookingHistory() {
  const navigate = useNavigate();
  const { showMessage } = useAppDialog();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail modal
  const [detailModal, setDetailModal] = useState(null);   // full BookingResponseDTO
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);  // booking summary
  const [cancelling, setCancelling] = useState(false);

  // Rating modal & map
  const [ratingModalTarget, setRatingModalTarget] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingHoverStars, setRatingHoverStars] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingsMap, setRatingsMap] = useState({});
  const [refundsMap, setRefundsMap] = useState({});

  // ── Fetch bookings ─────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingApi.myBookings(getCustomerId());
      const fetchedBookings = res.data || [];
      setBookings(fetchedBookings);

      try {
        const refRes = await refundApi.myRefunds();
        const refList = refRes.data?.data ?? refRes.data ?? [];
        if (Array.isArray(refList)) {
          const map = {};
          refList.forEach((r) => {
            if (r.bookingId) map[r.bookingId] = r;
          });
          setRefundsMap(map);
        }
      } catch (e) {
        // ignore
      }

      const completedList = fetchedBookings.filter(b => b.status === 'completed');
      completedList.forEach(async (b) => {
        try {
          const rRes = await ratingApi.getRating(b.bookingId);
          if (rRes && rRes.data) {
            setRatingsMap(prev => ({ ...prev, [b.bookingId]: rRes.data }));
          }
        } catch (e) {
          // ignore
        }
      });
    } catch (err) {
      console.error('Lỗi tải lịch sử đặt lịch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Stats ──────────────────────────────────────────────────
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => ['confirmed','checked_in','in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  // ── Filter & search ────────────────────────────────────────
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

  // ── Detail modal handler ───────────────────────────────────
  const openDetail = async (bookingId) => {
    try {
      setDetailLoading(true);
      setDetailModal({}); // open modal shell
      const res = await bookingApi.get(bookingId);
      setDetailModal(res.data);
    } catch (err) {
      console.error('Lỗi tải chi tiết:', err);
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Cancel handler ─────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      await bookingApi.cancel(cancelTarget.bookingId);
      // Update local state
      setBookings(prev =>
          prev.map(b => b.bookingId === cancelTarget.bookingId ? { ...b, status: 'cancelled' } : b)
      );
      setCancelTarget(null);
    } catch (err) {
      console.error('Lỗi hủy lịch:', err);
      await showMessage({ title: "Thông báo", message: 'Hủy lịch không thành công. Vui lòng thử lại.', variant: "danger" });
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (status) => status === 'pending' || status === 'confirmed';

  // ── Rating handlers ─────────────────────────────────────────
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingModalTarget) return;
    try {
      setSubmittingRating(true);
      const res = await ratingApi.createRating(ratingModalTarget.bookingId, {
        ratingStars,
        comment: ratingComment
      });
      setRatingsMap(prev => ({ ...prev, [ratingModalTarget.bookingId]: res.data }));
      setRatingModalTarget(null);
      await showMessage({ title: "Thông báo", message: 'Cảm ơn bạn đã đánh giá dịch vụ!', variant: "success" });
    } catch (err) {
      await showMessage({ title: "Thông báo", message: err.response?.data?.message || 'Không thể tạo đánh giá. Vui lòng thử lại.', variant: "danger" });
    } finally {
      setSubmittingRating(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="bh-page">

      <div className="bh-container">

          {/* ── Page Header ──────────────────────────────────── */}
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
            <div className="bh-header-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
              {stats.total} lịch hẹn
            </div>
          </div>



          {/* ── Toolbar ──────────────────────────────────────── */}
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

          {/* ── Booking List ─────────────────────────────────── */}
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
                        {/* Status stripe */}
                        <div className={`bh-card-stripe stripe-${booking.status}`} />

                        {/* Body */}
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
                              {refundsMap[booking.bookingId] ? (
                                <div className="bh-status-badge" style={{
                                  ...(refundsMap[booking.bookingId].status === 'completed' ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' } :
                                     refundsMap[booking.bookingId].status === 'approved' ? { background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' } :
                                     refundsMap[booking.bookingId].status === 'rejected' ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } :
                                     { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' })
                                }}>
                                  <span className="bh-status-dot" style={{ background: 'currentColor' }} />
                                  {refundsMap[booking.bookingId].status === 'completed' ? 'Đã hoàn tiền' :
                                   refundsMap[booking.bookingId].status === 'approved' ? 'Đã duyệt hoàn tiền' :
                                   refundsMap[booking.bookingId].status === 'rejected' ? 'Từ chối hoàn tiền' :
                                   'Đang xử lý hoàn tiền'}
                                </div>
                              ) : booking.paymentStatus?.toLowerCase() === 'refunded' ? (
                                <div className="bh-status-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                  <span className="bh-status-dot" style={{ background: '#16a34a' }} />
                                  Đã hoàn tiền
                                </div>
                              ) : null}
                            </div>
                            <div className="bh-card-amount">{fmt.format(booking.finalAmount || booking.totalAmount || 0)}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="bh-card-actions">
                          <button className="bh-btn-detail" onClick={() => openDetail(booking.bookingId)}>
                            <span className="material-symbols-outlined">visibility</span>
                            Chi tiết
                          </button>
                          {(refundsMap[booking.bookingId] || booking.paymentStatus?.toLowerCase() === 'refunded') && (
                            <button
                              className="bh-btn-detail"
                              onClick={() => navigate('/customer/refunds')}
                              style={{
                                borderColor: '#0284c7',
                                color: '#0284c7',
                                backgroundColor: 'rgba(2, 132, 199, 0.08)'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0284c7' }}>receipt_long</span>
                              Chi tiết hoàn tiền
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <button
                              className="bh-btn-detail"
                              onClick={() => {
                                setRatingModalTarget(booking);
                                setRatingStars(ratingsMap[booking.bookingId]?.ratingStars || 5);
                                setRatingComment(ratingsMap[booking.bookingId]?.comment || '');
                              }}
                              style={{
                                borderColor: '#f59e0b',
                                color: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.08)'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#f59e0b' }}>star</span>
                              {ratingsMap[booking.bookingId] ? `⭐ ${ratingsMap[booking.bookingId].ratingStars}/5` : 'Đánh giá'}
                            </button>
                          )}
                          {canCancel(booking.status) && (
                              <button className="bh-btn-cancel" onClick={() => setCancelTarget(booking)}>
                                <span className="material-symbols-outlined">close</span>
                                Hủy lịch
                              </button>
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

        {/* ══════════════════════════════════════════════════════
          Detail Modal
          ══════════════════════════════════════════════════════ */}
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

                        {/* Services */}
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
                                {detailModal.discountAmount > 0 && (
                                  <div style={{ fontSize: '13px', color: '#16a34a', marginRight: '12px', fontWeight: '500' }}>
                                    (Giảm giá: -{fmt.format(detailModal.discountAmount)})
                                  </div>
                                )}
                                <span className="bh-services-total-label">Tổng cộng:</span>
                                <span className="bh-services-total-value">{fmt.format(detailModal.finalAmount || detailModal.totalAmount || 0)}</span>
                              </div>
                              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                {refundsMap[detailModal.bookingId] && (
                                  <button
                                    className="bh-btn-detail"
                                    onClick={() => navigate('/customer/refunds')}
                                    style={{ fontSize: '13px', padding: '6px 16px', borderColor: '#0284c7', color: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.08)' }}
                                  >
                                    Chi tiết hoàn tiền →
                                  </button>
                                )}
                                <button
                                  className="bh-btn-detail"
                                  onClick={() => navigate(`/customer/booking/${detailModal.bookingId}`)}
                                  style={{ fontSize: '13px', padding: '6px 16px' }}
                                >
                                  Xem chi tiết đầy đủ →
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

        {/* ══════════════════════════════════════════════════════
          Cancel Confirmation Modal
          ══════════════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════════════
          Rating Modal
          ══════════════════════════════════════════════════════ */}
        {ratingModalTarget && (
            <div className="bh-modal-overlay" onClick={() => !submittingRating && setRatingModalTarget(null)}>
              <div className="bh-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                <div className="bh-modal-head">
                  <div className="bh-modal-title">
                    <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>star</span>
                    Đánh giá dịch vụ
                  </div>
                  <button className="bh-modal-close" onClick={() => setRatingModalTarget(null)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <form onSubmit={handleRatingSubmit} className="bh-modal-body" style={{ padding: '20px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--on-surface-variant, #64748b)', marginBottom: '4px' }}>
                      Đơn hàng: <strong style={{ color: 'var(--on-surface, #0f172a)' }}>{ratingModalTarget.bookingCode || `#${ratingModalTarget.bookingId}`}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '12px 0' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={!!ratingsMap[ratingModalTarget.bookingId]}
                          onClick={() => setRatingStars(star)}
                          onMouseEnter={() => setRatingHoverStars(star)}
                          onMouseLeave={() => setRatingHoverStars(0)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: ratingsMap[ratingModalTarget.bookingId] ? 'default' : 'pointer',
                            fontSize: '32px',
                            color: star <= (ratingHoverStars || ratingStars) ? '#f59e0b' : '#cbd5e1',
                            transition: 'transform 0.15s ease, color 0.15s ease',
                            transform: star <= (ratingHoverStars || ratingStars) ? 'scale(1.15)' : 'scale(1)'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b' }}>
                      {ratingStars === 5 && 'Tuyệt vời! 😍'}
                      {ratingStars === 4 && 'Rất tốt! 😊'}
                      {ratingStars === 3 && 'Bình thường 🙂'}
                      {ratingStars === 2 && 'Chưa hài lòng 🙁'}
                      {ratingStars === 1 && 'Rất kém 😠'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--on-surface, #0f172a)' }}>
                      Nhận xét / Góp ý (không bắt buộc)
                    </label>
                    <textarea
                      rows={3}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ rửa xe..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--outline-variant, #cbd5e1)',
                        fontSize: '13px',
                        resize: 'none',
                        boxSizing: 'border-box'
                      }}
                      disabled={!!ratingsMap[ratingModalTarget.bookingId]}
                    />
                  </div>

                  {!ratingsMap[ratingModalTarget.bookingId] ? (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="bh-cancel-keep"
                        onClick={() => setRatingModalTarget(null)}
                        disabled={submittingRating}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="bh-cancel-confirm"
                        style={{ backgroundColor: '#f59e0b', color: '#fff', borderColor: '#f59e0b' }}
                        disabled={submittingRating}
                      >
                        {submittingRating ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#10b981', fontSize: '13px', fontWeight: '600' }}>
                      ✓ Bạn đã đánh giá đơn hàng này rồi!
                    </div>
                  )}
                </form>
              </div>
            </div>
        )}
      </div>
  );
}