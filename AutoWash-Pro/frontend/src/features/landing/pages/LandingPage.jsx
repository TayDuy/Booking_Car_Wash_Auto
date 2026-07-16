import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const role = (localStorage.getItem("role") || "").toUpperCase();
      const home = { ADMIN: "/admin/dashboard", EMPLOYEE: "/employee/dashboard", MANAGER: "/manager/dashboard" }[role] || "/customer/home";
      navigate(home, { replace: true });
      return;
    }
  }, []);

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
      <header className="landing-header">
        <div className="app-container landing-header-inner">
          <Link to="/" className="landing-logo">
            <img src="/logo.png" alt="Logo" style={{ height: "36px", width: "auto" }} />
            WashFlow Pro
          </Link>

          <nav className="landing-nav">
            <a href="#services">Dịch vụ</a>
            <a href="#process">Đặt lịch</a>
            <a href="#pricing">Bảng giá</a>
            <a href="#contact">Liên hệ</a>
          </nav>

          <div className="landing-actions">
            <Link to="/auth/login" className="landing-login">
              Đăng nhập
            </Link>
            <Link to="/auth/register" className="landing-register">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

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
                <Link to="/auth/register?action=booking" className="primary-button">
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

        {/* ================= SECTION: DỊCH VỤ (SERVICES) ================= */}
        <section className="landing-section" id="services">
          <div className="app-container">
            <div className="landing-section-heading">
              <span>Vì sao chọn chúng tôi?</span>
              <h2>Dịch vụ rửa xe công nghệ cao, nhanh và chuyên nghiệp</h2>
              <p>
                WashFlow Pro ứng dụng dây chuyền tự động hiện đại giúp tối ưu trải nghiệm, 
                đảm bảo chiếc xe của bạn luôn được chăm sóc một cách hoàn hảo nhất.
              </p>
            </div>

            <div className="landing-feature-grid">
              <article className="landing-feature-card">
                <div>💧</div>
                <h3>Công nghệ không chạm</h3>
                <p>
                  Sử dụng dung dịch rã chất bẩn chuyên dụng chuẩn Châu Âu kết hợp béc phun áp lực cao. 
                  Hạn chế tối đa ma sát từ khăn lau hay chổi rửa, giúp bảo vệ lớp bóng bề mặt sơn xe, 
                  cam kết 100% không gây xước dăm.
                </p>
              </article>

              <article className="landing-feature-card">
                <div>⏱</div>
                <h3>Tiết kiệm thời gian</h3>
                <p>
                  Hệ thống cảm biến thông minh định vị phom xe tự động, tối ưu hóa các chu trình 
                  phun bọt, rửa gầm và sấy khô chỉ trong 10 - 15 phút. Bạn chỉ cần đặt lịch trước, 
                  đến nơi là rửa ngay không cần chờ đợi xếp hàng.
                </p>
              </article>

              <article className="landing-feature-card">
                <div>🛡</div>
                <h3>Hóa chất chuẩn sinh học</h3>
                <p>
                  Tất cả dung dịch rửa, phủ bóng bóng Nano và dưỡng lốp đều là hàng nhập khẩu chính hãng, 
                  đạt chứng nhận an toàn sinh học. Không gây ăn mòn các chi tiết cao su, mạ chrome 
                  và cực kỳ thân thiện với môi trường.
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
              <Link to="/auth/register?action=booking" className="primary-button">
                Bắt đầu ngay
              </Link>
            </div>
          </div>
        </section>

        {/* ================= SECTION: BẢNG GIÁ (PRICING) ================= */}
        <section className="landing-section" id="pricing">
          <div className="app-container">
            <div className="landing-section-heading">
              <span>Bảng giá dịch vụ</span>
              <h2>Chọn gói dịch vụ phù hợp với nhu cầu của bạn</h2>
              <p>
                Giá niêm yết trọn gói, cam kết không phát sinh chi phí phụ thu tại tiệm.
              </p>
            </div>

            <div className="pricing-grid">
              <article className="pricing-card">
                <h3>Gói Cơ Bản</h3>
                <strong>150.000 VND</strong>
                <ul>
                  <li>Rửa không chạm</li>
                  <li>Làm khô tự động</li>
                  <li>Vệ sinh lốp xe</li>
                </ul>
                <Link to="/auth/register">Chọn gói</Link>
              </article>

              <article className="pricing-card featured">
                <span>Phổ biến nhất</span>
                <h3>Gói Cao Cấp</h3>
                <strong>350.000 VND</strong>
                <ul>
                  <li>Tất cả từ gói cơ bản</li>
                  <li>Phủ nano bảo vệ sơn</li>
                  <li>Vệ sinh nội thất cơ bản</li>
                  <li>Khử mùi khoang xe</li>
                </ul>
                <Link to="/auth/register">Chọn gói</Link>
              </article>

              <article className="pricing-card">
                <h3>Gói Đặc Biệt</h3>
                <strong>600.000 VND</strong>
                <ul>
                  <li>Tất cả từ gói cao cấp</li>
                  <li>Đánh bóng bề mặt chuyên sâu</li>
                  <li>Tẩy ố kính và lazang</li>
                  <li>Bảo dưỡng khoang máy</li>
                </ul>
                <Link to="/auth/register">Chọn gói</Link>
              </article>
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
              <Link to="/auth/register?action=membership" className="primary-button">
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
