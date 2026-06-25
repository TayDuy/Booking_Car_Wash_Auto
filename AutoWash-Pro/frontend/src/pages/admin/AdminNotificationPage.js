import React, { useState } from "react";
import {
    Car, LayoutGrid, BarChart2, Calendar, Archive, Megaphone, Bell,
    HelpCircle, Settings, Search, SlidersHorizontal, CheckCheck,
    AlertTriangle, Star, ThumbsUp, Clock,
} from "lucide-react";
import "./AdminNotificationPage.css";

const SIDEBAR_NAV = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutGrid },
    { id: "analytics", label: "Phân tích", icon: BarChart2 },
    { id: "booking", label: "Đặt lịch", icon: Calendar },
    { id: "inventory", label: "Kho hàng", icon: Archive },
    { id: "marketing", label: "Tiếp thị", icon: Megaphone },
    { id: "notifications", label: "Thông báo", icon: Bell, active: true },
];

const FILTERS = [
    { id: "all", label: "Tất cả" },
    { id: "ops", label: "Cảnh báo vận hành" },
    { id: "hr", label: "Nhân sự" },
    { id: "customer", label: "Khách hàng" },
];

const GROUPS = [
    {
        id: "today",
        label: "HÔM NAY",
        items: [
            {
                id: "a1",
                icon: AlertTriangle,
                tone: "red",
                title: "Mức hóa chất thấp: Khoang 02",
                description:
                    "Bể chứa xà phòng hoạt tính tại khoang số 02 chỉ còn dưới 15%. Vui lòng bổ sung ngay để tránh gián đoạn dịch vụ.",
                time: "10 phút trước",
                category: "Cảnh báo vận hành",
                badge: { label: "CAO", tone: "red" },
            },
            {
                id: "a2",
                icon: Star,
                tone: "blue",
                title: "Đơn hàng Premium mới",
                description:
                    "Khách hàng Nguyễn Văn A vừa đặt gói 'Ceramic Shield Pro' cho xe Mercedes S450 vào lúc 14:00.",
                time: "45 phút trước",
                category: "Khách hàng",
                badge: { label: "TRUNG BÌNH", tone: "blue" },
            },
            {
                id: "a3",
                icon: ThumbsUp,
                tone: "green",
                title: "Cột mốc hiệu suất",
                description:
                    "Nhân viên Trần Thị B đã hoàn thành 100 lượt rửa xe trong tuần này với đánh giá 5 sao tuyệt đối.",
                time: "2 giờ trước",
                category: "Nhân sự",
                badge: { label: "THẤP", tone: "green" },
            },
        ],
    },
    {
        id: "yesterday",
        label: "HÔM QUA",
        items: [
            {
                id: "a4",
                icon: SlidersHorizontal,
                tone: "gray",
                title: "Bảo trì định kỳ: Máy nén khí",
                description:
                    "Đã đến hạn bảo trì định kỳ cho hệ thống máy nén khí trung tâm. Vui lòng liên hệ kỹ thuật viên.",
                time: "Hôm qua, 18:30",
                category: "Cảnh báo vận hành",
                badge: { label: "THẤP", tone: "gray" },
                seen: true,
            },
        ],
    },
];

function Badge({ label, tone }) {
    return <span className={`an-badge an-badge--${tone}`}>{label}</span>;
}

