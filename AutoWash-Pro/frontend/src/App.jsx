import { useNavigate } from "react-router-dom";
import "./App.css";

function App() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* NAVBAR */}
      <header className="home-navbar">
        <div className="home-logo">WashFlow Pro</div>

        <nav className="home-menu">
          <a href="#services">Dịch vụ</a>
          <a href="#booking">Đặt lịch</a>
          <a href="#offers">Ưu đãi</a>
        </nav>

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
      </header>

      {/* HERO */}
      <main className="home-main">
        <section className="hero-section">
          <div className="hero-left">
            <div className="hero-badge">
              ⚡ Hệ thống tự động 100%
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
                onClick={() => navigate("/booking")}
              >
                Đặt lịch ngay →
              </button>

              <button
                className="outline-btn"
                onClick={() => navigate("/booking")}
              >
                Xem bảng giá
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="wash-image-card">
              <img
                src="/public/HomePage.png"
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
                <button onClick={() => navigate("/booking")}>Chi tiết</button>
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
                <button onClick={() => navigate("/booking")}>Chi tiết</button>
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
                <button onClick={() => navigate("/booking")}>Chi tiết</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;