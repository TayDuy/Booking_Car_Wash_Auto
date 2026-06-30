import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { isLoggedIn } from "./api/authService";

function App() {
  const navigate = useNavigate();

  // Trạng thái đăng nhập — quyết định hiện/ẩn nút "Đăng nhập/Đăng ký"
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    // Đồng bộ lại trạng thái mỗi khi quay về trang chủ (vd: sau khi đăng nhập ở tab khác)
    setLoggedIn(isLoggedIn());

    const handleStorageChange = () => setLoggedIn(isLoggedIn());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const scrollToServices = (e) => {
    e.preventDefault();
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDatLich = (e) => {
    e.preventDefault();
    if (loggedIn) {
      navigate("/booking");
    } else {
      navigate("/login");
    }
  };

  const handleUuDai = (e) => {
    e.preventDefault();
    if (loggedIn) {
      navigate("/subscription");
    } else {
      navigate("/login");
    }
  };

  return (
      <div className="home-page">
        {/* NAVBAR */}
        <header className="home-navbar">
          <div className="home-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '48px', width: 'auto' }} />
            <span>WashFlow Pro</span>
          </div>

          <nav className="home-menu">
            <a href="#services" onClick={scrollToServices}>Dịch vụ</a>
            <a href="#booking" onClick={handleDatLich}>Đặt lịch</a>
            <a href="#offers" onClick={handleUuDai}>Ưu đãi</a>
          </nav>

          {!loggedIn && (
              <div className="home-actions-top">
                <button
                    className="login-btn"
                    onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </button>

                <button
                    className="register-btn"
                    onClick={() => navigate("/register")}
                >
                  Đăng ký
                </button>
              </div>
          )}
        </header>

        {/* HERO */}
        <main className="home-main">
          <section className="hero-section">
            <div className="hero-left">
              <div className="hero-badge">
                ✨ Hệ thống tự động 100%
              </div>

              <h1>
                Rửa xe thông minh -
                <br />
                <span>Tiết kiệm thời gian</span>
              </h1>

              <p>
                Trải nghiệm công nghệ làm sạch tiên tiến nhất.
                <br />
                Nhanh chóng, an toàn tuyệt đối cho bề mặt
                <br />
                sơn và thân thiện với môi trường.
              </p>

              <div className="hero-buttons">
                <button
                    className="primary-btn"
                    onClick={handleDatLich}
                >
                  Đặt lịch ngay →
                </button>

                <button
                    className="outline-btn"
                    onClick={scrollToServices}
                >
                  Xem bảng giá
                </button>
              </div>
            </div>

            <div className="hero-right">
              <div className="wash-image-card">
                <img
                    src="/HomePage.png"
                    alt="Dịch vụ rửa xe tự động"
                    className="hero-car-image"
                />

                <div className="status-card">
                  <div className="status-top">
                    <span>Trạng thái khoang rửa</span>
                    <strong>
                      <span className="dot"></span>
                      Hoạt động
                    </strong>
                  </div>

                  <div className="bay-info">
                    <span>Khoang 01</span>
                    <b>75%</b>
                  </div>

                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SERVICES */}
          <section className="services-section" id="services">
            <div className="section-heading">
              <h2>Dịch vụ của chúng tôi</h2>
              <p>Lựa chọn gói chăm sóc phù hợp với nhu cầu của xe bạn.</p>
            </div>

            <div className="service-grid">
              <div className="service-card">
                <div className="service-icon">🚗</div>
                <span className="service-tag">Cơ bản</span>
                <h3>Rửa tiêu chuẩn</h3>
                <p>
                  Làm sạch bên ngoài, rửa bọt tuyết, xịt gầm và lau khô nhanh chóng.
                </p>
                <div className="service-bottom">
                  <strong>80k</strong>
                  <button onClick={handleDatLich}>Chi tiết</button>
                </div>
              </div>

              <div className="service-card popular">
                <div className="service-icon">💦</div>
                <span className="service-tag">Phổ biến</span>
                <h3>Rửa cao cấp</h3>
                <p>
                  Bao gồm rửa tiêu chuẩn, vệ sinh lốp, phủ bóng nhẹ và chăm sóc chi tiết.
                </p>
                <div className="service-bottom">
                  <strong>150k</strong>
                  <button onClick={handleDatLich}>Chi tiết</button>
                </div>
              </div>

              <div className="service-card">
                <div className="service-icon">✨</div>
                <span className="service-tag">Premium</span>
                <h3>Chăm sóc toàn diện</h3>
                <p>
                  Rửa xe, vệ sinh nội thất, khử mùi, phủ bảo vệ sơn và tích điểm thành viên.
                </p>
                <div className="service-bottom">
                  <strong>250k</strong>
                  <button onClick={handleDatLich}>Chi tiết</button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="global-footer-bar">
          <div className="footer-brand-info">
            <h4>WashFlow Pro</h4>
            <p>© 2026 WashFlow Pro Automation. Tất cả quyền được bảo lưu.</p>
          </div>
          <div className="footer-nav-links">
            <a href="#">Liên hệ</a>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Điều khoản dịch vụ</a>
            <a href="#">Hỗ trợ</a>
          </div>
        </footer>
      </div>
  );
}

export default App;