import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import { getActiveServices } from "../../../api/servicePackageService";
import useAuth from "../../../hooks/useAuth";
import "./ServicesPage.css";

const FAQ_ITEMS = [
  {
    question: "Quy trình rửa xe không chạm diễn ra trong bao lâu?",
    answer: "Thông thường một ca rửa xe cơ bản kéo dài từ 15-30 phút. Đối với các gói cao cấp hoặc vệ sinh nội thất chuyên sâu, thời gian thực hiện có thể kéo dài từ 45-90 phút tùy thuộc vào tình trạng xe.",
  },
  {
    question: "Tôi có cần phải đặt lịch trước hay không?",
    answer: "WashFlow Pro khuyến khích khách hàng đặt lịch trực tuyến trước để giữ chỗ trong khung giờ mong muốn, tránh phải chờ đợi vào giờ cao điểm khi mang xe trực tiếp đến chi nhánh.",
  },
  {
    question: "Công nghệ rửa xe không chạm có làm trầy xước bề mặt sơn xe không?",
    answer: "Hoàn toàn không. Công nghệ rửa xe không chạm sử dụng bọt hoạt tính phân hủy bụi bẩn kết hợp vòi phun áp lực cao, hạn chế tối đa ma sát vật lý giúp ngăn ngừa hoàn toàn vết xước dăm.",
  },
  {
    question: "Tôi có thể thay đổi hoặc hủy lịch đặt trước không?",
    answer: "Có. Bạn có thể dễ dàng thay đổi khung giờ hoặc hủy lịch đặt trong mục 'Lịch sử' trên tài khoản tối thiểu 1 giờ trước khi lịch hẹn bắt đầu.",
  },
  {
    question: "Hệ thống tích điểm thành viên hoạt động thế nào?",
    answer: "Với mỗi hóa đơn thanh toán thành công, bạn sẽ tích lũy điểm thưởng tương ứng với hạng thành viên. Điểm thưởng dùng để đổi các mã giảm giá hấp dẫn trong mục 'Ưu đãi'.",
  },
];

