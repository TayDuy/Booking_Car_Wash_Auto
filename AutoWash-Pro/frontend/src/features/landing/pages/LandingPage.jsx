import { Link } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
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
            <a href="#process">Quy trình</a>
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
                <p className="package-desc" style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
                  * Phù hợp cho xe di chuyển hàng ngày, cần làm sạch nhanh bụi bẩn đô thị.
                </p>
                <ul>
                  <li>Rửa thân xe và gầm xe bằng bọt tuyết công nghệ không chạm siêu sạch.</li>
                  <li>Xịt rửa áp lực cao loại bỏ bùn đất hốc bánh xe.</li>
                  <li>Hệ thống sấy khô tự động áp lực lớn, hạn chế vệt nước đọng.</li>
                  <li>Vệ sinh cơ bản bề mặt mâm (lazang) và làm bóng lốp xe.</li>
                  <li>Thời gian thực hiện: 15 phút.</li>
                </ul>
                <Link to="/auth/register?package=basic">Chọn gói</Link>
              </article>

              <article className="pricing-card featured">
                <span>Phổ biến nhất</span>
                <h3>Gói Cao Cấp</h3>
                <strong>350.000 VND</strong>
                <p className="package-desc" style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", marginBottom: "20px" }}>
                  * Giải pháp chăm sóc toàn diện cả trong lẫn ngoài được 80% khách hàng lựa chọn.
                </p>
                <ul>
                  <li>Bao gồm toàn bộ quy trình làm sạch sâu của Gói Cơ Bản</li>
                  <li>Phủ một lớp Nano Wax bảo vệ, tăng độ bóng sâu và tạo hiệu ứng lá sen chống bám nước bụi bẩn.</li>
                  <li>Hút bụi chi tiết toàn bộ thảm sàn, ghế ngồi và các khe kẽ nội thất.</li>
                  <li>Lau dưỡng bề mặt táp-lô, táp-pi cửa bằng dung dịch chuyên dụng.</li>
                  <li>Xông tinh dầu diệt khuẩn, khử mùi ẩm mốc khoang cabin.</li>
                  <li>Thời gian thực hiện: 35 - 40 phút.</li>
                </ul>
                <Link to="/auth/register?package=premium">Chọn gói</Link>
              </article>

              <article className="pricing-card">
                <h3>Gói Đặc Biệt</h3>
                <strong>600.000 VND</strong>
                <p className="package-desc" style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
                  * Dành cho xe đi tỉnh, xe lâu ngày chưa chăm sóc hoặc chuẩn bị đi sự kiện quan trọng.
                </p>
                <ul>
                  <li>Bao gồm toàn bộ quy trình cao cấp của Gói Cao Cấp</li>
                  <li>Tẩy chuyên sâu các vết ố kính, bụi sắt, nhựa đường và mủ cây bám trên bề mặt sơn.</li>
                  <li>Đánh bóng nhẹ (vớt bóng) loại bỏ các vết xước dăm nhẹ, phục hồi độ tươi của màu sơn gốc.</li>
                  <li>Vệ sinh và dưỡng chi tiết lồng dè, mâm xe chuyên sâu.</li>
                  <li>Dọn sạch bụi bẩn và dưỡng bảo vệ các đường ống cao su trong khoang máy.</li>
                  <li>Thời gian thực hiện: 70 - 90 phút.</li>
                </ul>
                <Link to="/auth/register?package=special">Chọn gói</Link>
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