import { useEffect, useState } from "react";
import {
  getAllRewards,
  getMyRewards,
  redeemReward,
} from "../../../api/customerRewardApi";
import "./RewardsPage.css";

function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tierLevel, setTierLevel] = useState(null);

  const customerId = localStorage.getItem("customerId");

  useEffect(() => {
    loadRewardsPage();
  }, []);

  async function loadRewardsPage() {
    try {
      setLoading(true);
      setMessage("");

      const rewardData = await getAllRewards();
      const voucherData = customerId ? await getMyRewards(customerId) : [];

      setRewards(Array.isArray(rewardData) ? rewardData : rewardData?.data || []);
      setVouchers(Array.isArray(voucherData) ? voucherData : voucherData?.data || []);

      // Lấy hạng thành viên từ localStorage (set bởi LoyaltyEvaluationService)
      const stored = localStorage.getItem("tierLevel");
      if (stored) setTierLevel(Number(stored));
    } catch (error) {
      console.error("Load rewards error:", error);
      setMessage("Không thể tải dữ liệu phần thưởng.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(rewardId) {
    if (!customerId) {
      setMessage("Không tìm thấy customerId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await redeemReward(rewardId, customerId);

      setMessage("Đổi voucher thành công!");
      await loadRewardsPage();
    } catch (error) {
      console.error("Redeem reward error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Đổi voucher thất bại.";

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(value) {
    if (value === null || value === undefined) return "0đ";
    return `${Number(value).toLocaleString("vi-VN")}đ`;
  }

  function formatPoint(value) {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("vi-VN");
  }

  function getTierName(level) {
    if (!level) return null;
    if (level >= 4) return "Platinum";
    if (level === 3) return "Gold";
    if (level === 2) return "Silver";
    return "Member";
  }

  function tierBadgeText(requiredLevel) {
    if (!requiredLevel) return null;
    return getTierName(requiredLevel);
  }

  function canRedeem(reward) {
    if (reward.status !== "active") return false;
    if (!reward.requiredTierLevel) return true;
    return tierLevel !== null && tierLevel >= reward.requiredTierLevel;
  }

  return (
    <div className="rewards-page">
      <div className="rewards-hero">
        <div>
          <span className="rewards-eyebrow">Loyalty Rewards</span>
          <h1>Đổi điểm nhận voucher</h1>
          <p>
            Sử dụng điểm tích lũy từ các lần rửa xe để đổi ưu đãi, voucher giảm giá
            và các phần thưởng dành riêng cho khách hàng thân thiết.
          </p>
        </div>

        <div className="rewards-hero-card">
          <span>Customer ID</span>
          <strong>{customerId || "Chưa có"}</strong>
          <p>Điểm sẽ được trừ khi bạn đổi voucher thành công.</p>
        </div>
      </div>

      {message && <div className="rewards-alert">{message}</div>}

      <section className="rewards-section">
        <div className="section-title-row">
          <div>
            <h2>Phần thưởng có thể đổi</h2>
            <p>Chọn voucher phù hợp với số điểm hiện có của bạn.</p>
          </div>
        </div>

        {loading && <div className="rewards-loading">Đang tải dữ liệu...</div>}

        <div className="reward-grid">
          {rewards.map((reward) => (
            <article className="reward-card" key={reward.rewardId}>
              <div className="reward-card-header">
                <div className="reward-icon">🎁</div>
                <span className={`reward-status ${reward.status}`}>
                  {reward.status}
                </span>
              </div>

              <h3>{reward.rewardName}</h3>

              <div className="reward-info">
                <div>
                  <span>Giá trị</span>
                  <strong>{formatMoney(reward.rewardValue)}</strong>
                </div>

                <div>
                  <span>Cần điểm</span>
                  <strong>{formatPoint(reward.requiredPoints)} điểm</strong>
                </div>
              </div>

              <div className="reward-meta">
                <span>Loại: {reward.rewardType}</span>
                <span>Xe: {reward.vehicleType}</span>
                {reward.requiredTierLevel && (
                  <span className="reward-tier-badge">
                    {tierBadgeText(reward.requiredTierLevel)}+
                  </span>
                )}
              </div>

              <button
                className="reward-btn"
                disabled={loading || !canRedeem(reward)}
                onClick={() => handleRedeem(reward.rewardId)}
              >
                {!canRedeem(reward) && reward.requiredTierLevel
                  ? `Cần hạng ${tierBadgeText(reward.requiredTierLevel)}+`
                  : "Đổi voucher"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rewards-section">
        <div className="section-title-row">
          <div>
            <h2>Voucher của tôi</h2>
            <p>Danh sách voucher bạn đã đổi từ điểm tích lũy.</p>
          </div>
        </div>

        <div className="voucher-list">
          {vouchers.length === 0 && (
            <div className="empty-voucher">
              Bạn chưa có voucher nào. Hãy đổi điểm để nhận ưu đãi.
            </div>
          )}

          {vouchers.map((voucher) => (
            <article className="voucher-card" key={voucher.customerRewardId}>
              <div className="voucher-left">
                <div className="voucher-code-box">
                  {voucher.voucherCode}
                </div>

                <div>
                  <h3>{voucher.rewardName}</h3>
                  <p>
                    Giá trị: <strong>{formatMoney(voucher.discountValue)}</strong>
                  </p>
                  <p>
                    Điểm đã dùng:{" "}
                    <strong>{formatPoint(voucher.redeemedPoints)} điểm</strong>
                  </p>
                </div>
              </div>

              <div className="voucher-right">
                <span className={`voucher-badge ${voucher.status?.toLowerCase()}`}>
                  {voucher.status}
                </span>

                {voucher.usedBookingId && (
                  <small>Booking #{voucher.usedBookingId}</small>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default RewardsPage;