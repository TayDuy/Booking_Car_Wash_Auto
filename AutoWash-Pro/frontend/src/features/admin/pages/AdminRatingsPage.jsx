import React, { useEffect, useState, useMemo } from "react";
import { ratingApi } from "../../../api/ratingApi";
import { useNavigate } from "react-router-dom";
import "./AdminRatingsPage.css";

export default function AdminRatingsPage() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStars, setSelectedStars] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const isEmployee = window.location.pathname.startsWith('/employee');
      const apiCall = isEmployee ? ratingApi.getAllRatingsForEmployee : ratingApi.getAllRatingsForAdmin;
      const res = await apiCall({
        stars: selectedStars || undefined,
        search: searchQuery || undefined,
      });
      setRatings(res.data || res || []);
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
      setError("Không thể tải danh sách đánh giá. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [selectedStars]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRatings();
  };

  // Compute Statistics
  const stats = useMemo(() => {
    if (!ratings || ratings.length === 0) {
      return { avg: 0, total: 0, lowCount: 0, fiveStarPct: 0 };
    }
    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + (r.ratingStars || 0), 0);
    const avg = (sum / total).toFixed(1);
    const lowCount = ratings.filter((r) => r.ratingStars <= 2).length;
    const fiveStarCount = ratings.filter((r) => r.ratingStars === 5).length;
    const fiveStarPct = Math.round((fiveStarCount / total) * 100);

    return { avg, total, lowCount, fiveStarPct };
  }, [ratings]);

  const renderStars = (stars) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className="material-symbols-outlined"
        style={{
          fontSize: "20px",
          color: i < stars ? "#f59e0b" : "#cbd5e1",
          fontVariationSettings: i < stars ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        star
      </span>
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="arp-container">
      {/* Header */}
      <div className="arp-header">
        <div>
          <h1 className="arp-title">
            <span className="material-symbols-outlined arp-title-icon">rate_review</span>
            Quản lý Đánh giá & Phản hồi
          </h1>
          <p className="arp-subtitle">
            Theo dõi ý kiến đánh giá chất lượng dịch vụ từ tất cả khách hàng
          </p>
        </div>
        <button className="arp-btn-refresh" onClick={fetchRatings} disabled={loading}>
          <span className="material-symbols-outlined">refresh</span>
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="arp-stats-grid">
        <div className="arp-stat-card">
          <div className="arp-stat-icon gold">
            <span className="material-symbols-outlined">star</span>
          </div>
          <div>
            <div className="arp-stat-val">{stats.avg} <span className="arp-stat-max">/ 5.0</span></div>
            <div className="arp-stat-lbl">Điểm Đánh Giá Trung Bình</div>
          </div>
        </div>

        <div className="arp-stat-card">
          <div className="arp-stat-icon blue">
            <span className="material-symbols-outlined">reviews</span>
          </div>
          <div>
            <div className="arp-stat-val">{stats.total}</div>
            <div className="arp-stat-lbl">Tổng Số Lượt Đánh Giá</div>
          </div>
        </div>

        <div className="arp-stat-card">
          <div className="arp-stat-icon red">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <div className="arp-stat-val">{stats.lowCount}</div>
            <div className="arp-stat-lbl">Đánh Giá Kém (1 - 2★)</div>
          </div>
        </div>

        <div className="arp-stat-card">
          <div className="arp-stat-icon green">
            <span className="material-symbols-outlined">sentiment_very_satisfied</span>
          </div>
          <div>
            <div className="arp-stat-val">{stats.fiveStarPct}%</div>
            <div className="arp-stat-lbl">Tỷ Lệ Đánh Giá 5 Sao</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="arp-filter-bar">
        <div className="arp-star-filters">
          <button
            className={`arp-star-btn ${selectedStars === null ? "active" : ""}`}
            onClick={() => setSelectedStars(null)}
          >
            Tất cả ({ratings.length})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              className={`arp-star-btn ${selectedStars === s ? "active" : ""}`}
              onClick={() => setSelectedStars(s)}
            >
              {s} ★
            </button>
          ))}
        </div>

        <form className="arp-search-form" onSubmit={handleSearchSubmit}>
          <div className="arp-search-wrapper">
            <span className="material-symbols-outlined arp-search-icon">search</span>
            <input
              type="text"
              className="arp-search-input"
              placeholder="Tìm theo mã đơn, khách hàng, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="arp-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  fetchRatings();
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
          <button type="submit" className="arp-btn-search">
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div className="arp-loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p style={{ marginTop: "12px", color: "#64748b" }}>Đang tải danh sách đánh giá...</p>
        </div>
      ) : error ? (
        <div className="arp-error-state">
          <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#ef4444" }}>error</span>
          <p>{error}</p>
          <button className="arp-btn-refresh" onClick={fetchRatings}>Thử lại</button>
        </div>
      ) : ratings.length === 0 ? (
        <div className="arp-empty-state">
          <span className="material-symbols-outlined arp-empty-icon">rate_review</span>
          <h3>Chưa có đánh giá nào</h3>
          <p>Không tìm thấy đánh giá khớp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="arp-rating-grid">
          {ratings.map((r) => (
            <div key={r.ratingId} className={`arp-card ${r.ratingStars <= 2 ? "low-rating-card" : ""}`}>
              <div className="arp-card-header">
                <div className="arp-user-info">
                  <div className="arp-avatar">
                    {(r.customerName || "K").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="arp-user-name">{r.customerName || "Khách hàng"}</div>
                    <div className="arp-user-contact">
                      {r.customerPhone || "—"} {r.customerEmail ? `• ${r.customerEmail}` : ""}
                    </div>
                  </div>
                </div>

                <div className="arp-booking-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>receipt_long</span>
                  {r.bookingCode || `#BK-${r.bookingId}`}
                </div>
              </div>

              <div className="arp-card-stars-row">
                <div className="arp-stars-flex">
                  {renderStars(r.ratingStars)}
                  <span className="arp-stars-text">{r.ratingStars} / 5</span>
                </div>
                <div className="arp-date">{formatDate(r.createdAt)}</div>
              </div>

              <div className="arp-comment-box">
                {r.comment ? (
                  <p className="arp-comment-text">"{r.comment}"</p>
                ) : (
                  <p className="arp-comment-empty">(Khách hàng không để lại nhận xét bằng lời)</p>
                )}
              </div>

              <div className="arp-card-footer">
                <button
                  className="arp-btn-view-booking"
                  onClick={() => {
                    const isEmployee = window.location.pathname.startsWith('/employee');
                    navigate(isEmployee ? `/employee/queue` : `/admin/bookings?search=${r.bookingCode || r.bookingId}`);
                  }}
                >
                  <span className="material-symbols-outlined">visibility</span>
                  Xem đơn hàng #{r.bookingCode || r.bookingId}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
