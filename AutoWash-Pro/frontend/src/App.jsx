import { useNavigate } from "react-router-dom";
import "./App.css";

function App() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🫧",
      title: "Công nghệ không chạm",
      desc: "Sử dụng hệ thống phun áp lực cao và bọt tuyết chuyên dụng, loại bỏ vết bẩn mà không cần cọ xát trực tiếp.",
    },
    {
      icon: "⏱",
      title: "Tiết kiệm thời gian",
      desc: "Quy trình rửa xe tự động giúp hoàn thành dịch vụ nhanh chóng, hạn chế thời gian chờ đợi.",
    },
    {
      icon: "🛡",
      title: "Bảo vệ sơn xe",
      desc: "Hệ thống vận hành an toàn, giảm nguy cơ trầy xước và bảo vệ bề mặt sơn xe tốt hơn.",
    },
  ];

  const services = [
    {
      name: "Gói Cơ Bản",
      price: "150.000",
      features: ["Rửa không chạm thân xe", "Hút bụi nội thất", "Phủ bóng nano"],
    },
    {
      name: "Gói Cao Cấp",
      price: "350.000",
      popular: true,
      features: [
        "Rửa không chạm toàn diện",
        "Vệ sinh khoang máy cơ bản",
        "Hút bụi & vệ sinh nội thất",
        "Làm bóng lốp xe",
      ],
    },
    {
      name: "Gói Đặc Biệt",
      price: "600.000",
      features: ["Quy trình gói cao cấp", "Khử trùng ozone nội thất", "Phủ ceramic bảo vệ sơn"],
    },
  ];

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-logo" onClick={() => navigate("/")}>
          💧 WashFlow Pro
        </div>

        <nav className="landing-nav">
          <a href="#services">Dịch vụ</a>
          <a href="#process">Quy trình</a>
          <a href="#loyalty">Loyalty</a>
          <a href="#contact">Liên hệ</a>
        </nav>

        <div className="landing-auth">
          <button className="login-btn" onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
          <button className="register-btn" onClick={() => navigate("/register")}>
            Đăng ký
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-overlay"></div>

          <div className="hero-content">
            <span className="hero-badge">⚙ Công nghệ AI tự động hóa hoàn toàn</span>

            <h1>
              Trải Nghiệm Rửa Xe <br />
              Công Nghệ 4.0
            </h1>

            <p>
              Sạch bóng chỉ trong vài phút với công nghệ không chạm tiên tiến nhất.
              Bảo vệ lớp sơn nguyên bản và tiết kiệm thời gian tối đa.
            </p>

            <div className="hero-actions">
              <button onClick={() => navigate("/booking")}>
                Đặt lịch ngay 📅
              </button>
              <a href="#services">Khám phá dịch vụ</a>
            </div>
          </div>
        </section>

        <section className="feature-section">
          <div className="feature-grid">
            {features.map((item, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-title">
            <h2>Dịch vụ chuyên nghiệp</h2>
            <p>
              Lựa chọn gói dịch vụ phù hợp nhất cho xe của bạn với quy trình
              chuyên nghiệp và hiện đại.
            </p>
          </div>

          <div className="pricing-grid">
            {services.map((service, index) => (
              <div
                className={`pricing-card ${service.popular ? "popular" : ""}`}
                key={index}
              >
                {service.popular && <span className="popular-tag">Phổ biến nhất</span>}

                <h3>{service.name}</h3>

                <div className="price">
                  {service.price}
                  <span> VNĐ</span>
                </div>

                <ul>
                  {service.features.map((feature, i) => (
                    <li key={i}>◎ {feature}</li>
                  ))}
                </ul>

                <button onClick={() => navigate("/booking")}>
                  Chọn gói này
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="process-section" id="process">
          <h2>Quy trình 3 bước đơn giản</h2>

          <div className="process-row">
            <div className="process-item">
              <span>01</span>
              <strong>Đặt lịch</strong>
              <p>Chọn gói dịch vụ và thời gian phù hợp.</p>
            </div>

            <div className="process-line"></div>

            <div className="process-item">
              <span>02</span>
              <strong>Đến trạm</strong>
              <p>Check-in nhanh chóng tại chi nhánh đã chọn.</p>
            </div>

            <div className="process-line"></div>

            <div className="process-item">
              <span>03</span>
              <strong>Tận hưởng</strong>
              <p>Nhận xe sạch bóng sau vài phút.</p>
            </div>
          </div>
        </section>

        <section className="loyalty-section" id="loyalty">
          <div className="loyalty-content">
            <h2>Chương trình khách hàng thân thiết</h2>
            <p>
              Tích điểm sau mỗi lần rửa xe và đổi lấy ưu đãi độc quyền.
              Thành viên VIP nhận được nhiều quyền lợi hấp dẫn hơn.
            </p>

            <div className="loyalty-benefits">
              <div>
                <strong>🎯 Tích điểm</strong>
                <span>100 VNĐ = 1 điểm</span>
              </div>
              <div>
                <strong>🎁 Đổi quà</strong>
                <span>Nhận coupon miễn phí</span>
              </div>
            </div>

            <button onClick={() => navigate("/register")}>
              Tham gia ngay
            </button>
          </div>

          <div className="loyalty-card">
            <span>WASHFLOW PLATINUM</span>
            <p>VIP Member</p>
            <h3>**** **** 8892</h3>
            <small>NGUYEN VAN A</small>
          </div>
        </section>

        <section className="testimonial-section">
          <div className="section-title left">
            <h2>Khách hàng nói gì</h2>
            <p>Hàng nghìn chủ xe đã tin tưởng chọn WashFlow Pro.</p>
          </div>

          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div>★★★★★</div>
              <p>
                “Tôi rất ưng ý với dịch vụ. Xe sạch nhanh và không cần phải chờ lâu.”
              </p>
              <strong>Anh Tuấn</strong>
            </div>

            <div className="testimonial-card">
              <div>★★★★★</div>
              <p>
                “Đặt lịch dễ, nhân viên hỗ trợ tốt, quy trình rửa xe hiện đại.”
              </p>
              <strong>Chị Lan</strong>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-form">
            <h3>Liên hệ với chúng tôi</h3>

            <input placeholder="Họ tên" />
            <input placeholder="Số điện thoại" />
            <textarea placeholder="Chúng tôi có thể giúp gì cho bạn?"></textarea>

            <button>Gửi lời nhắn</button>
          </div>

          <div className="contact-info">
            <div className="map-box">📍</div>

            <div className="info-row">
              <div>
                <strong>Địa chỉ</strong>
                <p>123 Đường Công Nghệ, Quận 7, TP. Hồ Chí Minh</p>
              </div>

              <div>
                <strong>Giờ làm việc</strong>
                <p>Thứ 2 - Chủ Nhật: 07:00 - 21:00</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>💧 WashFlow Pro</strong>
          <p>© 2026 WashFlow Pro. All rights reserved.</p>
        </div>

        <div className="footer-links">
          <a href="/">Privacy Policy</a>
          <a href="/">Terms of Service</a>
          <a href="/">Contact Us</a>
          <a href="/">Support</a>
        </div>
      </footer>

      <button className="floating-help">☏</button>
    </div>
  );
}

export default App;