const CATEGORIES = [
  { id: "all", label: "🚗 Tất cả" },
  { id: "wash", label: "🧼 Rửa xe" },
  { id: "interior", label: "🧽 Nội thất" },
  { id: "polish", label: "✨ Đánh bóng" },
  { id: "addon", label: "🔧 Add-on" },
  { id: "vip", label: "👑 Combo VIP" },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user;
  const isCustomerScope = location.pathname.startsWith("/customer");

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("cat") || "all";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const response = await getActiveServices();
      const list = response.data?.data || response.data || [];
      setServices(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load active services failed:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  const getCategory = (service) => {
    const name = (service.serviceName || service.name || "").toLowerCase();
    const desc = (service.description || "").toLowerCase();

    if (name.includes("add-on") || name.includes("addon") || name.includes("phụ trợ") || name.includes("nước hoa")) {
      return "addon";
    }
    if (name.includes("vip") || name.includes("diamond") || name.includes("kim cương") || name.includes("combo")) {
      return "vip";
    }
    if (name.includes("đánh bóng") || name.includes("polish") || name.includes("nano") || name.includes("ceramic") || desc.includes("đánh bóng") || desc.includes("nano")) {
      return "polish";
    }
    if (name.includes("nội thất") || name.includes("interior") || name.includes("hút bụi") || desc.includes("nội thất") || desc.includes("hút bụi")) {
      return "interior";
    }
    return "wash";
  };

  const getIcon = (service) => {
    const name = (service.serviceName || service.name || "").toLowerCase();
    if (name.includes("add-on") || name.includes("addon")) return "🔧";
    if (name.includes("vip") || name.includes("diamond") || name.includes("kim cương") || name.includes("combo")) return "👑";
    if (name.includes("đánh bóng") || name.includes("polish") || name.includes("nano") || name.includes("ceramic")) return "✨";
    if (name.includes("nội thất") || name.includes("interior") || name.includes("hút bụi")) return "🧽";
    return "💧";
  };

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return services;
    return services.filter((svc) => getCategory(svc) === activeCategory);
  }, [services, activeCategory]);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const formatPrice = (price) => {
    return Number(price ?? 0).toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="services-showcase-page">
      {/* Public Landing Header */}
      {!isCustomerScope && (
        <header className="landing-header">
          <div className="app-container landing-header-inner">
            <Link to="/" className="landing-logo">
              <img src="/logo.png" alt="Logo" style={{ height: "36px", width: "auto" }} />
              WashFlow Pro
            </Link>

            <nav className="landing-nav">
              <Link to="/services">Dịch vụ</Link>
              <a href="/#process">Đặt lịch</a>
              <a href="/#pricing">Bảng giá</a>
              <a href="/#contact">Liên hệ</a>
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
      )}

      {/* Hero Section */}
      <section className="services-hero">
        <div className="app-container hero-container">
          <div className="hero-content">
            <span className="hero-badge">WashFlow Detailing</span>
            <h1>Dịch Vụ Chăm Sóc Xe Chuyên Nghiệp</h1>
            <p>
              Khám phá các gói chăm sóc xe toàn diện ứng dụng công nghệ rửa không chạm thông minh, 
              giúp làm sạch sâu tối đa và bảo vệ sơn xe của bạn bền đẹp theo thời gian.
            </p>
            <button 
              className="hero-cta-btn" 
              onClick={() => {
                if (user) navigate("/customer/booking");
                else navigate("/auth/login?redirect=/customer/booking");
              }}
            >
              Đặt lịch rửa xe ngay
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Filter Bar */}
      <div className="category-sticky-bar" style={!isCustomerScope ? { top: 0 } : {}}>
        <div className="app-container bar-container">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setSearchParams(cat.id === "all" ? {} : { cat: cat.id }, { replace: true })}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <section className="services-list-section">
        <div className="app-container">
          {loading ? (
            <div className="services-loading">Đang tải danh sách dịch vụ...</div>
          ) : filteredServices.length === 0 ? (
            <div className="services-empty">Không tìm thấy gói dịch vụ nào trong mục này.</div>
          ) : (
            <div className="services-grid">
              {filteredServices.map((svc) => (
                <article className="service-showcase-card" key={svc.serviceId || svc.id}>
                  <div className="card-header">
                    <span className="card-icon">{getIcon(svc)}</span>
                    {svc.durationMinutes >= 45 && <span className="popular-tag">Chăm sóc sâu</span>}
                  </div>
                  <div className="card-body">
                    <h3>{svc.serviceName || svc.name}</h3>
                    <p className="card-desc">{svc.description || "Dịch vụ chăm sóc và làm sạch xe chuyên nghiệp chất lượng cao."}</p>
                  </div>
                  <div className="card-footer">
                    <div className="card-meta">
                      <span className="card-price">{formatPrice(svc.basePrice)}</span>
                      <span className="card-duration">⏱ {svc.durationMinutes} phút</span>
                    </div>
                    <button 
                      className="card-book-btn" 
                      onClick={() => {
                        if (user) navigate("/customer/booking");
                        else navigate("/auth/login?redirect=/customer/booking");
                      }}
                    >
                      Đặt ngay
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="benefits-section">
        <div className="app-container">
          <div className="section-header">
            <span>Giá Trị Vượt Trội</span>
            <h2>Tại Sao Nên Chọn WashFlow Pro?</h2>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🛡️</div>
              <h3>An Toàn Tuyệt Đối</h3>
              <p>Công nghệ không chạm loại bỏ ma sát vật lý trực tiếp, ngăn ngừa xước dăm và bảo vệ bề mặt sơn nguyên bản.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⏱️</div>
              <h3>Tiết Kiệm Thời Gian</h3>
              <p>Hệ thống đặt lịch thông minh giúp xe của bạn được phục vụ ngay khi tới chi nhánh, không phải xếp hàng.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💎</div>
              <h3>Chất Lượng Cam Kết</h3>
              <p>Sử dụng các loại dung dịch chăm sóc đạt chuẩn thế giới cùng quy trình kiểm định chất lượng khắt khe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="app-container faq-container">
          <div className="section-header">
            <span>Giải Đáp</span>
            <h2>Câu Hỏi Thường Gặp</h2>
          </div>
          <div className="faq-accordion-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div className={`faq-item ${isOpen ? "open" : ""}`} key={idx} onClick={() => toggleFaq(idx)}>
                  <div className="faq-question">
                    <span>{item.question}</span>
                    <span className="faq-arrow">{isOpen ? "▲" : "▼"}</span>
                  </div>
                  {isOpen && <div className="faq-answer">{item.answer}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Public Footer */}
      {!isCustomerScope && (
        <footer className="global-footer-bar" style={{ borderTop: "1px solid #e2e8f0", marginTop: "40px" }}>
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
      )}
    </div>
  );
}
