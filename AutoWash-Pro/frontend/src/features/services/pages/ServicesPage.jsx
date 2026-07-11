import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import { LayoutGrid, Droplets, Armchair, Sparkles, Wrench, Gem, Clock, Shield, Zap, Diamond, ChevronDown, ChevronUp } from "lucide-react";
import { getActiveServices } from "../../../api/servicePackageService";

import PublicHeader from "../../../components/layout/PublicHeader";
import PublicFooter from "../../../components/layout/PublicFooter";
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
  { id: "all", label: "Tất cả", icon: LayoutGrid },
  { id: "wash", label: "Rửa xe", icon: Droplets },
  { id: "interior", label: "Nội thất", icon: Armchair },
  { id: "polish", label: "Đánh bóng", icon: Sparkles },
  { id: "addon", label: "Add-on", icon: Wrench },
  { id: "vip", label: "Combo VIP", icon: Gem },
];

function SkeletonCard() {
  return (
    <article className="service-showcase-card skeleton">
      <div className="service-card-banner skeleton-box" style={{ borderRadius: "14px 14px 0 0", margin: "-24px -24px 24px -24px", height: "120px", position: "relative" }}>
        <div className="skeleton-box skeleton-icon" style={{ position: "absolute", bottom: "-20px", left: "24px", width: "48px", height: "48px", borderRadius: "12px" }} />
      </div>
      <div className="card-header">
        <div className="skeleton-box skeleton-tag" />
      </div>
      <div className="card-body">
        <div className="skeleton-box skeleton-title" />
        <div className="skeleton-box skeleton-desc" />
        <div className="skeleton-box skeleton-desc short" />
      </div>
      <div className="card-footer">
        <div className="card-meta">
          <div className="skeleton-box skeleton-price" />
          <div className="skeleton-box skeleton-duration" />
        </div>
        <div className="skeleton-box skeleton-btn" />
      </div>
    </article>
  );
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
    if (name.includes("add-on") || name.includes("addon")) return Wrench;
    if (name.includes("vip") || name.includes("diamond") || name.includes("kim cương") || name.includes("combo")) return Gem;
    if (name.includes("đánh bóng") || name.includes("polish") || name.includes("nano") || name.includes("ceramic")) return Sparkles;
    if (name.includes("nội thất") || name.includes("interior") || name.includes("hút bụi")) return Armchair;
    return Droplets;
  };

  const getCategoryGradient = (service) => {
    const category = getCategory(service);
    switch (category) {
      case "vip":
        return "linear-gradient(135deg, #e11d48 0%, #be123c 100%)";
      case "polish":
        return "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)";
      case "interior":
        return "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)";
      case "addon":
        return "linear-gradient(135deg, #64748b 0%, #475569 100%)";
      default:
        return "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
    }
  };

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return services;
    return services.filter((svc) => getCategory(svc) === activeCategory);
  }, [services, activeCategory]);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleFaqKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFaq(index);
    }
  };

  const formatPrice = (price) => {
    return Number(price ?? 0).toLocaleString("vi-VN") + "đ";
  };

  const handleBooking = (serviceId) => {
    const basePath = serviceId ? `/customer/booking?serviceId=${serviceId}` : "/customer/booking";
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("role") || "").toUpperCase();
    if (token && (role === "CUSTOMER" || role === "USER")) {
      navigate(basePath);
    } else {
      navigate(`/auth/login?redirect=${encodeURIComponent(basePath)}`);
    }
  };

  const ServiceIcon = getIcon;

  return (
    <div className="services-showcase-page">
      {!isCustomerScope && <PublicHeader />}

      <section className="services-hero">
        <div className="app-container hero-container">
          <div className="hero-content">
            <span className="hero-badge">WashFlow Detailing</span>
            <h1>Dịch Vụ Chăm Sóc Xe Chuyên Nghiệp</h1>
            <p>
              Khám phá các gói chăm sóc xe toàn diện ứng dụng công nghệ rửa không chạm thông minh, 
              giúp làm sạch sâu tối đa và bảo vệ sơn xe của bạn bền đẹp theo thời gian.
            </p>
            <button className="hero-cta-btn" onClick={handleBooking}>
              Đặt lịch rửa xe ngay
            </button>
          </div>
        </div>
      </section>

      <div className={`category-sticky-bar ${isCustomerScope ? "inside-layout" : ""}`}>
        <div className="app-container bar-container">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={`category-tab-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setSearchParams(cat.id === "all" ? {} : { cat: cat.id }, { replace: true })}
              >
                <Icon size={16} strokeWidth={2} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="services-list-section">
        <div className="app-container">
          {loading ? (
            <div className="services-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="services-empty">
              <Droplets size={48} className="empty-icon" />
              <p>Không tìm thấy gói dịch vụ nào trong mục này.</p>
            </div>
          ) : (
            <div className="services-grid">
              {filteredServices.map((svc) => {
                const Icon = getIcon(svc);
                const bannerStyle = svc.imageUrl 
                  ? { backgroundImage: `url(${svc.imageUrl})` }
                  : { background: getCategoryGradient(svc) };
                return (
                  <article className="service-showcase-card" key={svc.serviceId || svc.id}>
                    <div className="service-card-banner" style={bannerStyle}>
                      <span className="card-icon">
                        <Icon size={24} strokeWidth={1.5} />
                      </span>
                    </div>
                    <div className="card-header">
                      {svc.durationMinutes >= 45 && <span className="popular-tag">Chăm sóc sâu</span>}
                    </div>
                    <div className="card-body">
                      <h3>{svc.serviceName || svc.name}</h3>
                      <p className="card-desc">{svc.description || "Dịch vụ chăm sóc và làm sạch xe chuyên nghiệp chất lượng cao."}</p>
                    </div>
                    <div className="card-footer">
                      <div className="card-meta">
                        <span className="card-price">{formatPrice(svc.basePrice)}</span>
                        <span className="card-duration"><Clock size={12} strokeWidth={2} /> {svc.durationMinutes} phút</span>
                      </div>
                      <button className="card-book-btn" onClick={() => handleBooking(svc.serviceId || svc.id)}>
                        Đặt ngay
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

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
                <div
                  className={`faq-item ${isOpen ? "open" : ""}`}
                  key={idx}
                  onClick={() => toggleFaq(idx)}
                  onKeyDown={(e) => handleFaqKeyDown(e, idx)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isOpen}
                >
                  <div className="faq-question">
                    <span>{item.question}</span>
                    <span className="faq-arrow">
                      {isOpen ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                    </span>
                  </div>
                  <div className="faq-answer-wrapper">
                    <div className="faq-answer">{item.answer}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {!isCustomerScope && <PublicFooter />}
    </div>
  );
}
