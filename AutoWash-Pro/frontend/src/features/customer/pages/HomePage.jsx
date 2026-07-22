import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const services = [
    {
      id: 1,
      title: "Rửa xe cơ bản",
      description: "Làm sạch ngoại thất nhanh chóng, phù hợp cho nhu cầu hằng ngày.",
      price: "Từ 80.000đ",
      icon: "🚗",
    },
    {
      id: 2,
      title: "Rửa xe cao cấp",
      description: "Vệ sinh ngoại thất, nội thất và chăm sóc chi tiết cho xe.",
      price: "Từ 180.000đ",
      icon: "✨",
    },
    {
      id: 3,
      title: "Chăm sóc nội thất",
      description: "Làm sạch ghế, sàn, taplo và khử mùi khoang xe.",
      price: "Từ 250.000đ",
      icon: "🧽",
    },
  ];

  const steps = [
    {
      id: 1,
      title: "Chọn chi nhánh",
      description: "Tìm cơ sở rửa xe gần bạn nhất.",
    },
    {
      id: 2,
      title: "Chọn dịch vụ",
      description: "Chọn gói rửa xe phù hợp với nhu cầu.",
    },
    {
      id: 3,
      title: "Chọn thời gian",
      description: "Đặt lịch theo ngày và khung giờ còn trống.",
    },
    {
      id: 4,
      title: "Xác nhận",
      description: "Kiểm tra thông tin và hoàn tất đặt lịch.",
    },
  ];

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="app-container home-hero-inner">
          <div className="home-hero-content">
            <span className="home-badge">WashFlow Pro</span>

            <h1>
              Đặt lịch rửa xe
              <br />
              nhanh chóng, tiện lợi
            </h1>

            <p>
              Chọn chi nhánh, dịch vụ và khung giờ phù hợp chỉ trong vài bước.
              Theo dõi lịch sử đặt lịch, nhận ưu đãi và tích điểm thành viên
              ngay trên hệ thống.
            </p>

            <div className="home-hero-actions">
              <Link to="/customer/booking" className="primary-button">
                Đặt lịch ngay
              </Link>

              <Link to="/customer/promotions" className="secondary-button">
                Xem ưu đãi
              </Link>
            </div>

            <div className="home-hero-stats">
              <div>
                <strong>24/7</strong>
                <span>Đặt lịch online</span>
              </div>

              <div>
                <strong>15+</strong>
                <span>Chi nhánh hỗ trợ</span>
              </div>

              <div>
                <strong>4.9</strong>
                <span>Đánh giá dịch vụ</span>
              </div>
            </div>
          </div>

          <div className="home-hero-card">
            <div className="hero-car-showcase-card">
              <div className="hero-car-image-wrapper">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBusDZKiAjWUqpYE8kcZ72qmfpiP3P_caQTtotdytOVOvkN4LLwnCgTIixQcgdtUYx0eoRH0pTJUahz2YC84oIvP-GQi5JrrRJhNK4NR3M62uHISS3Re-sN8VCgtxfdmu4jXAslkBQznhMXlefCt4jwQ8G4079R_cEd0vGQ3Bp_hyg6t9PqI8MMMIRBlPvSYeetNUXtWo20JfU0Q0qHYGhREDNZy5nikIHI1Tj5tE_-_RqeCLCJsY3NlZoRA0zB0uHTHEhIBCtVjyRd"
                  alt="WashFlow Pro Smart Detailing"
                  className="hero-car-img"
                />
                <div className="hero-car-overlay" />
              </div>

              <div className="quick-booking-floating-info">
                <div className="quick-info-header">
                  <span className="live-dot" />
                  <span className="quick-info-title">Đặt lịch rửa xe giữ chỗ 30s</span>
                </div>
                <p className="quick-info-sub">Công nghệ rửa xe không chạm 4.0 tự động 100%</p>
                <Link to="/customer/booking" className="hero-booking-btn">
                  Bắt đầu đặt lịch ngay →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="app-container">
          <div className="home-section-heading">
            <span>Dịch vụ</span>
            <h2>Dịch vụ nổi bật</h2>
            <p>
              Các gói chăm sóc xe phổ biến, phù hợp cho nhiều nhu cầu sử dụng.
            </p>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card card" key={service.id}>
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>

                <div className="service-card-footer">
                  <strong>{service.price}</strong>
                  <Link to="/customer/booking">Đặt ngay</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="promotion-preview-section">
        <div className="app-container promotion-preview-card">
          <div>
            <span className="home-badge">Ưu đãi hôm nay</span>
            <h2>Giảm giá cho khách hàng đặt lịch online</h2>
            <p>
              Nhận nhiều mã ưu đãi dành riêng cho khách hàng đặt lịch qua hệ
              thống WashFlow Pro.
            </p>
          </div>

          <Link to="/customer/promotions" className="primary-button">
            Xem ưu đãi
          </Link>
        </div>
      </section>

      <section className="page-section">
        <div className="app-container">
          <div className="home-section-heading">
            <span>Quy trình</span>
            <h2>Đặt lịch chỉ với 4 bước</h2>
            <p>Quy trình đơn giản giúp bạn tiết kiệm thời gian chờ đợi.</p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.id}>
                <div className="step-number">{step.id}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;