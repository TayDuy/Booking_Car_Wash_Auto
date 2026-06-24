import React from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import "./HomePage.css";

export default function Home() {
  const navigate = useNavigate();

  const services = [
    {
      badge: "Cơ bản",
      title: "Rửa tiêu chuẩn",
      desc: "Làm sạch bên ngoài với bọt tuyết siêu mịn, xịt gầm và lau khô nhanh chóng. Phù hợp vệ sinh hàng ngày.",
      price: "80k",
      iconClass: "icon-blue-light",
      icon: "🚗"
    },
    {
      badge: "Nâng cao",
      title: "Rửa cao cấp",
      desc: "Bao gồm rửa tiêu chuẩn cộng thêm hút bụi nội thất, dưỡng bóng lốp và khử mùi khử khuẩn ion âm.",
      price: "150k",
      iconClass: "icon-indigo-light",
      icon: "🎖️",
      isPopular: true
    },
    {
      badge: "Bảo vệ",
      title: "Phủ ceramic",
      desc: "Bảo vệ lớp sơn nguyên bản khỏi tia UV, chống bám nước và tạo độ bóng sâu hoàn hảo bền bỉ nhiều tháng.",
      price: "Từ 800k",
      iconClass: "icon-green-light",
      icon: "🛡️"
    }
  ];

  return (
    <div className="home-container">
      <SiteHeader />

      {/* HERO SECTION SPLIT-VIEW */}
      <section className="hero-split-container">
        <div className="hero-left-block">
          <span className="hero-system-badge">⚡ Hệ thống tự động 100%</span>
          <h1 className="hero-main-title">
            Rửa xe thông minh - <br />
            <span className="highlight-blue">Tiết kiệm thời gian</span>
          </h1>
          <p className="hero-sub-text">
            Trải nghiệm công nghệ làm sạch tiên tiến nhất. Nhanh chóng, an toàn tuyệt 
            đối cho bề mặt sơn và thân thiện với môi trường.
          </p>
          <div className="hero-button-group">
            <button className="btn-primary-action" onClick={() => navigate("/booking")}>
              Đặt lịch ngay ➔
            </button>
            <button className="btn-secondary-action">
              Xem bảng giá
            </button>
          </div>
        </div>

        <div className="hero-right-block">
          <div className="hero-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=1000&q=80" 
              alt="Automated Car Wash Lane" 
            />
            {/* Widget trạng thái khoang rửa nằm đè lên góc phải ảnh */}
            <div className="bay-status-widget">
              <div className="widget-header">
                <span className="widget-title">Trạng thái khoang rửa</span>
                <span className="status-dot-active">● Hoạt động</span>
              </div>
              <div className="widget-body">
                <span className="bay-name">Khoang 01</span>
                <span className="bay-percentage">75%</span>
              </div>
              <div className="widget-progress-bar">
                <div className="progress-fill" style={{ width: "75%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="services-showcase-container">
        <div className="services-section-title">
          <h2>Dịch vụ của chúng tôi</h2>
          <p>Lựa chọn gói chăm sóc phù hợp với nhu cầu của xế yêu.</p>
        </div>

        <div className="services-flex-grid">
          {services.map((item, index) => (
            <div key={index} className={`service-display-box ${item.isPopular ? "popular-card-border" : ""}`}>
              {item.isPopular && <span className="popular-top-tag">Phổ biến</span>}
              
              <div className={`service-icon-box ${item.iconClass}`}>
                {item.icon}
              </div>

              <span className="service-badge-pill">{item.badge}</span>
              <h3 className="service-card-title">{item.title}</h3>
              <p className="service-card-desc">{item.desc}</p>
              
              <div className="service-card-bottom">
                <span className="service-price-text">{item.price}</span>
                <button className="service-detail-link">Chi tiết</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="clean-system-footer">
        <div className="footer-top-row">
          <div className="footer-brand">
            <h4>WashFlow Pro</h4>
            <p>© 2026 WashFlow Pro Automation. Bảo lưu mọi quyền.</p>
          </div>
          <div className="footer-links-group">
            <div className="footer-column">
              <a href="#">Liên hệ</a>
              <a href="#">Hỗ trợ</a>
            </div>
            <div className="footer-column">
              <a href="#">Chính sách bảo mật</a>
              <a href="#">Điều khoản dịch vụ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}