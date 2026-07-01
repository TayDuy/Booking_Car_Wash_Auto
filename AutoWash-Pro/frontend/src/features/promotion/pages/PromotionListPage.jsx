import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./PromotionListPage.css";
import promotionApi from "../../../api/promotionApi";

function getStatusLabel(status) {
  if (status === "available") {
    return "Còn hiệu lực";
  }

  return "Hết hạn";
}

function PromotionListPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await promotionApi.list();
        if (res.data) {
          // Map backend entities to frontend display model
          const mapped = res.data.map(p => ({
            id: p.promotionId || p.id,
            title: p.title || p.name || "Khuyến mãi đặc biệt",
            description: p.description || "Ưu đãi hấp dẫn từ WashFlow Pro dành cho bạn.",
            code: p.code || "WFPVOUCHER",
            discount: p.discountType === "PERCENT" ? `${p.value}%` : `${(p.value || 0).toLocaleString()}đ`,
            expiredDate: p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "Vô thời hạn",
            status: p.status === "ACTIVE" ? "available" : "expired",
            tag: p.vehicleType || "Tất cả xe",
          }));
          setPromotions(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách khuyến mãi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  if (loading) {
    return (
      <div className="promotion-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div className="loading-spinner" style={{ border: "4px solid #f3f3f3", borderTop: "4px solid #0046c7", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <div className="promotion-page">
      <section className="promotion-hero">
        <div className="app-container promotion-hero-inner">
          <div>
            <span className="promotion-badge">Trung tâm ưu đãi</span>

            <h1>Khuyến mãi dành riêng cho bạn</h1>

            <p>
              Lưu mã ưu đãi và sử dụng khi đặt lịch rửa xe để tiết kiệm chi phí
              cho mỗi lần chăm sóc xe.
            </p>
          </div>

          <div className="promotion-hero-card">
            <span>Ưu đãi nổi bật</span>
            <strong>Giảm 20%</strong>
            <p>Cho lần đặt lịch đầu tiên</p>
            <Link to="/customer/booking" className="primary-button">
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </section>

      <section className="promotion-section">
        <div className="app-container">
          <div className="promotion-toolbar">
            <div>
              <h2>Danh sách ưu đãi</h2>
              <p>Chọn ưu đãi phù hợp và áp dụng khi đặt lịch.</p>
            </div>

            <Link to="/customer/booking" className="secondary-button">
              Đặt lịch rửa xe
            </Link>
          </div>

          <div className="promotion-grid">
            {promotions.map((promotion) => (
              <article
                className={
                  promotion.status === "expired"
                    ? "promotion-card card expired"
                    : "promotion-card card"
                }
                key={promotion.id}
              >
                <div className="promotion-card-top">
                  <span className="promotion-tag">{promotion.tag}</span>

                  <span
                    className={
                      promotion.status === "available"
                        ? "status-badge status-success"
                        : "status-badge status-danger"
                    }
                  >
                    {getStatusLabel(promotion.status)}
                  </span>
                </div>

                <div className="promotion-discount">
                  {promotion.discount}
                </div>

                <h3>{promotion.title}</h3>

                <p>{promotion.description}</p>

                <div className="promotion-code-box">
                  <span>Mã ưu đãi</span>
                  <strong>{promotion.code}</strong>
                </div>

                <div className="promotion-meta">
                  <span>Hạn dùng</span>
                  <strong>{promotion.expiredDate}</strong>
                </div>

                <Link
                  to="/customer/booking"
                  className={
                    promotion.status === "expired"
                      ? "promotion-use-btn disabled"
                      : "promotion-use-btn"
                  }
                  onClick={(event) => {
                    if (promotion.status === "expired") {
                      event.preventDefault();
                    }
                  }}
                >
                  {promotion.status === "expired" ? "Đã hết hạn" : "Dùng ngay"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PromotionListPage;