import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getActiveServices } from "../../../api/servicePackageService";
import PublicHeader from "../../../components/layout/PublicHeader";
import PublicFooter from "../../../components/layout/PublicFooter";
import "./LandingPage.css";

// Component Skeleton Loading khi chờ API Dịch Vụ
function PricingSkeletonCard() {
  return (
    <div className="pricing-card skeleton-card">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-price" />
      <div className="skeleton-line skeleton-text" />
      <div className="skeleton-line skeleton-text short" />
      <div className="skeleton-line skeleton-btn" />
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto redirect nếu đã login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const role = (localStorage.getItem("role") || "").toUpperCase();
      const home =
        {
          ADMIN: "/admin/dashboard",
          EMPLOYEE: "/employee/dashboard",
          MANAGER: "/manager/dashboard",
        }[role] || "/customer/home";
      navigate(home, { replace: true });
    }
  }, [navigate]);

  // Fetch dữ liệu từ API
  useEffect(() => {
    getActiveServices()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setServices(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Error fetching services:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price) =>
    (price ?? 0).toLocaleString("vi-VN") + " VND";

  return (
    <div className="landing-page-tech">
      {/* ================= HEADER ================= */}
      <PublicHeader />

      <main>
        {/* ================= HERO SECTION ================= */}
        <section className="landing-hero">
          <div className="hero-glow-bg"></div>
          <div className="app-container landing-hero-inner">
            <div className="landing-hero-content">
              <div className="landing-badge">
                <span className="pulse-dot"></span>
                Công Nghệ Rửa Xe Không Chạm 4.0
              </div>

              <h1>
                Đặt lịch rửa xe tự động <br />
                <span className="hero-accent">Nhanh Sạch Sâu</span> & Tự Động 100%
              </h1>

              <p>
                Đặt lịch giữ chỗ trong 30 giây. Công nghệ béc phun áp lực cao kết hợp dung dịch sinh học Châu Âu bảo vệ tuyệt đối lớp sơn bóng xe bạn.
              </p>

              <div className="landing-hero-actions">
                <Link to="/auth/register?action=booking" className="primary-button-glow">
                  Đặt Lịch Ngay
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>

                <a href="#services" className="secondary-button-glass">
                  Khám Phá Dịch Vụ
                </a>
              </div>

              {/* STATS RIBBON */}
              <div className="landing-stats">
                <div className="stat-card">
                  <strong>10K+</strong>
                  <span>Lượt phục vụ</span>
                </div>
                <div className="stat-card">
                  <strong>4.9★</strong>
                  <span>Đánh giá 5 sao</span>
                </div>
                <div className="stat-card">
                  <strong>15+</strong>
                  <span>Chi nhánh</span>
                </div>
                <div className="stat-card">
                  <strong>100%</strong>
                  <span>Không trầy xước</span>
                </div>
              </div>
            </div>

            {/* HERO VISUAL & FLOATING CARDS */}
            <div className="landing-hero-visual">
              <div className="image-frame">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBusDZKiAjWUqpYE8kcZ72qmfpiP3P_caQTtotdytOVOvkN4LLwnCgTIixQcgdtUYx0eoRH0pTJUahz2YC84oIvP-GQi5JrrRJhNK4NR3M62uHISS3Re-sN8VCgtxfdmu4jXAslkBQznhMXlefCt4jwQ8G4079R_cEd0vGQ3Bp_hyg6t9PqI8MMMIRBlPvSYeetNUXtWo20JfU0Q0qHYGhREDNZy5nikIHI1Tj5tE_-_RqeCLCJsY3NlZoRA0zB0uHTHEhIBCtVjyRd"
                  alt="WashFlow Pro Smart Car Wash"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= BENTO GRID: VÌ SAO CHỌN CHÚNG TÔI ================= */}
        <section className="landing-section" id="why-us">
          <div className="app-container">
            <div className="landing-section-heading">
              <span>ĐẮC QUYỀN VƯỢT TRỘI</span>
              <h2>Công Nghệ Tiên Tiến Cho Xế Yêu</h2>
              <p>Trải nghiệm dịch vụ khác biệt hoàn toàn so with các tiệm rửa xe truyền thống.</p>
            </div>

            <div className="bento-grid">
              <article className="bento-card bento-main">
                <div className="bento-icon">⚡</div>
                <h3>Rửa Xe Không Chạm Cực Nhanh</h3>
                <p>Sử dụng dòng nước áp lực cao bóc tách 99% bụi bẩn cứng đầu mà không cần dùng chổi hay khăn lau gây trầy xước dăm bề mặt sơn.</p>
                <div className="bento-tag">Tốc độ 10 phút</div>
              </article>

              <article className="bento-card">
                <div className="bento-icon">🧪</div>
                <h3>Hóa Chất Sinh Học Organic</h3>
                <p>Nhập khẩu trực tiếp từ Đức, phân hủy sinh học an toàn cho môi trường, không ăn mòn lớp mạ chrome và mâm xe.</p>
              </article>

              <article className="bento-card">
                <div className="bento-icon">📅</div>
                <h3>Đặt Lịch Thông Minh</h3>
                <p>Chủ động chọn giờ, không phải xếp hàng chờ đợi. Quản lý lịch sử dưỡng xe dễ dàng trên ứng dụng.</p>
              </article>

              <article className="bento-card bento-wide">
                <div className="bento-icon">🛡️</div>
                <h3>Phủ Bóng & Bảo Vệ Sơn Nano Tráng Kính</h3>
                <p>Tích hợp lớp xi phủ bóng tự động ngay trong chu trình rửa, tạo hiệu ứng lá sen kháng nước mưa và kháng bụi cực tốt.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ================= PROCESS SECTION ================= */}
        <section className="process-section" id="process">
          <div className="app-container">
            <div className="landing-section-heading light">
              <span>QUY TRÌNH TỐI ƯU</span>
              <h2>3 Bước Rửa Xe Siêu Tốc</h2>
            </div>

            <div className="process-steps-grid">
              <div className="process-step-item">
                <div className="step-badge">01</div>
                <h3>Chọn Dịch Vụ & Giờ</h3>
                <p>Truy cập ứng dụng, chọn gói dịch vụ và khung giờ trống tại chi nhánh gần bạn nhất.</p>
              </div>
              <div className="process-step-arrow">→</div>
              <div className="process-step-item">
                <div className="step-badge">02</div>
                <h3>Check-in Tự Động</h3>
                <p>Đến tiệm rửa, quét mã QR trên ứng dụng hoặc đọc biển số xe để vào làn rửa ưu tiên.</p>
              </div>
              <div className="process-step-arrow">→</div>
              <div className="process-step-item">
                <div className="step-badge">03</div>
                <h3>Nhận Xe & Thư Giãn</h3>
                <p>Thưởng thức cà phê tại phòng chờ tiêu chuẩn trong khi hệ thống hoàn tất rửa và sấy khô.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PRICING & API SERVICES SECTION ================= */}
        <section className="landing-section" id="services">
          <div className="app-container">
            <div className="landing-section-heading">
              <span>BẢNG GIẢ BẠCH MINH</span>
              <h2>Gói Dịch Vụ Phù Hợp Nhu Cầu</h2>
              <p>Giá niêm yết trọn gói, cam kết không phát sinh chi phí phụ thu tại tiệm.</p>
            </div>

            <div className="pricing-grid">
              {loading ? (
                <>
                  <PricingSkeletonCard />
                  <PricingSkeletonCard />
                  <PricingSkeletonCard />
                </>
              ) : services.length > 0 ? (
                services.map((srv, index) => {
                  const isFeatured = index === 1 || srv.isFeatured;
                  return (
                    <article
                      key={srv.id || srv._id || index}
                      className={`pricing-card ${isFeatured ? "featured" : ""}`}
                    >
                      {isFeatured && <span className="featured-badge">Khuyên Dùng</span>}
                      <h3>{srv.name || srv.packageName || "Gói Dịch Vụ"}</h3>
                      <strong>{formatPrice(srv.price)}</strong>
                      <p className="pricing-desc">
                        {srv.description || "Dịch vụ rửa xe tự động cao cấp, bảo vệ lớp sơn bóng."}
                      </p>
                      <ul>
                        {Array.isArray(srv.features) && srv.features.length > 0 ? (
                          srv.features.map((feat, fIdx) => <li key={fIdx}>{feat}</li>)
                        ) : (
                          <>
                            <li>Rửa xe công nghệ không chạm</li>
                            <li>Sấy khô tự động áp lực gió</li>
                            <li>Tẩy sạch lazang & lốp xe</li>
                          </>
                        )}
                      </ul>
                      <Link to="/auth/register" className="btn-select-package">
                        Lựa Chọn Gói
                      </Link>
                    </article>
                  );
                })
              ) : (
                /* Mẫu fallback nếu DB chưa có dữ liệu service */
                <>
                  <article className="pricing-card">
                    <h3>Gói Cơ Bản</h3>
                    <strong>150.000 VND</strong>
                    <p className="pricing-desc">Thích hợp rửa nhanh bụi bẩn hằng ngày.</p>
                    <ul>
                      <li>Rửa không chạm công nghệ Châu Âu</li>
                      <li>Sấy khô tự động 2 chiều</li>
                      <li>Dưỡng bóng lốp xe cao cấp</li>
                    </ul>
                    <Link to="/auth/register" className="btn-select-package">Chọn gói này</Link>
                  </article>

                  <article className="pricing-card featured">
                    <span className="featured-badge">Phổ Biến Nhất</span>
                    <h3>Gói Cao Cấp</h3>
                    <strong>350.000 VND</strong>
                    <p className="pricing-desc">Chăm sóc toàn diện ngoại thất & nội thất.</p>
                    <ul>
                      <li>Tất cả tính năng gói Standard</li>
                      <li>Phủ Nano tráng gương bảo vệ sơn</li>
                      <li>Vệ sinh nội thất & Khử mùi Ozone</li>
                      <li>Xịt gầm áp lực cao</li>
                    </ul>
                    <Link to="/auth/register" className="btn-select-package">Chọn gói này</Link>
                  </article>

                  <article className="pricing-card">
                    <h3>Gói Đặc Biệt</h3>
                    <strong>600.000 VND</strong>
                    <p className="pricing-desc">Dịch vụ chuyên sâu dành cho xe cao cấp.</p>
                    <ul>
                      <li>Tất cả tính năng Premium Pro</li>
                      <li>Tẩy ố kính & tẩy nhựa đường</li>
                      <li>Đánh bóng phục hồi độ bóng sơn</li>
                      <li>Bảo dưỡng khoang máy chuyên sâu</li>
                    </ul>
                    <Link to="/auth/register" className="btn-select-package">Chọn gói này</Link>
                  </article>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ================= MEMBERSHIP VIP SECTION ================= */}
        <section className="membership-section" id="membership">
          <div className="app-container membership-inner">
            <div className="membership-text">
              <h2>Đăng Ký Hội Viên <br /><span className="text-glow">Nhận Ngay 20% Ưu Đãi</span></h2>
              <p>
                Tích điểm tự động sau mỗi lần rửa, đổi quà tặng hấp dẫn và được quyền ưu tiên xếp lịch vào các giờ cao điểm cuối tuần.
              </p>
              <Link to="/auth/register?action=membership" className="primary-button-glow">
                Trở Thành Thành Viên VIP
              </Link>
            </div>

            <div className="member-card-wrapper">
              <div className="member-preview-card">
                <div className="card-top">
                  <span className="brand">AutoWash VIP</span>
                  <span className="tier">PLATINUM</span>
                </div>
                <div className="card-chip"></div>
                <strong className="card-number">AW-2026-8888</strong>
                <div className="card-bottom">
                  <span>Hội viên: Nguyễn Văn A</span>
                  <span className="points">2,450 PTS</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <PublicFooter />
    </div>
  );
}

export default LandingPage;