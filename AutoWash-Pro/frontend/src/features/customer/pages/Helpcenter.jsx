import React from "react";
import {
  Search,
  Mail,
  Star,
  ShieldX,
  Wrench,
  MessageCircle,
  Phone,
  Clock,
  Eye,
  ArrowRight,
} from "lucide-react";
import "./Helpcenter.css";

const FEATURED_ARTICLES = [
  {
    icon: Mail,
    iconBg: "icon-bg-blue",
    title: "Hướng dẫn sử dụng WashFlow Pro",
    description:
      "Hướng dẫn toàn diện cho khách hàng. Tìm hiểu cách đặt lịch rửa xe, theo dõi trạng thái dịch vụ và quản lý tài khoản của bạn một cách hiệu quả.",
    readTime: "5 phút đọc",
    views: "12.4k lượt xem",
  },
  {
    icon: Star,
    iconBg: "icon-bg-green",
    title: "Chương trình Khách hàng thân thiết",
    description:
      "Tìm hiểu về chương trình tích điểm thưởng của WashFlow Pro. Cộng điểm khi đặt lịch rửa xe và sử dụng các dịch vụ cao cấp.",
  },
];

const SMALL_ARTICLES = [
  {
    icon: ShieldX,
    iconBg: "icon-bg-red",
    title: "Chính sách hủy đơn",
    description:
      "Chi tiết về các điều khoản hủy bỏ và hoàn tiền cho các dịch vụ rửa xe đã đặt trước.",
  },
  {
    icon: Wrench,
    iconBg: "icon-bg-cyan",
    title: "Các vấn đề thường gặp",
    description:
      "Giải quyết nhanh chóng các sự cố liên quan đến đặt lịch, thanh toán và trạng thái đơn hàng.",
  },
];

const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    iconBg: "icon-bg-blue",
    title: "Chat với chúng tôi",
    subtitle: "Thời gian phản hồi trung bình: 2 phút",
    cta: "Bắt đầu Chat trực tuyến",
    variant: "filled",
  },
  {
    icon: Mail,
    iconBg: "icon-bg-teal",
    title: "Hỗ trợ qua Email",
    subtitle: "Phản hồi trong vòng 24 giờ",
    cta: "support@washflowpro.vn",
    variant: "outline",
  },
  {
    icon: Phone,
    iconBg: "icon-bg-green",
    title: "Gọi điện thoại",
    subtitle: "Thứ 2 – Thứ 6 · 8h sáng – 8h tối",
    cta: "Liên hệ hỗ trợ",
    variant: "outline",
  },
];

function ArticleCard({
  icon: Icon,
  iconBg,
  title,
  description,
  readTime,
  views,
}) {
  return (
    <article className="wf-card">
      <span className={`wf-card__icon ${iconBg}`}>
        <Icon size={20} />
      </span>

      <h3 className="wf-card__title">{title}</h3>
      <p className="wf-card__desc">{description}</p>

      {(readTime || views) && (
        <div className="wf-card__meta">
          {readTime && (
            <span className="wf-card__meta-item">
              <Clock size={13} /> {readTime}
            </span>
          )}

          {views && (
            <span className="wf-card__meta-item">
              <Eye size={13} /> {views}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function ContactCard({ icon: Icon, iconBg, title, subtitle, cta, variant }) {
  return (
    <article className="wf-contact-card">
      <span className={`wf-contact-card__icon ${iconBg}`}>
        <Icon size={20} />
      </span>

      <h3 className="wf-contact-card__title">{title}</h3>
      <p className="wf-contact-card__subtitle">{subtitle}</p>

      <button
        className={`wf-contact-card__btn wf-contact-card__btn--${variant}`}
        type="button"
      >
        {cta}
      </button>
    </article>
  );
}

export default function HelpCenter() {
  return (
    <div className="wf-app wf-app-no-sidebar">
      <main className="wf-main wf-main-full">
        <section className="wf-hero">
          <h1 className="wf-hero__title">Chúng tôi có thể giúp gì cho bạn?</h1>

          <p className="wf-hero__subtitle">
            Tìm câu trả lời cho các vấn đề về đặt lịch, thanh toán và hướng dẫn
            sử dụng WashFlow Pro của bạn.
          </p>

          <div className="wf-search">
            <Search size={18} className="wf-search__icon" />

            <input
              className="wf-search__input"
              type="text"
              placeholder="Tìm kiếm trợ giúp..."
            />

            <span className="wf-search__kbd">
              <kbd>CMD</kbd>
              <kbd>K</kbd>
            </span>
          </div>
        </section>

        <section className="wf-section">
          <div className="wf-section__header">
            <h2 className="wf-section__title">Câu hỏi thường gặp</h2>

            <button className="wf-section__link" type="button">
              Xem tất cả bài viết <ArrowRight size={15} />
            </button>
          </div>

          <div className="wf-grid">
            <div className="wf-grid__col">
              <ArticleCard {...FEATURED_ARTICLES[0]} />

              <div className="wf-grid__row">
                <ArticleCard {...SMALL_ARTICLES[0]} />
                <ArticleCard {...SMALL_ARTICLES[1]} />
              </div>
            </div>

            <div className="wf-grid__col">
              <ArticleCard {...FEATURED_ARTICLES[1]} />

              <article className="wf-card wf-card--cta">
                <h3 className="wf-card__title wf-card__title--light">
                  Cần thêm thông tin?
                </h3>

                <p className="wf-card__desc wf-card__desc--light">
                  Truy cập thư viện tài liệu đầy đủ với hướng dẫn chi tiết về
                  WashFlow Pro.
                </p>

                <button className="wf-card__cta-btn" type="button">
                  Duyệt tài liệu
                </button>
              </article>
            </div>
          </div>
        </section>

        <section className="wf-section">
          <h2 className="wf-section__title" style={{ marginBottom: 20 }}>
            Vẫn cần hỗ trợ? Liên hệ với chúng tôi
          </h2>

          <div className="wf-contact-grid">
            {CONTACT_OPTIONS.map((opt) => (
              <ContactCard key={opt.title} {...opt} />
            ))}
          </div>
        </section>

        <div className="wf-status">
          <span className="wf-status__dot" />

          <span className="wf-status__text">
            Tất cả hệ thống WashFlow Pro đang hoạt động bình thường
          </span>

          <span className="wf-status__chip">API: 99.9% Hoạt động</span>
          <span className="wf-status__chip">Trạng thái: Ổn định</span>
        </div>
      </main>
    </div>
  );
}