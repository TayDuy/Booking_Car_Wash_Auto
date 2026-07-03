import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./PromotionListPage.css";
import promotionApi from "../../../api/promotionApi";
import {
  getAllRewards,
  getMyRewards,
  redeemReward,
} from "../../../api/customerRewardApi";

function getStatusLabel(status) {
  if (status === "available") {
    return "Còn hiệu lực";
  }

  return "Hết hạn";
}

function PromotionListPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("promotions");
  const [rewards, setRewards] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [message, setMessage] = useState("");

  const customerId = localStorage.getItem("customerId");

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await promotionApi.list();

        if (res.data) {
          const mapped = res.data.map((p) => ({
            id: p.promotionId || p.id,
            title: p.title || p.name || "Khuyến mãi đặc biệt",
            description:
              p.description ||
              "Ưu đãi hấp dẫn từ WashFlow Pro dành cho bạn.",
            code: p.code || "WFPVOUCHER",
            discount:
              p.discountType === "PERCENT"
                ? `${p.value}%`
                : `${(p.value || 0).toLocaleString("vi-VN")}đ`,
            expiredDate: p.endDate
              ? new Date(p.endDate).toLocaleDateString("vi-VN")
              : "Vô thời hạn",
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

  useEffect(() => {
    const fetchRewardData = async () => {
      try {
        const rewardsData = await getAllRewards();
        const vouchersData = customerId ? await getMyRewards(customerId) : [];

        setRewards(
          Array.isArray(rewardsData) ? rewardsData : rewardsData?.data || []
        );

        setMyVouchers(
          Array.isArray(vouchersData) ? vouchersData : vouchersData?.data || []
        );
      } catch (err) {
        console.error("Lỗi khi tải reward/voucher:", err);
      }
    };

    fetchRewardData();
  }, [customerId]);

  const handleRedeemReward = async (rewardId) => {
    if (!customerId) {
      setMessage("Không tìm thấy customerId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setMessage("");

      await redeemReward(rewardId, customerId);

      const vouchersData = await getMyRewards(customerId);
      setMyVouchers(
        Array.isArray(vouchersData) ? vouchersData : vouchersData?.data || []
      );

      setMessage("Đổi voucher thành công!");
      setActiveTab("vouchers");
    } catch (err) {
      console.error("Lỗi đổi voucher:", err);

      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Đổi voucher thất bại."
      );
    }
  };

  const formatMoney = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
  };

  const formatPoint = (value) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <div
        className="promotion-page"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <div
          className="loading-spinner"
          style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #0046c7",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
          }}
        ></div>

        <style>
          {`@keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }`}
        </style>
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
              Lưu mã ưu đãi, đổi điểm nhận voucher và sử dụng khi đặt lịch rửa
              xe để tiết kiệm chi phí cho mỗi lần chăm sóc xe.
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

      <section className="promotion-tabs-section">
        <div className="app-container">
          <div className="offer-switch-panel">
            <div className="offer-switch-header">
              <div>
                <span className="offer-switch-eyebrow">Offer Center</span>
                <h2>Quản lý ưu đãi của bạn</h2>
                <p>
                  Theo dõi khuyến mãi, đổi điểm và sử dụng voucher trong cùng một nơi.
                </p>
              </div>

              <Link to="/customer/booking" className="offer-booking-shortcut">
                Đặt lịch ngay
              </Link>
            </div>

            <div className="offer-tabs" role="tablist">
              <button
                type="button"
                className={activeTab === "promotions" ? "offer-tab active" : "offer-tab"}
                onClick={() => setActiveTab("promotions")}
              >
                <span className="offer-tab-icon percent">%</span>

                <span className="offer-tab-content">
                  <strong>Khuyến mãi</strong>
                  <small>{promotions.length} ưu đãi hệ thống</small>
                </span>
              </button>

              <button
                type="button"
                className={activeTab === "rewards" ? "offer-tab active" : "offer-tab"}
                onClick={() => setActiveTab("rewards")}
              >
                <span className="offer-tab-icon gift">★</span>

                <span className="offer-tab-content">
                  <strong>Đổi điểm</strong>
                  <small>{rewards.length} phần thưởng</small>
                </span>
              </button>

              <button
                type="button"
                className={activeTab === "vouchers" ? "offer-tab active" : "offer-tab"}
                onClick={() => setActiveTab("vouchers")}
              >
                <span className="offer-tab-icon voucher">✓</span>

                <span className="offer-tab-content">
                  <strong>Voucher của tôi</strong>
                  <small>{myVouchers.length} voucher</small>
                </span>
              </button>
            </div>

            {message && <div className="promotion-message">{message}</div>}
          </div>
        </div>
      </section>

      {activeTab === "promotions" && (
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
                    {promotion.status === "expired"
                      ? "Đã hết hạn"
                      : "Dùng ngay"}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "rewards" && (
        <section className="promotion-section">
          <div className="app-container">
            <div className="promotion-toolbar">
              <div>
                <h2>Đổi điểm nhận voucher</h2>
                <p>Dùng điểm tích lũy để đổi voucher rửa xe.</p>
              </div>
            </div>

            <div className="promotion-grid">
              {rewards.length === 0 && (
                <div className="empty-voucher-card">
                  Hiện chưa có phần thưởng nào có thể đổi.
                </div>
              )}

              {rewards.map((reward) => (
                <article className="promotion-card card" key={reward.rewardId}>
                  <div className="promotion-card-top">
                    <span className="promotion-tag">
                      {reward.rewardType || "Reward"}
                    </span>

                    <span
                      className={
                        reward.status === "active"
                          ? "status-badge status-success"
                          : "status-badge status-danger"
                      }
                    >
                      {reward.status}
                    </span>
                  </div>

                  <div className="promotion-discount">
                    {formatMoney(reward.rewardValue)}
                  </div>

                  <h3>{reward.rewardName}</h3>

                  <p>
                    Cần{" "}
                    <strong>
                      {formatPoint(reward.requiredPoints)} điểm
                    </strong>{" "}
                    để đổi voucher này.
                  </p>

                  <div className="promotion-code-box">
                    <span>Loại xe</span>
                    <strong>{reward.vehicleType || "car"}</strong>
                  </div>

                  <button
                    type="button"
                    className="promotion-use-btn"
                    disabled={reward.status !== "active"}
                    onClick={() => handleRedeemReward(reward.rewardId)}
                  >
                    Đổi voucher
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "vouchers" && (
        <section className="promotion-section">
          <div className="app-container">
            <div className="promotion-toolbar">
              <div>
                <h2>Voucher của tôi</h2>
                <p>Các voucher bạn đã đổi từ điểm tích lũy.</p>
              </div>

              <Link to="/customer/booking" className="secondary-button">
                Đặt lịch rửa xe
              </Link>
            </div>

            <div className="promotion-grid">
              {myVouchers.length === 0 && (
                <div className="empty-voucher-card">
                  Bạn chưa có voucher nào.
                </div>
              )}

              {myVouchers.map((voucher) => (
                <article
                  className="promotion-card card"
                  key={voucher.customerRewardId}
                >
                  <div className="promotion-card-top">
                    <span className="promotion-tag">Voucher</span>

                    <span
                      className={
                        voucher.status === "UNUSED"
                          ? "status-badge status-success"
                          : "status-badge status-danger"
                      }
                    >
                      {voucher.status}
                    </span>
                  </div>

                  <div className="promotion-discount">
                    {formatMoney(voucher.discountValue)}
                  </div>

                  <h3>{voucher.rewardName}</h3>

                  <div className="promotion-code-box">
                    <span>Mã voucher</span>
                    <strong>{voucher.voucherCode}</strong>
                  </div>

                  <div className="promotion-meta">
                    <span>Điểm đã dùng</span>
                    <strong>
                      {formatPoint(voucher.redeemedPoints)} điểm
                    </strong>
                  </div>

                  {voucher.usedBookingId && (
                    <div className="promotion-meta">
                      <span>Đã dùng cho booking</span>
                      <strong>#{voucher.usedBookingId}</strong>
                    </div>
                  )}

                  <Link
                    to="/customer/booking"
                    className={
                      voucher.status === "UNUSED"
                        ? "promotion-use-btn"
                        : "promotion-use-btn disabled"
                    }
                    onClick={(event) => {
                      if (voucher.status !== "UNUSED") {
                        event.preventDefault();
                      }
                    }}
                  >
                    {voucher.status === "UNUSED" ? "Dùng ngay" : "Đã sử dụng"}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default PromotionListPage;