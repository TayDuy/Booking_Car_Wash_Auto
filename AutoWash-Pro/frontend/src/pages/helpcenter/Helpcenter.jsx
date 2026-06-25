import React from "react";
import {
    Search, Bell, HelpCircle, Settings, Droplet, Radio,
    ClipboardList, FlaskConical, CalendarDays, BarChart3,
    Plus, LogOut, Mail, Star, ShieldX, Wrench, MessageCircle,
    Phone, Clock, Eye, ArrowRight,
} from "lucide-react";

/* ============================================================
   STYLES — inline so no external CSS file needed
   ============================================================ */
const CSS = `
:root {
    --wf-navy: #1d3a8f;
    --wf-navy-dark: #15296b;
    --wf-blue-50: #eef2fc;
    --wf-bg: #f4f5f7;
    --wf-surface: #ffffff;
    --wf-border: #e3e5ea;
    --wf-text: #1a1d29;
    --wf-text-muted: #6b7280;
    --wf-text-faint: #9aa0ac;
    --wf-red: #c4291c;
    --wf-red-bg: #fde9e7;
    --wf-green: #1f8a4d;
    --wf-green-bg: #e6f5ec;
    --wf-cyan: #0e8fa3;
    --wf-cyan-bg: #e4f6f8;
    --wf-teal: #0d9488;
    --wf-radius-sm: 8px;
    --wf-radius-md: 12px;
    --wf-radius-lg: 16px;
    --wf-shadow: 0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
button { font-family: inherit; cursor: pointer; }

.wf-app { min-height: 100vh; background: var(--wf-bg); color: var(--wf-text); display: flex; flex-direction: column; }

/* Header */
.wf-header { height: 64px; flex-shrink: 0; background: var(--wf-surface); border-bottom: 1px solid var(--wf-border); display: flex; align-items: center; gap: 32px; padding: 0 28px; }
.wf-header__brand { font-size: 1.3rem; font-weight: 800; letter-spacing: -.02em; white-space: nowrap; }
.wf-header__logo { color: var(--wf-text); }
.wf-header__logo--accent { color: var(--wf-navy); }
.wf-header__nav { display: flex; gap: 8px; flex: 1; }
.wf-header__nav-item { border: none; background: transparent; color: var(--wf-text-muted); font-size: .9rem; font-weight: 500; padding: 8px 14px; border-radius: var(--wf-radius-sm); transition: background .15s, color .15s; }
.wf-header__nav-item:hover { background: var(--wf-blue-50); color: var(--wf-navy); }
.wf-header__actions { display: flex; align-items: center; gap: 8px; }
.wf-icon-btn { width: 36px; height: 36px; display: grid; place-items: center; border: none; background: transparent; color: var(--wf-text-muted); border-radius: 50%; transition: background .15s; }
.wf-icon-btn:hover { background: var(--wf-bg); }
.wf-emergency-btn { margin-left: 8px; background: var(--wf-red); color: #fff; border: none; font-size: .85rem; font-weight: 600; padding: 9px 16px; border-radius: var(--wf-radius-sm); transition: background .15s; }
.wf-emergency-btn:hover { background: #a82217; }

/* Body */
.wf-body { flex: 1; display: flex; min-height: 0; }

/* Sidebar */
.wf-sidebar { width: 220px; flex-shrink: 0; background: var(--wf-surface); border-right: 1px solid var(--wf-border); padding: 24px 16px; display: flex; flex-direction: column; }
.wf-sidebar__station { display: flex; align-items: center; gap: 10px; padding: 0 4px 24px; }
.wf-sidebar__station-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--wf-blue-50); color: var(--wf-navy); display: grid; place-items: center; }
.wf-sidebar__station-name { font-size: .95rem; font-weight: 700; line-height: 1.2; }
.wf-sidebar__station-id { font-size: .78rem; color: var(--wf-text-faint); }
.wf-sidebar__nav { display: flex; flex-direction: column; gap: 2px; }
.wf-sidebar__nav-item { display: flex; align-items: center; gap: 12px; border: none; background: transparent; color: var(--wf-text-muted); font-size: .88rem; font-weight: 500; padding: 10px; border-radius: var(--wf-radius-sm); text-align: left; transition: background .15s, color .15s; }
.wf-sidebar__nav-item:hover { background: var(--wf-bg); color: var(--wf-text); }
.wf-sidebar__spacer { flex: 1; }
.wf-sidebar__new-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; border: none; background: var(--wf-navy); color: #fff; font-size: .88rem; font-weight: 600; padding: 12px; border-radius: var(--wf-radius-sm); margin-top: 16px; transition: background .15s; }
.wf-sidebar__new-btn:hover { background: var(--wf-navy-dark); }
.wf-sidebar__footer { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--wf-border); display: flex; flex-direction: column; gap: 4px; }
.wf-sidebar__help-btn, .wf-sidebar__logout-btn { display: flex; align-items: center; gap: 10px; border: none; background: transparent; font-size: .88rem; font-weight: 600; padding: 10px; border-radius: var(--wf-radius-sm); text-align: left; }
.wf-sidebar__help-btn { color: var(--wf-navy); background: var(--wf-blue-50); }
.wf-sidebar__logout-btn { color: var(--wf-text-muted); }
.wf-sidebar__logout-btn:hover { background: var(--wf-bg); }

/* Main */
.wf-main { flex: 1; padding: 56px 48px 32px; max-width: 1040px; margin: 0 auto; width: 100%; }

/* Hero */
.wf-hero { text-align: center; margin-bottom: 48px; }
.wf-hero__title { font-size: 2.1rem; font-weight: 800; color: var(--wf-navy); letter-spacing: -.01em; margin-bottom: 12px; }
.wf-hero__subtitle { color: var(--wf-text-muted); font-size: 1rem; line-height: 1.6; max-width: 560px; margin: 0 auto 28px; }
.wf-search { position: relative; max-width: 580px; margin: 0 auto; background: var(--wf-surface); border: 1px solid var(--wf-border); border-radius: var(--wf-radius-md); box-shadow: var(--wf-shadow); display: flex; align-items: center; padding: 0 16px; height: 52px; }
.wf-search__icon { color: var(--wf-text-faint); flex-shrink: 0; }
.wf-search__input { flex: 1; border: none; outline: none; background: transparent; font-size: .95rem; padding: 0 12px; color: var(--wf-text); }
.wf-search__input::placeholder { color: var(--wf-text-faint); }
.wf-search__kbd { display: flex; gap: 4px; flex-shrink: 0; }
.wf-search__kbd kbd { background: var(--wf-bg); border: 1px solid var(--wf-border); border-radius: 5px; font-size: .7rem; font-weight: 600; color: var(--wf-text-faint); padding: 3px 6px; font-family: inherit; }

/* Section */
.wf-section { margin-bottom: 48px; }
.wf-section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.wf-section__title { font-size: 1.3rem; font-weight: 700; color: var(--wf-text); }
.wf-section__header .wf-section__title { margin-bottom: 0; }
.wf-section__link { display: flex; align-items: center; gap: 6px; border: none; background: transparent; color: var(--wf-navy); font-size: .88rem; font-weight: 600; }
.wf-section__link:hover { text-decoration: underline; }

/* FAQ Grid */
.wf-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: start; }
.wf-grid__col { display: flex; flex-direction: column; gap: 20px; }
.wf-grid__row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* Cards */
.wf-card { background: var(--wf-surface); border: 1px solid var(--wf-border); border-radius: var(--wf-radius-lg); padding: 24px; display: flex; flex-direction: column; height: 100%; transition: box-shadow .15s, transform .15s; }
.wf-card:hover { box-shadow: var(--wf-shadow); transform: translateY(-1px); }
.wf-card__icon { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 16px; flex-shrink: 0; }
.icon-bg-blue { background: var(--wf-blue-50); color: var(--wf-navy); }
.icon-bg-green { background: var(--wf-green-bg); color: var(--wf-green); }
.icon-bg-red { background: var(--wf-red-bg); color: var(--wf-red); }
.icon-bg-cyan { background: var(--wf-cyan-bg); color: var(--wf-cyan); }
.icon-bg-teal { background: #e6f7f5; color: var(--wf-teal); }
.wf-card__title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: var(--wf-text); }
.wf-card__desc { font-size: .88rem; line-height: 1.6; color: var(--wf-text-muted); flex: 1; }
.wf-card__meta { display: flex; gap: 16px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--wf-border); }
.wf-card__meta-item { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--wf-text-faint); }
.wf-card--cta { background: var(--wf-navy); border: none; color: #fff; justify-content: center; }
.wf-card__title--light { color: #fff; }
.wf-card__desc--light { color: #c7d3f0; }
.wf-card__cta-btn { align-self: flex-start; margin-top: 20px; background: #fff; color: var(--wf-navy); border: none; font-size: .85rem; font-weight: 700; padding: 10px 18px; border-radius: var(--wf-radius-sm); transition: background .15s; }
.wf-card__cta-btn:hover { background: #e9edfb; }

/* Contact */
.wf-contact-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.wf-contact-card { background: var(--wf-surface); border: 1px solid var(--wf-border); border-radius: var(--wf-radius-lg); padding: 32px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; }
.wf-contact-card__icon { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; margin-bottom: 16px; }
.wf-contact-card__title { font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; }
.wf-contact-card__subtitle { font-size: .85rem; color: var(--wf-text-muted); margin-bottom: 20px; line-height: 1.5; }
.wf-contact-card__btn { display: inline-block; width: 100%; font-size: .88rem; font-weight: 600; padding: 11px 16px; border-radius: var(--wf-radius-sm); margin-top: auto; text-align: center; text-decoration: none; transition: background .15s, color .15s; border: none; }
.wf-contact-card__btn--filled { background: var(--wf-navy); color: #fff; }
.wf-contact-card__btn--filled:hover { background: var(--wf-navy-dark); }
.wf-contact-card__btn--outline { background: transparent; color: var(--wf-navy); border: 1px solid var(--wf-navy); }
.wf-contact-card__btn--outline:hover { background: var(--wf-blue-50); }

/* Status */
.wf-status { display: flex; align-items: center; gap: 12px; background: var(--wf-surface); border: 1px solid var(--wf-border); border-radius: var(--wf-radius-md); padding: 14px 20px; margin-bottom: 32px; flex-wrap: wrap; }
.wf-status__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--wf-green); flex-shrink: 0; }
.wf-status__text { font-size: .88rem; font-weight: 500; color: var(--wf-text); flex: 1; }
.wf-status__chip { font-size: .78rem; font-weight: 600; color: var(--wf-text-muted); background: var(--wf-bg); padding: 5px 10px; border-radius: 999px; }

/* Footer */
.wf-footer { text-align: center; font-size: .8rem; color: var(--wf-text-faint); padding: 24px 0 8px; }

/* Responsive */
@media (max-width: 960px) {
    .wf-header__nav, .wf-sidebar { display: none; }
    .wf-main { padding: 32px 24px; }
    .wf-grid, .wf-grid__row, .wf-contact-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

/* ============================================================
   DATA
   ============================================================ */
const SIDEBAR_NAV = [
    { icon: Radio,         label: "Trang chủ" },
    { icon: ClipboardList, label: "Lịch sử đặt lịch" },
    { icon: FlaskConical,  label: "Dịch vụ" },
    { icon: CalendarDays,  label: "Lịch khác" },
    { icon: BarChart3,     label: "Tài khoản" },
];

const TOP_NAV = ["Trang chủ", "Đặt lịch", "Lịch sử", "Hỗ trợ"];

const FEATURED_ARTICLES = [
    {
        icon: Mail, iconBg: "icon-bg-blue",
        title: "Hướng dẫn sử dụng WashFlow Pro",
        description: "Hướng dẫn toàn diện cho khách hàng. Tìm hiểu cách đặt lịch rửa xe, theo dõi trạng thái dịch vụ và quản lý tài khoản của bạn một cách hiệu quả.",
        readTime: "5 phút đọc", views: "12.4k lượt xem",
    },
    {
        icon: Star, iconBg: "icon-bg-green",
        title: "Chương trình Khách hàng thân thiết",
        description: "Tìm hiểu về chương trình tích điểm thưởng của WashFlow Pro. Cộng điểm khi đặt lịch rửa xe và sử dụng các dịch vụ cao cấp.",
    },
];

const SMALL_ARTICLES = [
    {
        icon: ShieldX, iconBg: "icon-bg-red",
        title: "Chính sách hủy đơn",
        description: "Chi tiết về các điều khoản hủy bỏ và hoàn tiền cho các dịch vụ rửa xe đã đặt trước.",
    },
    {
        icon: Wrench, iconBg: "icon-bg-cyan",
        title: "Các vấn đề thường gặp",
        description: "Giải quyết nhanh chóng các sự cố liên quan đến đặt lịch, thanh toán và trạng thái đơn hàng.",
    },
];

const CONTACT_OPTIONS = [
    { icon: MessageCircle, iconBg: "icon-bg-blue",  title: "Chat với chúng tôi",   subtitle: "Thời gian phản hồi trung bình: 2 phút", cta: "Bắt đầu Chat trực tuyến", variant: "filled" },
    { icon: Mail,          iconBg: "icon-bg-teal",  title: "Hỗ trợ qua Email",     subtitle: "Phản hồi trong vòng 24 giờ",           cta: "support@washflowpro.vn",  variant: "outline" },
    { icon: Phone,         iconBg: "icon-bg-green", title: "Gọi điện thoại",        subtitle: "Thứ 2 – Thứ 6 · 8h sáng – 8h tối",   cta: "Liên hệ hỗ trợ",         variant: "outline" },
];

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
function ArticleCard({ icon: Icon, iconBg, title, description, readTime, views }) {
    return (
        <article className="wf-card">
            <span className={`wf-card__icon ${iconBg}`}><Icon size={20} /></span>
            <h3 className="wf-card__title">{title}</h3>
            <p className="wf-card__desc">{description}</p>
            {(readTime || views) && (
                <div className="wf-card__meta">
                    {readTime && <span className="wf-card__meta-item"><Clock size={13} /> {readTime}</span>}
                    {views    && <span className="wf-card__meta-item"><Eye  size={13} /> {views}</span>}
                </div>
            )}
        </article>
    );
}

function ContactCard({ icon: Icon, iconBg, title, subtitle, cta, variant }) {
    return (
        <article className="wf-contact-card">
            <span className={`wf-contact-card__icon ${iconBg}`}><Icon size={20} /></span>
            <h3 className="wf-contact-card__title">{title}</h3>
            <p className="wf-contact-card__subtitle">{subtitle}</p>
            <button className={`wf-contact-card__btn wf-contact-card__btn--${variant}`} type="button">{cta}</button>
        </article>
    );
}

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function HelpCenter() {
    return (
        <>
            {/* Inject styles once */}
            <style>{CSS}</style>

            <div className="wf-app">
                {/* ── Header ── */}
                <header className="wf-header">
                    <div className="wf-header__brand">
                        <span className="wf-header__logo">WashFlow</span>
                        <span className="wf-header__logo wf-header__logo--accent"> Pro</span>
                    </div>
                    <nav className="wf-header__nav">
                        {TOP_NAV.map(item => (
                            <button key={item} className="wf-header__nav-item" type="button">{item}</button>
                        ))}
                    </nav>
                    <div className="wf-header__actions">
                        <button className="wf-icon-btn" aria-label="Thông báo" type="button"><Bell size={18} /></button>
                        <button className="wf-icon-btn" aria-label="Trợ giúp"  type="button"><HelpCircle size={18} /></button>
                        <button className="wf-icon-btn" aria-label="Cài đặt"   type="button"><Settings size={18} /></button>
                        <button className="wf-emergency-btn" type="button">Dừng Khẩn Cấp</button>
                    </div>
                </header>

                <div className="wf-body">
                    {/* ── Sidebar ── */}
                    <aside className="wf-sidebar">
                        <div className="wf-sidebar__station">
                            <span className="wf-sidebar__station-icon"><Droplet size={18} strokeWidth={2.5} /></span>
                            <div>
                                <p className="wf-sidebar__station-name">WashFlow Pro</p>
                                <p className="wf-sidebar__station-id">Khách hàng</p>
                            </div>
                        </div>
                        <nav className="wf-sidebar__nav">
                            {SIDEBAR_NAV.map(({ icon: Icon, label }) => (
                                <button key={label} className="wf-sidebar__nav-item" type="button">
                                    <Icon size={18} /><span>{label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="wf-sidebar__spacer" />
                        <button className="wf-sidebar__new-btn" type="button"><Plus size={16} /> Đặt lịch mới</button>
                        <div className="wf-sidebar__footer">
                            <button className="wf-sidebar__help-btn"   type="button"><HelpCircle size={16} /> Hỗ trợ</button>
                            <button className="wf-sidebar__logout-btn" type="button"><LogOut size={16} /> Đăng xuất</button>
                        </div>
                    </aside>

                    {/* ── Main ── */}
                    <main className="wf-main">
                        {/* Hero search */}
                        <section className="wf-hero">
                            <h1 className="wf-hero__title">Chúng tôi có thể giúp gì cho bạn?</h1>
                            <p className="wf-hero__subtitle">
                                Tìm câu trả lời cho các vấn đề về đặt lịch, thanh toán và hướng dẫn sử dụng WashFlow Pro của bạn.
                            </p>
                            <div className="wf-search">
                                <Search size={18} className="wf-search__icon" />
                                <input className="wf-search__input" type="text" placeholder="Tìm kiếm trợ giúp..." />
                                <span className="wf-search__kbd"><kbd>CMD</kbd><kbd>K</kbd></span>
                            </div>
                        </section>

                        {/* FAQ */}
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
                                        <h3 className="wf-card__title wf-card__title--light">Cần thêm thông tin?</h3>
                                        <p className="wf-card__desc wf-card__desc--light">
                                            Truy cập thư viện tài liệu đầy đủ với hướng dẫn chi tiết về WashFlow Pro.
                                        </p>
                                        <button className="wf-card__cta-btn" type="button">Duyệt tài liệu</button>
                                    </article>
                                </div>
                            </div>
                        </section>

                        {/* Contact */}
                        <section className="wf-section">
                            <h2 className="wf-section__title" style={{ marginBottom: 20 }}>Vẫn cần hỗ trợ? Liên hệ với chúng tôi</h2>
                            <div className="wf-contact-grid">
                                {CONTACT_OPTIONS.map(opt => <ContactCard key={opt.title} {...opt} />)}
                            </div>
                        </section>

                        {/* Status bar */}
                        <div className="wf-status">
                            <span className="wf-status__dot" />
                            <span className="wf-status__text">Tất cả hệ thống WashFlow Pro đang hoạt động bình thường</span>
                            <span className="wf-status__chip">API: 99.9% Hoạt động</span>
                            <span className="wf-status__chip">Trạng thái: Ổn định</span>
                        </div>

                        <footer className="wf-footer">© 2024 WashFlow Pro | Trợ giúp và hỗ trợ khách hàng</footer>
                    </main>
                </div>
            </div>
        </>
    );
}