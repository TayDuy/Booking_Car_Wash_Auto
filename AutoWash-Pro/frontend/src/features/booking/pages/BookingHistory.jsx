import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../../../components/layout/SiteHeader';
import customerApi from '../../../api/customerApi';
import bookingApi from '../../../api/bookingApi';
import './BookingHistory.css';

// ── Status config ────────────────────────────────────────────
const STATUS_MAP = {
  pending:     { label: 'Chờ xử lý',    badge: 'badge-pending' },
  confirmed:   { label: 'Đã xác nhận',   badge: 'badge-confirmed' },
  in_progress: { label: 'Đang thực hiện', badge: 'badge-in_progress' },
  completed:   { label: 'Hoàn thành',    badge: 'badge-completed' },
  cancelled:   { label: 'Đã hủy',       badge: 'badge-cancelled' },
  no_show:     { label: 'Vắng mặt',     badge: 'badge-no_show' },
};

const FILTER_TABS = [
  { key: 'all',         label: 'Tất cả' },
  { key: 'pending',     label: 'Chờ xử lý' },
  { key: 'confirmed',   label: 'Đã xác nhận' },
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

  // ── Fetch bookings ─────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const profileRes = await customerApi.profile();
      const customerId = profileRes.data?.customerId;
      if (!customerId) return;
      const res = await bookingApi.myBookings(customerId);
      setBookings(res.data || []);
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
    pending: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  // ── Filter & search ────────────────────────────────────────
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
      alert('Hủy lịch không thành công. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (status) => status === 'pending' || status === 'confirmed';

  // ══════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="bh-page">
      <SiteHeader />

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

        {/* ── Stats Grid ───────────────────────────────────── */}
        <div className="bh-stats-grid">
          <div className="bh-stat-card stat-total">
            <div className="bh-stat-icon">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div className="bh-stat-number">{stats.total}</div>
            <div className="bh-stat-label">Tổng lịch hẹn</div>
          </div>
          <div className="bh-stat-card stat-pending">
            <div className="bh-stat-icon">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div className="bh-stat-number">{stats.pending}</div>
            <div className="bh-stat-label">Đang chờ xử lý</div>
          </div>
          <div className="bh-stat-card stat-completed">
            <div className="bh-stat-icon">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div className="bh-stat-number">{stats.completed}</div>
            <div className="bh-stat-label">Đã hoàn thành</div>
          </div>
          <div className="bh-stat-card stat-cancelled">
            <div className="bh-stat-icon">
              <span className="material-symbols-outlined">cancel</span>
            </div>
            <div className="bh-stat-number">{stats.cancelled}</div>
            <div className="bh-stat-label">Đã hủy</div>
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
            {filtered.map((booking, idx) => {
              const statusCfg = STATUS_MAP[booking.status] || STATUS_MAP.pending;
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
                          {booking.licensePlate}
                        </span>
                      )}
                    </div>

                    <div className="bh-card-status-amount">
                      <div className={`bh-status-badge ${statusCfg.badge}`}>
                        <span className="bh-status-dot" />
                        {statusCfg.label}
                      </div>
                      <div className="bh-card-amount">{fmt.format(booking.totalAmount || 0)}</div>
                    </div>
                  </div>

                  {/* Actions */}
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
                  </div>
                </div>
              );
            })}
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
                      <div className="bh-detail-label">Biển số xe</div>
                      <div className="bh-detail-value">{detailModal.licensePlate || '—'}</div>
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
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailModal.details.map(d => (
                            <tr key={d.bookingDetailId}>
                              <td>{d.serviceName}</td>
                              <td>{d.quantity}</td>
                              <td>{fmt.format(d.unitPrice || 0)}</td>
                              <td>{fmt.format(d.subTotal || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="bh-services-total">
                        <span className="bh-services-total-label">Tổng cộng</span>
                        <span className="bh-services-total-value">{fmt.format(detailModal.totalAmount || 0)}</span>
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

      {/* Footer */}
      <footer className="global-footer-bar">
        <div className="footer-brand-info">
          <h4>WashFlow Pro</h4>
          <p>© 2026 WashFlow Pro Automation. Tất cả quyền được bảo lưu.</p>
        </div>
        <div className="footer-nav-links">
          <a href="#">Liên hệ</a>
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản dịch vụ</a>
          <a href="#">Hỗ trợ</a>
        </div>
      </footer>
    </div>
  );
}
