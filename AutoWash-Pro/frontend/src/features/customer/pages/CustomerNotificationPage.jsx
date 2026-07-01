import React, { useState, useEffect } from "react";
import {
    Waves, Calendar, CheckCircle2, Gift, Star, Megaphone,
    HelpCircle, ChevronDown, CheckCheck, Bell, Copy, BellOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CustomerNotificationPage.css";
import { getAll, markAsRead, markAllRead } from "../../../api/notificationService";
import { isLoggedIn } from '../../../api/authService';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: "all",     label: "Tất cả",            icon: "bell" },
    { id: "booking", label: "Cập nhật Đặt lịch", icon: Calendar },
    { id: "reward",  label: "Ưu đãi & Quà tặng", icon: Gift },
    { id: "promo",   label: "Khuyến mãi",         icon: Megaphone },
];

const TOP_NAV = [
    { label: "Trang chủ",  path: "/" },
    { label: "Đặt lịch",   path: "/booking" },
    { label: "Gói dịch vụ",path: "/packages" },
    { label: "Thông báo",  path: "/notifications", active: true },
];

// Map backend type string → UI category id
// Adjust these keys to match whatever your backend returns in dto.type
const TYPE_TO_CATEGORY = {
    BOOKING:  "booking",
    SCHEDULE: "booking",
    REMINDER: "booking",
    REWARD:   "reward",
    VOUCHER:  "reward",
    GIFT:     "reward",
    PROMO:    "promo",
    PROMOTION:"promo",
    MARKETING:"promo",
};

// Map category id → icon + colour tone
const CATEGORY_META = {
    booking: { icon: Calendar,    tone: "blue"   },
    reward:  { icon: Gift,        tone: "cyan"   },
    promo:   { icon: Megaphone,   tone: "red"    },
    default: { icon: Bell,        tone: "indigo" },
};

