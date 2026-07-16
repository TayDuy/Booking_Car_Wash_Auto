import React, { useState, useEffect } from "react";
import {
    Calendar, Gift, Megaphone,
    ChevronDown, CheckCheck, Bell, Copy, BellOff, Trash2, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CustomerNotificationPage.css";
import {
    getAll, markAsRead, markAllRead,
    deleteNotification, deleteAllNotifications, subscribeSSE,
} from "../../../api/notificationService";
import { isLoggedIn } from '../../../api/authService';

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

const CATEGORY_META = {
    booking: { icon: Calendar,    tone: "blue"   },
    reward:  { icon: Gift,        tone: "cyan"   },
    promo:   { icon: Megaphone,   tone: "red"    },
    default: { icon: Bell,        tone: "indigo" },
};

const GROUP_LABELS = {
    booking: "CẬP NHẬT ĐẶT LỊCH",
    reward:  "ƯU ĐÃI & QUÀ TẶNG",
    promo:   "KHUYẾN MÃI",
    default: "THÔNG BÁO KHÁC",
};

const PROMO_TAGS = {
    reward: "ƯU ĐÃI",
    promo:  "KHUYẾN MÃI",
};

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
        tone:        dto.isRead ? "indigo" : tone,
        title:       dto.title  ?? "(Không có tiêu đề)",
        description: dto.body   ?? dto.message ?? "",
        time:        dto.createdAt ? new Date(dto.createdAt).toLocaleString("vi-VN") : "",
        unread:      !dto.isRead,
        voucherCode: dto.voucherCode ?? null,
        catId,
    };
}

function buildGroups(items) {
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

function pickPromoHighlight(items) {
    const candidates = items.filter(it => it.catId === "promo" || it.catId === "reward");
    if (candidates.length === 0) return null;
    const unread = candidates.filter(it => it.unread);
    return unread[0] ?? candidates[0];
}

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

function NotifCard({ item, isFirst, onMarkRead, onCopy, onDelete }) {
    const Icon = item.icon;
    return (
        <article className={`cn-card ${item.unread ? "cn-card--unread" : ""} ${isFirst ? "cn-card--highlight" : ""}`}>
            <NotifIcon Icon={Icon} tone={item.tone} />
            <div className="cn-card__body">
                <div className="cn-card__top">
                    <h3>{item.title}</h3>
                    <div className="cn-card__top-right">
                        <span className="cn-card__time">{item.time}</span>
                        <button
                            className="cn-card__delete"
                            title="Xóa thông báo"
                            onClick={() => onDelete?.(item.id)}
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
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

function PromoHighlightBanner({ item }) {
    if (!item) return null;
    const tag = PROMO_TAGS[item.catId] ?? "ƯU ĐÃI";
    return (
        <div className="cn-promo-card">
            <span className="cn-promo-card__tag">{tag}</span>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
        </div>
    );
}

function RealtimeToast({ toast, onClose }) {
    if (!toast) return null;
    const Icon = toast.icon;
    return (
        <div className="cn-toast" onClick={onClose}>
            <NotifIcon Icon={Icon} tone={toast.tone} />
            <div className="cn-toast__body">
                <h4>{toast.title}</h4>
                <p>{toast.description}</p>
            </div>
            <button
                className="cn-toast__close"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                <X size={14} />
            </button>
        </div>
    );
}

export default function CustomerNotificationPage() {
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [toast, setToast]       = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn()) { navigate('/login'); return; }
        loadNotifications();

        const sub = subscribeSSE(
            (dto) => {
                const item = mapDtoToItem(dto);
                setAllItems(prev => [item, ...prev.filter(it => it.id !== item.id)]);
                setToast(item);
            },
            (revokedId) => {
                setAllItems(prev => prev.filter(it => it.id !== revokedId));
                setToast(t => (t && t.id === revokedId ? null : t));
            }
        );
        return () => sub.close();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 6000);
        return () => clearTimeout(t);
    }, [toast]);

    async function loadNotifications() {
        setLoading(true);
        try {
            const data = await getAll();
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

    async function handleDelete(id) {
        const prevItems = allItems;
        setAllItems(prev => prev.filter(it => it.id !== id));
        try {
            await deleteNotification(id);
        } catch (err) {
            console.error('delete notification', err);
            setAllItems(prevItems);
        }
    }

    const visibleGroups = buildGroups(allItems);
    const promoHighlight = pickPromoHighlight(allItems);

    return (
        <div className="cn-app">
            <main className="cn-main cn-main--full">
                <div className="cn-main__header">
                    <div>
                        <h1>Trung tâm Thông báo</h1>
                        <p>Cập nhật những thông tin mới nhất về dịch vụ của bạn.</p>
                    </div>
                    <div className="cn-header__actions">
                        <button className="cn-mark-read" onClick={handleMarkAllRead}>
                            <CheckCheck size={16} />
                            Đánh dấu tất cả đã đọc
                        </button>
                    </div>
                </div>

                <PromoHighlightBanner item={promoHighlight} />

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
                                        onDelete={handleDelete}
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

            <RealtimeToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}