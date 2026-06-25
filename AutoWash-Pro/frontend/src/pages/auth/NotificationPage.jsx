import React, { useState, useEffect } from "react";
import {
    Radio,
    ClipboardList,
    Droplet,
    Users,
    BarChart2,
    HelpCircle,
    LogOut,
    Bell,
    Settings,
    CheckCheck,
    Clock,
    Tag,
    CreditCard,
    History,
    AlertTriangle,
    Star,
} from "lucide-react";
import "./NotificationPage.css";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout as clearAuth } from "../../api/authService";
import { supabase } from "../../api/supabaseClient";

// ---- Dữ liệu mẫu (thay bằng dữ liệu thật từ API khi tích hợp) ----
const NAV_ITEMS = [
    { id: "live", label: "Giám sát trực tiếp", icon: Radio },
    { id: "queue", label: "Quản lý hàng đợi", icon: ClipboardList },
    { id: "chemical", label: "Mức hóa chất", icon: Droplet },
    { id: "staff", label: "Lịch nhân viên", icon: Users },
    { id: "analytics", label: "Phân tích", icon: BarChart2 },
];

const TOP_NAV = ["Bảng điều khiển", "Đặt lịch", "Kho hàng", "Báo cáo"];

const NOTIFICATION_GROUPS = [
    {
        id: "today",
        label: "Hôm nay",
        items: [
            {
                id: "n1",
                type: "appointment",
                icon: Clock,
                title: "Nhắc nhở lịch hẹn",
                description:
                    "Lịch đặt Platinum Detail cho xe Tesla Model S màu bạc (Biển số: WASH-01) sẽ bắt đầu sau 15 phút tại Khoang 3.",
                time: "10:45 SA",
                tags: ["Khoang 3", "Platinum"],
                unread: true,
            },
            {
                id: "n2",
                type: "campaign",
                icon: Tag,
                title: "Cảnh báo hiệu quả chiến dịch",
                description:
                    'Chiến dịch "Ưu đãi hè sáng sớm" đã đạt 50 lượt đổi hôm nay. Hãy cân nhắc tăng công suất cho ngày mai.',
                time: "09:12 SA",
                link: "Xem dữ liệu chiến dịch",
                unread: true,
            },
        ],
    },
    {
        id: "yesterday",
        label: "Hôm qua",
        items: [
            {
                id: "n3",
                type: "membership",
                icon: CreditCard,
                title: "Gia hạn gói hội viên",
                description:
                    'Tài khoản Fleet "Velocity Logistics" đã gia hạn thành công gói hội viên Không giới hạn hàng tháng.',
                time: "04:30 CH",
                unread: false,
            },
            {
                id: "n4",
                type: "shift",
                icon: History,
                title: "Báo cáo chốt ca hàng ngày",
                description:
                    "Trạm #402 đã đóng cửa với tổng cộng 142 lượt rửa. Tăng 12% so với cùng kỳ tuần trước.",
                time: "08:00 CH",
                unread: false,
            },
        ],
    },
    {
        id: "older",
        label: "Cũ hơn",
        items: [
            {
                id: "n5",
                type: "alert",
                icon: AlertTriangle,
                title: "Mức hóa chất tới hạn",
                description:
                    "Bình bọt tuyết hoạt tính B hiện còn dưới 5%. Lệnh nhập hàng đã được kích hoạt tự động.",
                time: "12 tháng 6",
                unread: false,
                critical: true,
            },
            {
                id: "n6",
                type: "review",
                icon: Star,
                title: "Đánh giá 5 sao mới",
                description:
                    'Trạm rửa xe tốt nhất thành phố! Hệ thống không chạm cực kỳ nhẹ nhàng với lớp sơn. - James W.',
                time: "11 tháng 6",
                unread: false,
            },
        ],
    },
];

function NotificationIcon({ type, Icon }) {
    return (
        <div className={`notif-icon notif-icon--${type}`}>
            <Icon size={20} strokeWidth={2} />
        </div>
    );
}

