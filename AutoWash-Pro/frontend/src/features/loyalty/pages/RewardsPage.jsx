import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getAllRewards,
  getMyRewards,
  redeemReward,
} from "../../../api/customerRewardApi";
import { getMyTier } from "../../../api/loyaltyApi";
import "./RewardsPage.css";

function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const customerId = localStorage.getItem("customerId");
  const fullName = localStorage.getItem("fullName") || "Khách hàng thân thiết";

  useEffect(() => {
    loadRewardsPage();
  }, []);

  async function loadRewardsPage() {
    try {
      setLoading(true);
      setMessage("");

      const [rewardData, voucherData, tierData] = await Promise.all([
        getAllRewards(),
        customerId ? getMyRewards(customerId) : Promise.resolve([]),
        getMyTier(),
      ]);

      setRewards(Array.isArray(rewardData) ? rewardData : rewardData?.data || []);
      setVouchers(Array.isArray(voucherData) ? voucherData : voucherData?.data || []);
      
      const rawTier = tierData?.data || tierData || null;
      setLoyaltyInfo(rawTier);
    } catch (error) {
      console.error("Load rewards error:", error);
      setMessage("Không thể tải thông tin quyền lợi thành viên.");
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

      setMessage("Đổi voucher thành công! Voucher đã được thêm vào ví của bạn.");
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

  // Định nghĩa formatMoney thủ công ở đây
  function formatMoney(value) {
    if (value === null || value === undefined) return "0đ";
    return `${Number(value).toLocaleString("vi-VN")}đ`;
  }

  function formatPoint(value) {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("vi-VN");
  }

  // Lấy thông tin thăng hạng
  const getTierDetails = () => {
    const currentTierName = loyaltyInfo?.tierName || "Member";
    const totalVisits = loyaltyInfo?.totalVisits || 0;
    const totalSpending = Number(loyaltyInfo?.totalSpending || 0);
    const pointBalance = loyaltyInfo?.currentBalance || 0;

    let tierClass = "tier-member";
    let nextTierName = "";
    let missingVisits = 0;
    let missingSpending = 0;
    let progressPercent = 0;

    let visualProgressPercent = 0;
    if (currentTierName === "Platinum") {
      tierClass = "tier-platinum";
      nextTierName = "Hạng cao nhất";
      progressPercent = 100;
      visualProgressPercent = 100;
    } else if (currentTierName === "Gold") {
      tierClass = "tier-gold";
      nextTierName = "Platinum";
      missingVisits = Math.max(0, 60 - totalVisits);
      missingSpending = Math.max(0, 15000000 - totalSpending);
      // Tính progress dựa trên tiêu chí nào gần đạt hơn (Shopee Style - OR)
      const visitPercent = Math.min(100, (totalVisits / 60) * 100);
      const spendPercent = Math.min(100, (totalSpending / 15000000) * 100);
      progressPercent = Math.max(visitPercent, spendPercent);
      visualProgressPercent = 66.66 + (progressPercent * 33.34 / 100);
    } else if (currentTierName === "Silver") {
      tierClass = "tier-silver";
      nextTierName = "Gold";
      missingVisits = Math.max(0, 25 - totalVisits);
      missingSpending = Math.max(0, 5000000 - totalSpending);
      const visitPercent = Math.min(100, (totalVisits / 25) * 100);
      const spendPercent = Math.min(100, (totalSpending / 5000000) * 100);
      progressPercent = Math.max(visitPercent, spendPercent);
      visualProgressPercent = 33.33 + (progressPercent * 33.33 / 100);
    } else {
      tierClass = "tier-member";
      nextTierName = "Silver";
      missingVisits = Math.max(0, 10 - totalVisits);
      missingSpending = Math.max(0, 2000000 - totalSpending);
      const visitPercent = Math.min(100, (totalVisits / 10) * 100);
      const spendPercent = Math.min(100, (totalSpending / 2000000) * 100);
      progressPercent = Math.max(visitPercent, spendPercent);
      visualProgressPercent = progressPercent * 33.33 / 100;
    }

    return {
      currentTierName,
      tierClass,
      nextTierName,
      missingVisits,
      missingSpending,
      progressPercent: Math.round(progressPercent),
      visualProgressPercent: Math.round(visualProgressPercent * 100) / 100,
      pointBalance,
      totalVisits,
      totalSpending,
    };
  };

  const tierInfo = getTierDetails();

  const welcomeVouchers = vouchers.filter((v) => {
    if (v.redeemedPoints === 0 || v.voucherCode?.includes("TIER")) return true;
    const match = rewards.find((r) => r.rewardId === v.rewardId);
    return !!(match && match.requiredTierLevel !== null && match.requiredPoints <= 1);
  });
  const redeemedVouchers = vouchers.filter((v) => {
    const isWelcome = v.redeemedPoints === 0 || v.voucherCode?.includes("TIER") || (() => {
      const match = rewards.find((r) => r.rewardId === v.rewardId);
      return !!(match && match.requiredTierLevel !== null && match.requiredPoints <= 1);
    })();
    return !isWelcome;
  });

  // Danh sách rewards có thể đổi điểm
  const redeemableRewards = rewards.filter((r) => {
    // 1. Kiểm tra hạng thành viên tối thiểu
    const customerTierLevel = loyaltyInfo?.tierId || 1;
    if (r.requiredTierLevel !== null && r.requiredTierLevel !== undefined && r.requiredTierLevel > customerTierLevel) {
      return false;
    }
    // 2. Loại trừ quà chào mừng welcome rewards đã được nhận/đổi
    const isWelcome = r.requiredTierLevel !== null && r.requiredTierLevel !== undefined && r.requiredPoints <= 1;
    if (isWelcome) {
      const alreadyHas = vouchers.some((v) => v.rewardId === r.rewardId);
      return !alreadyHas;
    }
    return true;
  });

  return (
    <div className="rewards-page">
      {/* Nút quay lại */}
      <div className="rewards-back-nav">
        <Link to="/customer/promotions" className="back-link">
          ← Quay lại Trung tâm Ưu đãi
        </Link>
      </div>

      {/* Hero Section - Thẻ Thành Viên Metallic Cao Cấp */}
      <section className="loyalty-hero-section">
        <div className="loyalty-hero-container">
          <div className="loyalty-hero-intro">
            <span className="premium-badge">WASHFLOW CLUB</span>
            <h1>Trung Tâm Quyền Lợi Thành Viên</h1>
            <p>
              Tích lũy chi tiêu và số lượt rửa xe tự động để thăng hạng. Mỗi cấp độ hạng sẽ mở khóa những đặc quyền, ưu đãi và voucher chào mừng thăng hạng giá trị cao.
            </p>
          </div>

          {/* Thẻ thành viên Premium */}
          <div className={`loyalty-membership-card ${tierInfo.tierClass}`}>
            <div className="card-shine"></div>
            <div className="card-header">
              <div className="card-brand">
                <span className="brand-logo">★</span>
                <span>WASHFLOW PRO</span>
              </div>
              <span className="card-chip"></span>
            </div>

            <div className="card-body">
              <span className="card-label">Hạng thành viên</span>
              <h2 className="card-tier-name">{tierInfo.currentTierName}</h2>
              <div className="card-number">WF-{(customerId || "0000").padStart(4, "0")}-2026</div>
            </div>

            <div className="card-footer">
              <div className="card-holder">
                <span>Chủ thẻ</span>
                <strong>{fullName}</strong>
              </div>
              <div className="card-points">
                <span>Điểm tích lũy</span>
                <strong>{formatPoint(tierInfo.pointBalance)} pts</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiến Trình Thăng Hạng */}
      <section className="loyalty-progress-section">
        <div className="progress-card">
          <div className="progress-header">
            <h3>Tiến trình thăng hạng của bạn</h3>
            <span className="progress-percentage">{tierInfo.progressPercent}%</span>
          </div>

          <div className="progress-track-container">
            <div className="progress-bar-glow">
              <div
                className="progress-fill-active"
                style={{ width: `${tierInfo.visualProgressPercent}%` }}
              ></div>
            </div>
            <div className="progress-nodes">
              <div className="node active">
                <span className="node-dot"></span>
                <span className="node-label">Member</span>
              </div>
              <div className={`node ${tierInfo.totalSpending >= 2000000 || tierInfo.totalVisits >= 10 ? "active" : ""}`}>
                <span className="node-dot"></span>
                <span className="node-label">Silver</span>
              </div>
              <div className={`node ${tierInfo.totalSpending >= 5000000 || tierInfo.totalVisits >= 25 ? "active" : ""}`}>
                <span className="node-dot"></span>
                <span className="node-label">Gold</span>
              </div>
              <div className={`node ${tierInfo.totalSpending >= 15000000 || tierInfo.totalVisits >= 60 ? "active" : ""}`}>
                <span className="node-dot"></span>
                <span className="node-label">Platinum</span>
              </div>
            </div>
          </div>

          <div className="progress-footer">
            <div className="stat-pill">
              <span>Đã tích lũy:</span>
              <strong>{formatMoney(tierInfo.totalSpending)} chi tiêu</strong>
              <span className="divider">|</span>
              <strong>{tierInfo.totalVisits} lượt rửa</strong>
            </div>

            <p className="progress-tip">
              {tierInfo.nextName === "Hạng cao nhất" ? (
                "🎉 Tuyệt vời! Bạn đang ở hạng thành viên cao nhất với mọi đặc quyền tối thượng."
              ) : (
                <>
                  Đạt thêm <strong>{tierInfo.missingVisits} lượt rửa</strong> hoặc{" "}
                  <strong>{formatMoney(tierInfo.missingSpending)}</strong> để thăng hạng{" "}
                  <strong className="next-tier-highlight">{tierInfo.nextName}</strong>.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {message && <div className="rewards-alert-toast">{message}</div>}

      {/* Bảng Quyền Lợi Thành Viên */}
      <section className="tiers-benefits-section">
        <div className="section-header">
          <h2>Bảng chi tiết đặc quyền thành viên</h2>
          <p>Tham khảo quyền lợi và cơ chế thăng hạng Shopee Style (Đạt lượt rửa HOẶC Chi tiêu)</p>
        </div>

        <div className="benefits-matrix-container">
          <table className="benefits-table">
            <thead>
              <tr>
                <th>Hạng thành viên</th>
                <th>Điều kiện (OR)</th>
                <th>Quà thăng hạng</th>
                <th>Ưu đãi rửa xe</th>
                <th>Đặc quyền đi kèm</th>
              </tr>
            </thead>
            <tbody>
              <tr className={tierInfo.currentTierName === "Member" ? "current-row" : ""}>
                <td className="tier-col member">
                  <span className="tier-icon">🥉</span> Member
                </td>
                <td>Mặc định khi đăng ký</td>
                <td>—</td>
                <td>Tích lũy 1 điểm / 10.000đ</td>
                <td>Đổi voucher từ catalog</td>
              </tr>
              <tr className={tierInfo.currentTierName === "Silver" ? "current-row" : ""}>
                <td className="tier-col silver">
                  <span className="tier-icon">🥈</span> Silver
                </td>
                <td>10 lượt rửa hoặc 2.000.000đ</td>
                <td>Voucher 50.000đ</td>
                <td>Tích lũy điểm + Giờ vàng ưu đãi</td>
                <td>Được đặt lịch trước 14 ngày</td>
              </tr>
              <tr className={tierInfo.currentTierName === "Gold" ? "current-row" : ""}>
                <td className="tier-col gold">
                  <span className="tier-icon">🥇</span> Gold
                </td>
                <td>25 lượt rửa hoặc 5.000.000đ</td>
                <td>Voucher 100.000đ</td>
                <td>Giảm giá 5% tất cả hóa đơn</td>
                <td>Đặt lịch trước 30 ngày + Ưu tiên lễ Tết</td>
              </tr>
              <tr className={tierInfo.currentTierName === "Platinum" ? "current-row" : ""}>
                <td className="tier-col platinum">
                  <span className="tier-icon">💎</span> Platinum
                </td>
                <td>60 lượt rửa hoặc 15.000.000đ</td>
                <td>Voucher 150.000đ</td>
                <td>Giảm giá 10% tất cả hóa đơn</td>
                <td>Đặt lịch không giới hạn + Quà sinh nhật + Priority Lane</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Quà Thăng Hạng Của Bạn */}
      <section className="rewards-section">
        <div className="section-header">
          <h2>Quà tặng thăng hạng của bạn</h2>
          <p>Voucher thăng hạng miễn phí tự động cấp vào ví khi bạn đạt cấp độ mới.</p>
        </div>

        <div className="welcome-vouchers-container">
          {welcomeVouchers.length === 0 ? (
            <div className="empty-state-card">
              <span className="empty-icon">🎁</span>
              <p>Bạn chưa có quà tặng thăng hạng nào. Hãy nâng cấp lên hạng Bạc để mở khóa quà tặng đầu tiên!</p>
            </div>
          ) : (
            <div className="welcome-vouchers-grid">
              {welcomeVouchers.map((voucher) => (
                <div className={`welcome-voucher-card ${voucher.status?.toLowerCase()}`} key={voucher.customerRewardId}>
                  <div className="voucher-card-inner">
                    <div className="voucher-left-side">
                      <div className="voucher-glow"></div>
                      <span className="voucher-tag">Welcome Gift</span>
                      <h3>{voucher.rewardName}</h3>
                      <div className="voucher-val-display">{formatMoney(voucher.discountValue)}</div>
                    </div>
                    <div className="voucher-right-side">
                      <span className="voucher-code">{voucher.voucherCode}</span>
                      <span className={`voucher-pill ${voucher.status?.toLowerCase()}`}>
                        {voucher.status === "UNUSED" ? "Chưa dùng" : voucher.status === "USED" ? "Đã dùng" : "Hết hạn"}
                      </span>
                      {voucher.expiredAt && (
                        <span className="voucher-expiry">
                          Hạn: {new Date(voucher.expiredAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Đổi Điểm Nhận Voucher */}
      <section className="rewards-section">
        <div className="section-header">
          <h2>Đổi điểm tích lũy lấy Voucher</h2>
          <p>Sử dụng điểm tích lũy khả dụng để đổi thêm các voucher giảm giá khi đặt lịch.</p>
        </div>

        {loading && <div className="rewards-page-loading">Đang tải dữ liệu quà tặng...</div>}

        <div className="reward-grid">
          {redeemableRewards.map((reward, index) => {
            const hasEnoughPoints = tierInfo.pointBalance >= reward.requiredPoints;
            return (
              <article className="reward-card-premium" key={reward.rewardId}>
                <div className={`reward-visual bg-grad-${(index % 3) + 1}`}>
                  <span className="reward-points-tag">{formatPoint(reward.requiredPoints)} điểm</span>
                  <div className="reward-glow-ball"></div>
                </div>

                <div className="reward-content">
                  <h3>{reward.rewardName}</h3>
                  <div className="reward-details-row">
                    <div>
                      <span>Giá trị giảm</span>
                      <strong>{formatMoney(reward.rewardValue)}</strong>
                    </div>
                    <div>
                      <span>Dành cho xe</span>
                      <strong>{reward.vehicleType === "both" ? "Tất cả xe" : "Ô tô"}</strong>
                    </div>
                  </div>

                  <button
                    className={`reward-action-btn ${hasEnoughPoints ? "active" : "disabled"}`}
                    disabled={loading || !hasEnoughPoints}
                    onClick={() => handleRedeem(reward.rewardId)}
                  >
                    {hasEnoughPoints ? "Đổi ngay" : `Thiếu ${formatPoint(reward.requiredPoints - tierInfo.pointBalance)} điểm`}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Lịch Sử Đổi Điểm & Voucher Đã Đổi */}
      <section className="rewards-section">
        <div className="section-header">
          <h2>Voucher đã đổi từ điểm tích lũy</h2>
          <p>Danh sách các voucher bạn đã chủ động đổi từ điểm thưởng trước đó.</p>
        </div>

        <div className="redeemed-vouchers-list">
          {redeemedVouchers.length === 0 ? (
            <div className="empty-state-card flat">
              <p>Bạn chưa chủ động đổi voucher nào từ điểm tích lũy.</p>
            </div>
          ) : (
            <div className="vouchers-list-wrapper">
              {redeemedVouchers.map((voucher) => (
                <article className="redeemed-voucher-card-row" key={voucher.customerRewardId}>
                  <div className="voucher-row-left">
                    <div className="voucher-points-badge">{voucher.redeemedPoints} pts</div>
                    <div className="voucher-row-text">
                      <h4>{voucher.rewardName}</h4>
                      <div className="voucher-row-details">
                        <span>Mã: <strong>{voucher.voucherCode}</strong></span>
                        <span className="dot">•</span>
                        <span>Trị giá: <strong>{formatMoney(voucher.discountValue)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="voucher-row-right">
                    <span className={`status-pill ${voucher.status?.toLowerCase()}`}>
                      {voucher.status === "UNUSED" ? "Chưa dùng" : voucher.status === "USED" ? "Đã dùng" : "Hết hạn"}
                    </span>
                    {voucher.usedBookingId && (
                      <span className="used-booking-text">Áp dụng: Booking #{voucher.usedBookingId}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RewardsPage;