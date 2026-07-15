import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getActiveServices } from "../../../api/servicePackageService";
import PublicHeader from "../../../components/layout/PublicHeader";
import PublicFooter from "../../../components/layout/PublicFooter";
import heroImage from "../../../assets/hero.png";
import "./LandingPage.css";

function PricingSkeletonCard() {
  return (
    <article className="pricing-card skeleton">
      <div className="skeleton-box skeleton-title" style={{ height: "24px", width: "60%", marginBottom: "16px" }} />
      <div className="skeleton-box skeleton-price" style={{ height: "36px", width: "40%", marginBottom: "20px" }} />
      <div className="skeleton-box skeleton-desc" style={{ height: "14px", width: "100%", marginBottom: "8px" }} />
      <div className="skeleton-box skeleton-desc" style={{ height: "14px", width: "80%", marginBottom: "24px" }} />
      <div className="skeleton-box skeleton-btn" style={{ height: "40px", width: "100%" }} />
    </article>
  );
}

function LandingPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveServices()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setServices(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price) =>
    (price ?? 0).toLocaleString("vi-VN") + " VND";

  return (
    <div className="landing-page">
      <PublicHeader />

      <main>
        <section className="landing-hero">
          <div className="app-container landing-hero-inner">
            <div className="landing-hero-content">
              <span className="landing-badge">Công nghệ rửa xe 4.0</span>

              <h1>
                Đặt lịch rửa xe tự động nhanh chóng, sạch sâu và tiện lợi
              </h1>

              <p>
                WashFlow Pro giúp bạn đặt lịch rửa xe online, chọn chi nhánh,
                chọn dịch vụ, theo dõi lịch sử và nhận ưu đãi chỉ trong vài
                thao tác.
              </p>

              <div className="landing-hero-actions">
                <Link to="/auth/register" className="primary-button">
                  Đặt lịch ngay
                </Link>

                <Link to="/services" className="secondary-button">
                  Khám phá dịch vụ
                </Link>
              </div>
            </div>

            <div className="landing-hero-visual">
              <img src={heroImage} alt="Dịch vụ rửa xe tự động WashFlow Pro" />
            </div>

            <div className="landing-stats">
              <div>
                <strong>10K+</strong>
                <span>Lượt đặt lịch</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Đánh giá dịch vụ</span>
              </div>
              <div>
                <strong>15+</strong>
                <span>Chi nhánh hỗ trợ</span>
              </div>
              <div>
                <strong>100% không chạm</strong>
                <span>An toàn cho mọi loại sơn</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="services">
          <div className="app-container">
            <div className="landing-section-heading">
              <span>Vì sao chọn chúng tôi?</span>
              <h2>Dịch vụ rửa xe công nghệ cao, nhanh và chuyên nghiệp</h2>
              <p>
                WashFlow Pro tối ưu trải nghiệm đặt lịch và chăm sóc xe cho
                khách hàng hiện đại.
              </p>
            </div>

            <div className="landing-feature-grid">
              <article className="landing-feature-card">
                <div>💧</div>
                <h3>Công nghệ không chạm</h3>
                <p>
                  Hạn chế ma sát trực tiếp, giúp bảo vệ bề mặt sơn xe tốt hơn.
                </p>
              </article>

              <article className="landing-feature-card">
                <div>⏱</div>
                <h3>Tiết kiệm thời gian</h3>
                <p>
                  Đặt lịch online, chọn khung giờ phù hợp và giảm thời gian chờ.
                </p>
              </article>

              <article className="landing-feature-card">
                <div>🛡</div>
                <h3>Bảo vệ xe tốt hơn</h3>
                <p>
                  Quy trình chăm sóc xe chuyên nghiệp, phù hợp nhiều dòng xe.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="process-section" id="process">
          <div className="app-container process-inner">
            <div>
              <span className="landing-badge">Quy trình</span>
              <h2>Đặt lịch rửa xe chỉ với 3 bước</h2>

              <div className="process-list">
                <div>
                  <strong>1</strong>
                  <span>Chọn chi nhánh và dịch vụ rửa xe</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>Chọn ngày, giờ phù hợp với lịch của bạn</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>Xác nhận đặt lịch và mang xe đến đúng giờ</span>
                </div>
              </div>
            </div>

            <div className="process-card">
              <h3>Đặt lịch thông minh</h3>
              <p>
                Hệ thống giúp bạn kiểm tra khung giờ, chi nhánh và dịch vụ còn
                khả dụng trước khi xác nhận.
              </p>
              <Link to="/auth/register" className="primary-button">
                Bắt đầu ngay
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-section" id="pricing">
          <div className="app-container">
            <div className="landing-section-heading">
              <span>Bảng giá</span>
              <h2>Chọn gói dịch vụ phù hợp với xe của bạn</h2>
              <p>
                Giá tham khảo có thể thay đổi theo chi nhánh, loại xe và chương
                trình ưu đãi.
              </p>
            </div>

            <div className="pricing-grid">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <PricingSkeletonCard key={idx} />
                ))
              ) : services.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#64748b" }}>
                  Không tìm thấy gói dịch vụ nào đang hoạt động.
                </div>
              ) : (
                services.slice(0, 6).map((svc, idx) => (
                  <article
                    key={svc.serviceId || svc.id}
                    className={`pricing-card${idx === 1 ? " featured" : ""}`}
                  >
                    {idx === 1 && <span>Phổ biến nhất</span>}
                    <h3>{svc.serviceName || svc.name}</h3>
                    <strong>{formatPrice(svc.basePrice)}</strong>
                    <p className="pricing-desc">{svc.description}</p>
                    <ul>
                      <li>⏱ {svc.durationMinutes} phút</li>
                      <li>Giá chưa bao gồm phụ phí</li>
                      <li>Áp dụng tại tất cả chi nhánh</li>
                    </ul>
                    <Link to="/auth/register">Chọn gói</Link>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="membership-section">
          <div className="app-container membership-inner">
            <div>
              <h2>Trở thành hội viên và nhận ưu đãi</h2>
              <p>
                Tích điểm sau mỗi lần sử dụng dịch vụ, đổi mã giảm giá và nhận
                ưu tiên đặt lịch vào khung giờ cao điểm.
              </p>
              <Link to="/auth/register" className="primary-button">
                Đăng ký thành viên
              </Link>
            </div>

            <div className="member-preview-card">
              <span>PLATINUM</span>
              <strong>WF-2026-8888</strong>
              <p>Điểm tích lũy: 2,450 pts</p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default LandingPage;