function NotificationCard({ item }) {
    const Icon = item.icon;
    return (
        <article
            className={`notif-card ${item.unread ? "notif-card--unread" : ""} ${
                item.critical ? "notif-card--critical" : ""
            }`}
        >
            <NotificationIcon type={item.type} Icon={Icon} />
            <div className="notif-content">
                <div className="notif-row-top">
                    <h3
                        className={`notif-title ${
                            item.critical ? "notif-title--critical" : ""
                        }`}
                    >
                        {item.title}
                    </h3>
                    <span className="notif-time">{item.time}</span>
                </div>
                <p className="notif-desc">{item.description}</p>
                {item.tags && (
                    <div className="notif-tags">
                        {item.tags.map((tag) => (
                            <span key={tag} className="notif-tag">
                {tag}
              </span>
                        ))}
                    </div>
                )}
                {item.link && (
                    <a className="notif-link" href="#campaign-data">
                        {item.link}
                    </a>
                )}
            </div>
        </article>
    );
}

export default function NotificationPage() {
    const [groups, setGroups] = useState(NOTIFICATION_GROUPS);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/login');
        }
    }, []);

    const markAllRead = () => {
        setGroups((prev) =>
            prev.map((g) => ({
                ...g,
                items: g.items.map((i) => ({ ...i, unread: false })),
            }))
        );
    };

    return (
        <div className="wf-app">
            {/* ---------- Top bar ---------- */}
            <header className="wf-topbar">
                <div className="wf-brand">
                    Wash<span>Flow</span> <strong>Pro</strong>
                </div>
                <nav className="wf-topnav">
                    {TOP_NAV.map((label) => (
                        <a key={label} href={`#${label}`} className="wf-topnav__link">
                            {label}
                        </a>
                    ))}
                </nav>
                <div className="wf-topbar__actions">
                    <button className="wf-icon-btn" aria-label="Thông báo">
                        <Bell size={20} />
                    </button>
                    <button className="wf-icon-btn" aria-label="Trợ giúp">
                        <HelpCircle size={20} />
                    </button>
                    <button className="wf-icon-btn" aria-label="Cài đặt">
                        <Settings size={20} />
                    </button>
                    <div className="wf-avatar" aria-label="Tài khoản người dùng" />
                </div>
            </header>

            <div className="wf-body">
                {/* ---------- Sidebar ---------- */}
                <aside className="wf-sidebar">
                    <div className="wf-sidebar__header">
                        <h2>Trung tâm Hệ thống</h2>
                        <p>Trạm #402</p>
                    </div>

                    <nav className="wf-sidebar__nav">
                        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                            <button key={id} className="wf-sidebar__item">
                                <Icon size={18} strokeWidth={2} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>


                    <div className="wf-sidebar__footer">
                        <button className="wf-sidebar__item wf-sidebar__item--muted">
                            <HelpCircle size={18} strokeWidth={2} />
                            <span>Hỗ trợ</span>
                        </button>
                        <button className="wf-sidebar__item wf-sidebar__item--muted" onClick={async () => {
                            try {
                                // sign out from supabase (if used)
                                if (supabase && supabase.auth && typeof supabase.auth.signOut === 'function') {
                                    await supabase.auth.signOut();
                                }
                            } catch (err) {
                                // non-fatal: still clear local state
                                console.warn('Supabase signOut failed', err);
                            }
                            // clear local auth and redirect to login
                            clearAuth();
                            navigate('/login');
                        }}>
                            <LogOut size={18} strokeWidth={2} />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </aside>

                {/* ---------- Main content ---------- */}
                <main className="wf-main">
                    <div className="wf-main__header">
                        <div>
                            <h1>Trung tâm thông báo</h1>
                            <p>Cập nhật các cảnh báo vận hành thời gian thực và tương tác với khách hàng.</p>
                        </div>
                        <button className="wf-mark-read" onClick={markAllRead}>
                            <CheckCheck size={16} />
                            Đánh dấu đã đọc tất cả
                        </button>
                    </div>

                    {groups.map((group) => (
                        <section key={group.id} className="notif-group">
                            <div className="notif-group__label">
                                <span>{group.label}</span>
                                <hr />
                            </div>
                            <div className="notif-list">
                                {group.items.map((item) => (
                                    <NotificationCard key={item.id} item={item} />
                                ))}
                            </div>
                        </section>
                    ))}
                </main>
            </div>
        </div>
    );
}