function NotifCard({ item }) {
    const Icon = item.icon;
    return (
        <article className={`an-card an-card--${item.tone}`}>
            <div className={`an-card__icon an-card__icon--${item.tone}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <div className="an-card__body">
                <div className="an-card__top">
                    <h3>{item.title}</h3>
                    <Badge {...item.badge} />
                </div>
                <p className="an-card__desc">{item.description}</p>
                <div className="an-card__meta">
                    <Clock size={13} />
                    <span>{item.time}</span>
                    <span className="an-dot">•</span>
                    <span>{item.category}</span>
                    {item.seen && <span className="an-seen">Đã xem</span>}
                </div>
            </div>
        </article>
    );
}

export default function AdminNotificationPage() {
    const [activeFilter, setActiveFilter] = useState("all");

    return (
        <div className="an-app">
            <aside className="an-sidebar">
                <div className="an-brand">
                    <div className="an-brand__logo"><Car size={20} /></div>
                    <div>
                        <h1>WashFlow Pro</h1>
                        <p>Bảng điều khiển Admin</p>
                    </div>
                </div>

                <nav className="an-sidebar__nav">
                    {SIDEBAR_NAV.map(({ id, label, icon: Icon, active }) => (
                        <button key={id} className={`an-sidebar__item ${active ? "is-active" : ""}`}>
                            <Icon size={18} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <div className="an-sidebar__footer">
                    <button className="an-sidebar__item an-sidebar__item--muted">
                        <HelpCircle size={18} /><span>Trung tâm hỗ trợ</span>
                    </button>
                    <button className="an-sidebar__item an-sidebar__item--muted">
                        <Settings size={18} /><span>Cài đặt</span>
                    </button>
                    <div className="an-status">
                        <span className="an-status__dot" />
                        TRẠNG THÁI: ĐANG HOẠT ĐỘNG
                    </div>
                </div>
            </aside>

            <div className="an-main">
                <header className="an-topbar">
                    <h1>Trung tâm thông báo</h1>
                    <div className="an-search">
                        <Search size={16} />
                        <input placeholder="Tìm kiếm thông báo..." />
                    </div>
                    <div className="an-topbar__actions">
                        <button className="an-icon-btn"><Bell size={18} /></button>
                        <button className="an-icon-btn"><Settings size={18} /></button>
                        <div className="an-profile">
                            <div className="an-avatar" />
                            <span>Quản lý cấp cao</span>
                        </div>
                    </div>
                </header>

                <div className="an-toolbar">
                    <div className="an-filters">
                        {FILTERS.map((f) => (
                            <button
                                key={f.id}
                                className={`an-filter ${activeFilter === f.id ? "is-active" : ""}`}
                                onClick={() => setActiveFilter(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button className="an-mark-read">
                        <CheckCheck size={16} /> Đánh dấu tất cả là đã đọc
                    </button>
                    <button className="an-filter-advanced">
                        <SlidersHorizontal size={16} /> Lọc nâng cao
                    </button>
                </div>

                <div className="an-content">
                    <div className="an-list">
                        {GROUPS.map((group) => (
                            <section key={group.id} className="an-group">
                                <h2 className="an-group__label">{group.label}</h2>
                                <div className="an-group__items">
                                    {group.items.map((item) => (
                                        <NotifCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    <aside className="an-side">
                        <div className="an-overview">
                            <h3>Tổng quan tuần này</h3>
                            <div className="an-overview__stats">
                                <div>
                                    <strong>248</strong>
                                    <span>Thông báo mới</span>
                                </div>
                                <div>
                                    <strong>12</strong>
                                    <span>Cảnh báo khẩn cấp</span>
                                </div>
                            </div>
                            <button className="an-overview__btn">Xem báo cáo chi tiết</button>
                        </div>

                        <div className="an-bay-status">
                            <h3>Trạng thái khoang rửa</h3>
                            <div className="an-bay">
                                <div className="an-bay__top">
                                    <span><span className="an-bay__dot an-bay__dot--green" />Khoang 01</span>
                                    <span className="an-bay__status an-bay__status--green">Đang hoạt động</span>
                                </div>
                                <div className="an-bay__bar"><div className="an-bay__fill an-bay__fill--green" style={{ width: "70%" }} /></div>
                            </div>
                            <div className="an-bay">
                                <div className="an-bay__top">
                                    <span><span className="an-bay__dot an-bay__dot--red" />Khoang 02</span>
                                    <span className="an-bay__status an-bay__status--red">Cần xử lý</span>
                                </div>
                                <div className="an-bay__bar"><div className="an-bay__fill an-bay__fill--red" style={{ width: "20%" }} /></div>
                            </div>
                        </div>

                        <div className="an-legend">
                            <h3>Phân loại</h3>
                            <ul>
                                <li><span className="an-legend__dot an-legend__dot--red" />Cảnh báo khẩn cấp (Cơ sở hạ tầng)</li>
                                <li><span className="an-legend__dot an-legend__dot--blue" />Hoạt động khách hàng (Doanh thu)</li>
                                <li><span className="an-legend__dot an-legend__dot--green" />Thông tin nhân sự (Vận hành)</li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="an-toast">
                <CheckCheck size={16} /> Đã đánh dấu tất cả là đã đọc
            </div>
        </div>
    );
}