// Map category id → display group label
const GROUP_LABELS = {
    booking: "CẬP NHẬT ĐẶT LỊCH",
    reward:  "ƯU ĐÃI & QUÀ TẶNG",
    promo:   "KHUYẾN MÃI",
    default: "THÔNG BÁO KHÁC",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferCategory(dto) {
    if (!dto.type) return "default";
    const key = dto.type.toString().toUpperCase();
    for (const [k, v] of Object.entries(TYPE_TO_CATEGORY)) {
        if (key.includes(k)) return v;
    }
    return "default";
}

function mapDtoToItem(dto) {
    const catId = inferCategory(dto);
    const { icon, tone } = CATEGORY_META[catId] ?? CATEGORY_META.default;
    return {
        id:          dto.notificationId ?? dto.id,
        icon,
        tone:        dto.isRead ? "indigo" : tone,   // dim read items a bit
        title:       dto.title  ?? "(Không có tiêu đề)",
        description: dto.body   ?? dto.message ?? "",
        time:        dto.createdAt ? new Date(dto.createdAt).toLocaleString("vi-VN") : "",
        unread:      !dto.isRead,
        voucherCode: dto.voucherCode ?? null,
        catId,
    };
}

function buildGroups(items) {
    // preserve a stable category order
    const ORDER = ["booking", "reward", "promo", "default"];
    const buckets = {};
    items.forEach(item => {
        const key = item.catId in GROUP_LABELS ? item.catId : "default";
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(item);
    });
    return ORDER
        .filter(k => buckets[k]?.length)
        .map(k => ({ id: k, label: GROUP_LABELS[k], items: buckets[k] }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotifIcon({ Icon, tone }) {
    return (
        <div className={`cn-icon cn-icon--${tone}`}>
            <Icon size={20} strokeWidth={2} />
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "64px 24px", color: "var(--cn-text-muted)",
            gap: 12,
        }}>
            <BellOff size={40} strokeWidth={1.5} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Không có thông báo</p>
            <p style={{ margin: 0, fontSize: 13.5 }}>Bạn đã cập nhật tất cả thông tin rồi!</p>
        </div>
    );
}

function NotifCard({ item, isFirst, onMarkRead, onCopy }) {
    const Icon = item.icon;
    return (
        <article className={`cn-card ${item.unread ? "cn-card--unread" : ""} ${isFirst ? "cn-card--highlight" : ""}`}>
            <NotifIcon Icon={Icon} tone={item.tone} />
            <div className="cn-card__body">
                <div className="cn-card__top">
                    <h3>{item.title}</h3>
                    <span className="cn-card__time">{item.time}</span>
                </div>
                <p className="cn-card__desc">{item.description}</p>

                {item.voucherCode && (
                    <div className="cn-voucher">
                        <div>
                            <span className="cn-voucher__label">MÃ GIẢM GIÁ</span>
                            <span className="cn-voucher__code">{item.voucherCode}</span>
                        </div>
                        <button
                            className="cn-voucher__copy"
                            onClick={() => {
                                navigator.clipboard.writeText(item.voucherCode);
                                onCopy?.(item.voucherCode);
                            }}
                        >
                            <Copy size={14} /> Sao chép
                        </button>
                    </div>
                )}

                {item.unread && (
                    <button
                        className="cn-btn cn-btn--mark-read"
                        onClick={() => onMarkRead?.(item.id)}
                    >
                        Đánh dấu đã đọc
                    </button>
                )}
            </div>
        </article>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerNotificationPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [allItems, setAllItems]             = useState([]);   // flat list from API
    const [loading, setLoading]               = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn()) { navigate('/login'); return; }
        loadNotifications();
    }, []);

    async function loadNotifications() {
        setLoading(true);
        try {
            const data = await getAll();          // array of NotificationResponseDTO
            setAllItems((data ?? []).map(mapDtoToItem));
        } catch (err) {
            console.error('load notifications', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkRead(id) {
        try {
            await markAsRead(id);
            setAllItems(prev => prev.map(it => it.id === id ? { ...it, unread: false } : it));
        } catch (err) {
            console.error('mark as read', err);
        }
    }

    async function handleMarkAllRead() {
        try {
            await markAllRead();
            setAllItems(prev => prev.map(it => ({ ...it, unread: false })));
        } catch (err) {
            console.error('mark all as read', err);
        }
    }

    function handleCopy(code) {
        console.log('Copied:', code);
    }

    // ── Derived state ────────────────────────────────────────────────────────

    const filteredItems =
        activeCategory === "all"
            ? allItems
            : allItems.filter(it => it.catId === activeCategory);

    const visibleGroups = buildGroups(filteredItems);

    const counts = {
        all:     allItems.length,
        booking: allItems.filter(it => it.catId === "booking").length,
        reward:  allItems.filter(it => it.catId === "reward").length,
        promo:   allItems.filter(it => it.catId === "promo").length,
    };

    const unreadTotal = allItems.filter(it => it.unread).length;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="cn-app">
            <div className="cn-body">
                {/* ── Sidebar ── */}
                <aside className="cn-sidebar">
                    <p className="cn-sidebar__label">PHÂN LOẠI</p>
                    <nav className="cn-sidebar__nav">
                        {CATEGORIES.map(c => (
                            <button
                                key={c.id}
                                className={`cn-sidebar__item ${activeCategory === c.id ? "is-active" : ""}`}
                                onClick={() => setActiveCategory(c.id)}
                            >
                                <span className="cn-sidebar__item-left">
                                    {c.icon === "bell"
                                        ? <Bell size={18} />
                                        : <c.icon size={18} />}
                                    {c.label}
                                </span>
                                <span className="cn-sidebar__count">{counts[c.id] ?? 0}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="cn-promo-card">
                        <span className="cn-promo-card__tag">SẮP DIỄN RA</span>
                        <h4>Ưu đãi Rửa xe 0đ</h4>
                        <p>Dành cho thành viên Vàng vào thứ 4 hàng tuần.</p>
                    </div>
                </aside>

                {/* ── Main ── */}
                <main className="cn-main">
                    <div className="cn-main__header">
                        <div>
                            <h1>Trung tâm Thông báo</h1>
                            <p>Cập nhật những thông tin mới nhất về dịch vụ của bạn.</p>
                        </div>
                        <button className="cn-mark-read" onClick={handleMarkAllRead}>
                            <CheckCheck size={16} />
                            Đánh dấu tất cả đã đọc
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: 48, color: "var(--cn-text-muted)" }}>
                            Đang tải thông báo…
                        </div>
                    ) : visibleGroups.length === 0 ? (
                        <EmptyState />
                    ) : (
                        visibleGroups.map((group, gi) => (
                            <section key={group.id} className="cn-group">
                                <h2 className="cn-group__label">{group.label}</h2>
                                <div className="cn-group__list">
                                    {group.items.map((item, idx) => (
                                        <NotifCard
                                            key={item.id}
                                            item={item}
                                            isFirst={gi === 0 && idx === 0}
                                            onMarkRead={handleMarkRead}
                                            onCopy={handleCopy}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}

                    {!loading && visibleGroups.length > 0 && (
                        <button className="cn-load-more">
                            Tải thêm thông báo <ChevronDown size={16} />
                        </button>
                    )}
                </main>
            </div>
        </div>
    );
}