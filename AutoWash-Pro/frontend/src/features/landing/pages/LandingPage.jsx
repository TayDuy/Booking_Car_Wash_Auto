import { Link } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="app-container landing-header-inner">
          <Link to="/" className="landing-logo">
            <span>♢</span>
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
                <Link to="/auth/register" className="primary-button">
                  Đặt lịch ngay
                </Link>

                <a href="#services" className="secondary-button">
                  Khám phá dịch vụ
                </a>
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
              </div>
            </div>

            <div className="landing-hero-visual">
              <img src="/src/assets/hero.png" alt="Dịch vụ rửa xe tự động WashFlow Pro" />

              <div className="hero-floating-card">
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

      <footer className="landing-footer" id="contact">
        <div className="app-container landing-footer-grid">
          <div>
            <h3>WashFlow Pro</h3>
            <p>
              Hệ thống đặt lịch rửa xe tự động, tiện lợi và chuyên nghiệp cho
              khách hàng hiện đại.
            </p>
          </div>

          <div>
            <h4>Liên kết</h4>
            <a href="#services">Dịch vụ</a>
            <a href="#process">Quy trình</a>
            <a href="#pricing">Bảng giá</a>
          </div>

          <div>
            <h4>Hỗ trợ</h4>
            <Link to="/customer/support">Trợ giúp</Link>
            <Link to="/auth/login">Đăng nhập</Link>
            <Link to="/auth/register">Đăng ký</Link>
          </div>

          <div>
            <h4>Liên hệ</h4>
            <p>123 Đường Công Nghệ, TP.HCM</p>
            <p>1900 8888</p>
            <p>support@washflow.vn</p>
          </div>
        </div>

        <div className="landing-copyright">
          © 2026 WashFlow Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;