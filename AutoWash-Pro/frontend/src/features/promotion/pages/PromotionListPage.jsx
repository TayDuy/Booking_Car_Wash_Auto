import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./PromotionListPage.css";
import promotionApi from "../../../api/promotionApi";
import {
  getAllRewards,
  getMyRewards,
  redeemReward,
} from "../../../api/customerRewardApi";
import { getMyTier } from "../../../api/loyaltyApi";
import {
  getMyTransactionHistory,
  getMyPointBalance,
} from "../../../api/loyaltyTransactionApi";

function PromotionListPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("rewards");
  const [promotions, setPromotions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [pointBalance, setPointBalance] = useState(0);
  const [pointHistory, setPointHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);

  const customerId = localStorage.getItem("customerId");

  const fullName =
    localStorage.getItem("fullName") ||
    localStorage.getItem("username") ||
    "Khách hàng";

  useEffect(() => {
    loadOfferCenter();
  }, []);

  useEffect(() => {
    const targetPoints = getCurrentPoints();

    if (!targetPoints || targetPoints <= 0) {
      setAnimatedPoints(0);
      return;
    }

    let current = 0;
    const step = Math.max(1, Math.ceil(targetPoints / 40));

    const timer = setInterval(() => {
      current += step;

      if (current >= targetPoints) {
        setAnimatedPoints(targetPoints);
        clearInterval(timer);
      } else {
        setAnimatedPoints(current);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [loyaltyInfo]);

  async function loadOfferCenter() {
    try {
      setLoading(true);
      setMessage("");

      const [promotionRes, rewardRes, voucherRes, loyaltyRes, balanceRes] =
        await Promise.allSettled([
          promotionApi.list(),
          getAllRewards(),
          customerId ? getMyRewards(customerId) : Promise.resolve([]),
          getMyTier(),
          getMyPointBalance(),
        ]);

      if (promotionRes.status === "fulfilled") {
        const rawPromotions = promotionRes.value?.data || promotionRes.value || [];
        const rawTier = loyaltyRes.status === "fulfilled" ? (loyaltyRes.value?.data || loyaltyRes.value || null) : null;
        setLoyaltyInfo(rawTier);

        const mappedPromotions = Array.isArray(rawPromotions)
          ? rawPromotions.map(mapPromotion)
          : [];

        setPromotions(mappedPromotions);
      }

      if (rewardRes.status === "fulfilled") {
        const rawRewards = rewardRes.value?.data || rewardRes.value || [];
        setRewards(Array.isArray(rawRewards) ? rawRewards : []);
      }

      if (voucherRes.status === "fulfilled") {
        const rawVouchers = voucherRes.value?.data || voucherRes.value || [];
        setMyVouchers(Array.isArray(rawVouchers) ? rawVouchers : []);
      }

      if (balanceRes.status === "fulfilled") {
        const data = balanceRes.value?.data || balanceRes.value || {};
        setPointBalance(Number(data.currentPoints || data.points || 0));
      }
    } catch (error) {
      console.error("Load offer center error:", error);
      setMessage("Không thể tải dữ liệu ưu đãi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function mapPromotion(promotion) {
    const value = promotion.value || promotion.discountValue || 0;

    const discount =
      promotion.discountType?.toUpperCase() === "PERCENT"
        ? `${value}%`
        : formatMoney(value);

    const vehicleLabel =
      promotion.vehicleType === null
        ? "Tất cả xe"
        : promotion.vehicleType === "sedan"
        ? "Xe 4 chỗ"
        : promotion.vehicleType === "suv"
        ? "Xe 7 chỗ"
        : promotion.vehicleType === "truck"
        ? "Xe bán tải"
        : promotion.vehicleType === "minivan"
        ? "Xe gia đình"
        : promotion.vehicleType || "Tất cả xe";

    return {
      id: promotion.promotionId || promotion.id,
      title: promotion.title || promotion.promotionName || "Khuyến mãi đặc biệt",
      description:
        promotion.description ||
        "Ưu đãi hấp dẫn từ WashFlow Pro dành cho khách hàng.",
      code: promotion.code || promotion.promotionCode || `KM-AUTO-${promotion.promotionId || promotion.id || ""}`,
      discount,
      expiredDate: promotion.endDate
        ? new Date(promotion.endDate).toLocaleDateString("vi-VN")
        : "Vô thời hạn",
      status: promotion.status === "active" ? "available" : "expired",
      tag: vehicleLabel,
      minOrderValue: promotion.minOrderValue || 0,
      discountType: promotion.discountType || "PERCENT",
      targetTierName: promotion.targetTierName || null,
      usageLimit: promotion.usageLimit || null,
    };
  }

  async function handleRedeemReward(rewardId) {
    if (!customerId) {
      setMessage("Không tìm thấy customerId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setMessage("");

      const res = await redeemReward(rewardId, customerId);
      const data = res?.data || res || {};

      if (data.remainingPoints !== undefined) {
        setPointBalance(Number(data.remainingPoints));
      }

      const voucherData = await getMyRewards(customerId);
      const nextVouchers = voucherData?.data || voucherData || [];

      setMyVouchers(Array.isArray(nextVouchers) ? nextVouchers : []);
      setActiveTab("vouchers");
      setMessage("Đổi voucher thành công! Voucher đã được thêm vào tài khoản.");
    } catch (error) {
      console.error("Redeem reward error:", error);

      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Đổi voucher thất bại."
      );
    }
  }

  function handleUsePromotion(promotion) {
    if (promotion.status !== "available") {
      return;
    }

    localStorage.setItem("selectedPromotionId", promotion.id);
    localStorage.setItem("selectedPromotionDiscount", promotion.discount);
    localStorage.setItem("selectedPromotionCode", promotion.code);

    navigate("/customer/booking");
  }

  function handleUseVoucher(voucher) {
    if (voucher.status !== "UNUSED") {
      return;
    }

    localStorage.setItem("selectedRewardId", voucher.rewardId);
    localStorage.setItem("selectedVoucherCode", voucher.voucherCode);
    localStorage.setItem("selectedVoucherValue", voucher.discountValue || 0);

    navigate("/customer/booking");
  }

  function formatMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
  }

  function formatPoint(value) {
    return Number(value || 0).toLocaleString("vi-VN");
  }

  function getPromotionStatusText(status) {
    return status === "available" ? "Còn hiệu lực" : "Hết hạn";
  }

  function getVoucherStatusText(status) {
    switch (status) {
      case "UNUSED":
        return "Chưa dùng";
      case "USED":
        return "Đã dùng";
      case "EXPIRED":
        return "Hết hạn";
      default:
        return status || "Không rõ";
    }
  }

  function getTierName() {
    const tierId = Number(localStorage.getItem("tierId") || 1);

    switch (tierId) {
      case 4:
        return "Thành viên Kim Cương";
      case 3:
        return "Thành viên Vàng";
      case 2:
        return "Thành viên Bạc";
      default:
        return "Thành viên";
    }
  }

  async function loadPointHistory() {
    if (historyLoading) return;
    setHistoryLoading(true);
    try {
      const res = await getMyTransactionHistory();
      const list = res?.data || res || [];
      setPointHistory(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Load point history error:", err);
      setPointHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && customerId) {
      loadPointHistory();
    }
  }, [loading]);

  function getCurrentPoints() {
    const balance =
      pointBalance ||
      loyaltyInfo?.currentBalance ||
      loyaltyInfo?.currentPoints ||
      loyaltyInfo?.points ||
      0;

    return Number(balance);
  }

  function getCurrentVisits() {
    return Number(loyaltyInfo?.totalVisits || loyaltyInfo?.visits || 0);
  }

  function getTotalSpending() {
    return Number(loyaltyInfo?.totalSpending || loyaltyInfo?.spending || 0);
  }

  function getCurrentTierName() {
    return (
      loyaltyInfo?.tierName ||
        loyaltyInfo?.newTierName ||
        getTierName()
    );
  }

  function getNextTierInfo() {
    const points = getCurrentPoints();
    const visits = getCurrentVisits();

    const tiers = [
      {
        name: "Member",
        displayName: "Thành viên",
        minPoints: 0,
        minVisits: 0,
      },
      {
        name: "Silver",
        displayName: "Thành viên Bạc",
        minPoints: 1000,
        minVisits: 5,
      },
      {
        name: "Gold",
        displayName: "Thành viên Vàng",
        minPoints: 3000,
        minVisits: 10,
      },
      {
        name: "Platinum",
        displayName: "Thành viên Kim Cương",
        minPoints: 7000,
        minVisits: 20,
      },
    ];

    const nextTier = tiers.find(
      (tier) => points < tier.minPoints || visits < tier.minVisits
    );

    if (!nextTier) {
      return {
        nextName: "Hạng cao nhất",
        progressPercent: 100,
        missingPoints: 0,
        missingVisits: 0,
      };
    }

    const previousTierIndex = Math.max(
      0,
      tiers.findIndex((tier) => tier.name === nextTier.name) - 1
    );

    const previousTier = tiers[previousTierIndex];

    const pointRange = nextTier.minPoints - previousTier.minPoints || 1;
    const pointProgress =
      ((points - previousTier.minPoints) / pointRange) * 100;

    const visitRange = nextTier.minVisits - previousTier.minVisits || 1;
    const visitProgress =
      ((visits - previousTier.minVisits) / visitRange) * 100;

    const progressPercent = Math.max(
      0,
      Math.min(100, Math.floor(Math.min(pointProgress, visitProgress)))
    );

    return {
      nextName: nextTier.displayName,
      progressPercent,
      missingPoints: Math.max(0, nextTier.minPoints - points),
      missingVisits: Math.max(0, nextTier.minVisits - visits),
    };
  }

  const voucherStats = useMemo(() => {
    const unused = myVouchers.filter((item) => item.status === "UNUSED").length;
    const used = myVouchers.filter((item) => item.status === "USED").length;

    return {
      unused,
      used,
      total: myVouchers.length,
    };
  }, [myVouchers]);

  const rewardPreview = rewards.slice(0, 4);

  if (loading) {
    return (
      <div className="offer-loading-page">
        <div className="offer-loading-spinner"></div>
        <p>Đang tải trung tâm ưu đãi...</p>
      </div>
    );
  }

  return (
    <div className="offer-page">
      <section className="offer-hero">
        <div className="offer-container offer-hero-inner">
          <div>
            <span className="offer-eyebrow">WashFlow Loyalty</span>

            <h1>Trung tâm Ưu đãi</h1>

            <p>
              Khám phá khuyến mãi, đổi điểm nhận thưởng và quản lý voucher của
              bạn trong cùng một nơi.
            </p>

            <div className="offer-hero-actions">
              <Link to="/customer/booking" className="offer-primary-btn">
                Đặt lịch ngay
              </Link>

              <button
                type="button"
                className="offer-secondary-btn"
                onClick={() => {
                  setActiveTab("vouchers");
                  setTimeout(() => {
                    document.querySelector(".offer-tabs-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
              >
                Xem voucher của tôi
              </button>
            </div>
          </div>

          <div className="offer-hero-summary">
            <span>Voucher khả dụng</span>
            <strong>{voucherStats.unused}</strong>
            <p>Bạn có thể áp dụng voucher khi tạo booking mới.</p>
          </div>
        </div>
      </section>

      <main className="offer-container offer-main">
        {message && <div className="offer-message">{message}</div>}

        <section className="offer-top-grid">
          <div className="member-card">
            <div className="member-card-top">
              <div>
                <span>Hạng thành viên hiện tại</span>
                <h2>{getCurrentTierName()}</h2>
              </div>

              <div className="member-qr">QR</div>
            </div>

            <div className="member-point-row">
              <strong>
                {formatPoint(pointBalance)}
              </strong>
              <span>điểm</span>
            </div>

            <div className="member-progress">
              <div style={{ width: `${getNextTierInfo().progressPercent}%` }}></div>
            </div>

            <p className="member-progress-text">
              Còn {formatPoint(getNextTierInfo().missingPoints)} điểm và{" "}
              {getNextTierInfo().missingVisits} lượt rửa để đạt{" "}
              {getNextTierInfo().nextName}.
            </p>

            <div className="member-card-footer">
              <div>
                <span>Mã thành viên</span>
                <strong>WF-{customerId || "0000"}-2026</strong>
              </div>

              <button type="button" onClick={() => navigate("/customer/rewards")}>Chi tiết quyền lợi</button>
            </div>
          </div>

          <div className="offer-stat-grid">
            <div className="offer-stat-card">
              <span>Khách hàng</span>
              <strong>{fullName}</strong>
              <p>Customer ID: {customerId || "Chưa có"}</p>
            </div>

            <div className="offer-stat-card">
              <span>Lượt rửa hoàn thành</span>
              <strong>{getCurrentVisits()}</strong>
              <p>Tính từ các booking đã completed.</p>
            </div>

            <div className="offer-stat-card">
              <span>Tổng chi tiêu</span>
              <strong>{formatMoney(getTotalSpending())}</strong>
              <p>Dùng để xét hạng thành viên.</p>
            </div>

            <div className="offer-stat-card">
              <span>Voucher chưa dùng</span>
              <strong>{voucherStats.unused}</strong>
              <p>Có thể áp dụng khi đặt lịch.</p>
            </div>
          </div>  
        </section>

        <section className="offer-tabs-panel">
          <div className="offer-tabs">
            <button
              type="button"
              className={activeTab === "promotions" ? "active" : ""}
              onClick={() => setActiveTab("promotions")}
            >
              <span>%</span>
              <div>
                <strong>Khuyến mãi</strong>
                <small>{promotions.length} ưu đãi hệ thống</small>
              </div>
            </button>

            <button
              type="button"
              className={activeTab === "rewards" ? "active" : ""}
              onClick={() => setActiveTab("rewards")}
            >
              <span>★</span>
              <div>
                <strong>Đổi điểm</strong>
                <small>{rewards.length} phần thưởng</small>
              </div>
            </button>

            <button
              type="button"
              className={activeTab === "vouchers" ? "active" : ""}
              onClick={() => setActiveTab("vouchers")}
            >
              <span>✓</span>
              <div>
                <strong>Voucher của tôi</strong>
                <small>{voucherStats.total} voucher</small>
              </div>
            </button>
          </div>
        </section>

        {activeTab === "promotions" && (
          <section className="offer-section">
            <div className="offer-section-header">
              <div>
                <h2>Khuyến mãi đang áp dụng</h2>
                <p>Chọn ưu đãi phù hợp và áp dụng khi đặt lịch.</p>
              </div>

              <Link to="/customer/booking" className="offer-outline-btn">
                Đặt lịch rửa xe
              </Link>
            </div>

            <div className="offer-card-grid">
              {promotions.length === 0 && (
                <div className="offer-empty-card">
                  Hiện chưa có khuyến mãi nào.
                </div>
              )}

              {promotions.map((promotion) => (
                <article
                  className={
                    promotion.status === "expired"
                      ? "promo-card expired"
                      : "promo-card"
                  }
                  key={promotion.id}
                >
                  <div className="promo-card-top">
                    <span className="offer-chip">{promotion.tag}</span>

                    <span
                      className={
                        promotion.status === "available"
                          ? "offer-status success"
                          : "offer-status danger"
                      }
                    >
                      {getPromotionStatusText(promotion.status)}
                    </span>
                  </div>

                  <div className="promo-discount">{promotion.discount}</div>

                  <h3>{promotion.title}</h3>

                  <p>{promotion.description}</p>

                  <div className="promo-code-box">
                    <span>Mã ưu đãi</span>
                    <strong>{promotion.code}</strong>
                  </div>

                  <div className="promo-meta">
                    <span>Hạn dùng</span>
                    <strong>{promotion.expiredDate}</strong>
                  </div>

                  <div className="promo-meta">
                    <span>Điều kiện</span>
                    <strong>
                      {promotion.targetTierName
                        ? `Hạng ${promotion.targetTierName}`
                        : "Mọi hạng"}
                      {promotion.minOrderValue > 0 &&
                        ` · Đơn từ ${formatMoney(promotion.minOrderValue)}`}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      promotion.status === "available"
                        ? "offer-card-btn"
                        : "offer-card-btn disabled"
                    }
                    disabled={promotion.status !== "available"}
                    onClick={() => handleUsePromotion(promotion)}
                  >
                    {promotion.status === "available"
                      ? "Dùng ngay"
                      : "Đã hết hạn"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "rewards" && (
          <section className="offer-section">
            <div className="offer-section-header">
              <div>
                <h2>Đổi điểm nhận thưởng</h2>
                <p>Điểm sẽ được trừ ngay sau khi đổi thưởng thành công.</p>
              </div>

              <button
                type="button"
                className="offer-outline-btn"
                onClick={loadOfferCenter}
              >
                Làm mới
              </button>
            </div>

            <div className="reward-grid">
              {rewardPreview.length === 0 && (
                <div className="offer-empty-card">
                  Hiện chưa có phần thưởng nào để đổi.
                </div>
              )}

              {rewardPreview.map((reward, index) => (
                <article className="reward-card" key={reward.rewardId}>
                  <div className={`reward-image reward-${index + 1}`}>
                    <span>{formatPoint(reward.requiredPoints)} điểm</span>
                  </div>

                  <div className="reward-body">
                    <div className="reward-title-row">
                      <h3>{reward.rewardName}</h3>

                      <span
                        className={
                          reward.status === "active"
                            ? "offer-status success"
                            : "offer-status danger"
                        }
                      >
                        {reward.status}
                      </span>
                    </div>

                    <p>
                      Giá trị quy đổi:{" "}
                      <strong>{formatMoney(reward.rewardValue)}</strong>
                    </p>

                    <div className="reward-meta">
                      <span>{reward.rewardType}</span>
                      <span>{reward.vehicleType || "car"}</span>
                    </div>

                    <button
                      type="button"
                      className="offer-card-btn"
                      disabled={reward.status !== "active" || pointBalance < reward.requiredPoints}
                      title={
                        pointBalance < reward.requiredPoints
                          ? "Bạn không đủ điểm để đổi phần thưởng này"
                          : ""
                      }
                      onClick={() => handleRedeemReward(reward.rewardId)}
                    >
                      {pointBalance < reward.requiredPoints ? "Thiếu điểm" : "Đổi ngay"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "vouchers" && (
          <section className="offer-section">
            <div className="offer-section-header">
              <div>
                <h2>Voucher của tôi</h2>
                <p>Voucher đã đổi từ điểm, có thể áp dụng cho booking mới.</p>
              </div>

              <Link to="/customer/booking" className="offer-outline-btn">
                Đặt lịch rửa xe
              </Link>
            </div>

            <div className="voucher-list">
              {myVouchers.length === 0 && (
                <div className="offer-empty-card">
                  Bạn chưa có voucher nào. Hãy đổi điểm để nhận ưu đãi.
                </div>
              )}

              {myVouchers.map((voucher) => (
                <article
                  className={`voucher-card ${voucher.status?.toLowerCase()}`}
                  key={voucher.customerRewardId}
                >
                  <div className="voucher-code-block">
                    <span>Mã voucher</span>
                    <strong>{voucher.voucherCode}</strong>
                  </div>

                  <div className="voucher-info">
                    <h3>{voucher.rewardName}</h3>

                    <p>
                      Giá trị:{" "}
                      <strong>{formatMoney(voucher.discountValue)}</strong>
                    </p>

                    <div className="voucher-meta-row">
                      <span>{formatPoint(voucher.redeemedPoints)} điểm</span>

                      {voucher.expiredAt && (
                        <span>
                          Hạn:{" "}
                          {new Date(voucher.expiredAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      )}

                      {voucher.usedBookingId && (
                        <span>Booking #{voucher.usedBookingId}</span>
                      )}
                    </div>
                  </div>

                  <div className="voucher-action">
                    <span
                      className={
                        voucher.status === "UNUSED"
                          ? "offer-status success"
                          : voucher.status === "USED"
                          ? "offer-status neutral"
                          : "offer-status danger"
                      }
                    >
                      {getVoucherStatusText(voucher.status)}
                    </span>

                    <button
                      type="button"
                      className="offer-card-btn"
                      disabled={voucher.status !== "UNUSED"}
                      onClick={() => handleUseVoucher(voucher)}
                    >
                      {voucher.status === "UNUSED"
                        ? "Áp dụng khi đặt lịch"
                        : voucher.status === "USED"
                        ? "Đã sử dụng"
                        : "Hết hạn"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="offer-section">
          <div className="offer-section-header">
            <div>
              <h2>Lịch sử tích điểm</h2>
              <p>Theo dõi điểm cộng/trừ từ booking và đổi voucher.</p>
            </div>
          </div>

          <div className="point-history-card">
            {historyLoading ? (
              <div className="history-loading-state">
                <div className="offer-loading-spinner"></div>
                <p>Đang tải lịch sử tích điểm...</p>
              </div>
            ) : pointHistory.length === 0 ? (
              <div className="history-empty-state">
                <p>Chưa có giao dịch tích điểm nào.</p>
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Hoạt động</th>
                      <th>Loại</th>
                      <th>Điểm</th>
                      <th>Số dư sau</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pointHistory.map((tx) => {
                      const isEarn = tx.transactionType === "earn";
                      return (
                        <tr key={tx.loyaltyTransactionId}>
                          <td>
                            {tx.createdAt
                              ? new Date(tx.createdAt).toLocaleDateString("vi-VN")
                              : "---"}
                          </td>
                          <td>{tx.note || "Giao dịch điểm thưởng"}</td>
                          <td>
                            <span className={`tx-type-badge ${isEarn ? "earn" : "redeem"}`}>
                              {isEarn ? "Cộng" : "Trừ"}
                            </span>
                          </td>
                          <td className={isEarn ? "point-plus" : "point-minus"}>
                            {isEarn ? "+" : ""}
                            {formatPoint(Math.abs(tx.points))}
                          </td>
                          <td>{formatPoint(tx.balanceAfter)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <button
                  type="button"
                  className="history-load-more"
                  onClick={loadPointHistory}
                  disabled={historyLoading}
                >
                  {historyLoading ? "Đang tải..." : "Tải lại"}
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default PromotionListPage;