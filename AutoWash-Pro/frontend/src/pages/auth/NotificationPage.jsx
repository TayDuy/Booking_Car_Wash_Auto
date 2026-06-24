import { useEffect, useRef, useState, useCallback } from "react";
import {
    Bell, HelpCircle, Settings, Radio, ClipboardList, Droplet, Users,
    BarChart2, LifeBuoy, LogOut, CalendarCheck, CalendarX, CalendarClock,
    ListPlus, ArrowUpCircle, ArrowDownCircle, Wallet, CheckCheck, Loader2,
    WifiOff,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api/v1";

const navItems = [
    { icon: Radio, label: "Giám sát trực tiếp" },
    { icon: ClipboardList, label: "Quản lý hàng đợi" },
    { icon: Droplet, label: "Mức hóa chất" },
    { icon: Users, label: "Lịch nhân viên" },
    { icon: BarChart2, label: "Phân tích" },
];

// Map NotificationType (backend enum) -> hiển thị UI
const TYPE_META = {
    BOOKING_CONFIRMED: { Icon: CalendarCheck, iconBg: "bg-blue-100", iconColor: "text-blue-600", accent: "border-l-blue-600" },
    BOOKING_CANCELLED: { Icon: CalendarX, iconBg: "bg-red-100", iconColor: "text-red-500", accent: "border-l-red-500" },
    BOOKING_RESCHEDULED: { Icon: CalendarClock, iconBg: "bg-amber-100", iconColor: "text-amber-600", accent: "border-l-amber-500" },
    WAITLIST_PROMOTED: { Icon: ListPlus, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", accent: "border-l-emerald-500" },
    TIER_UPGRADED: { Icon: ArrowUpCircle, iconBg: "bg-purple-100", iconColor: "text-purple-600", accent: "border-l-purple-500" },
    TIER_DOWNGRADED: { Icon: ArrowDownCircle, iconBg: "bg-slate-100", iconColor: "text-slate-500", accent: "border-l-slate-400" },
    PAYMENT_COMPLETED: { Icon: Wallet, iconBg: "bg-cyan-100", iconColor: "text-cyan-600", accent: "border-l-cyan-500" },
};
const DEFAULT_META = { Icon: Bell, iconBg: "bg-slate-100", iconColor: "text-slate-500", accent: "border-l-slate-400" };

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}

function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function groupByDate(items) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const groups = { today: [], yesterday: [], older: [] };
    for (const n of items) {
        const created = new Date(n.createdAt);
        if (isSameDay(created, now)) groups.today.push(n);
        else if (isSameDay(created, yesterday)) groups.yesterday.push(n);
        else groups.older.push(n);
    }
    return groups;
}

function NotificationCard({ n, onMarkRead }) {
    const meta = TYPE_META[n.type] || DEFAULT_META;
    const unread = !n.isRead;

    return (
        <button
            onClick={() => unread && onMarkRead(n.notificationId)}
            className={[
                "flex w-full gap-4 rounded-xl p-5 text-left transition-colors",
                unread
                    ? `bg-white border border-slate-200 border-l-4 ${meta.accent} shadow-sm hover:bg-slate-50`
                    : "bg-slate-50 hover:bg-slate-100",
            ].join(" ")}
        >
            <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${meta.iconBg}`}>
                <meta.Icon className={`h-5 w-5 ${meta.iconColor}`} strokeWidth={2} />
            </div>

            <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-slate-900">{n.title}</h3>
                    <span className="flex-none whitespace-nowrap text-sm text-slate-400">
            {formatTime(n.createdAt)}
          </span>
                </div>
                {n.username && (
                    <p className="mt-0.5 text-xs text-slate-400">Khách hàng: {n.username}</p>
                )}
                {n.body && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{n.body}</p>
                )}
                {n.status === "failed" && (
                    <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
            Gửi thất bại — đang thử lại ({n.retryCount ?? 0}/3)
          </span>
                )}
                {n.status === "dead_lettered" && (
                    <span className="mt-2 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
            Gửi thất bại sau {n.retryCount ?? 3} lần thử — cần xử lý thủ công
          </span>
                )}
            </div>

            {unread && (
                <span className="mt-1 h-2 w-2 flex-none rounded-full bg-blue-600" aria-label="Chưa đọc" />
            )}
        </button>
    );
}

function SectionLabel({ children }) {
    return (
        <div className="mb-4 flex items-center gap-4">
            <span className="flex-none text-xs font-bold tracking-wider text-slate-400">{children}</span>
            <div className="h-px flex-1 bg-slate-200" />
        </div>
    );
}

export default function NotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);
    const eventSourceRef = useRef(null);

    // ── Đếm chưa đọc từ server (GET /unread/count) ──────────────────────
    const refreshUnreadCount = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/notifications/unread/count`, {
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error();
            const json = await res.json();
            setUnreadCount(json.data?.unreadCount ?? 0);
        } catch {
            // giữ giá trị cũ nếu lỗi, không chặn UI
        }
    }, []);

    // ── Load danh sách ban đầu ──────────────────────────────────────────
    const loadNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/notifications`, {
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error(`Lỗi tải thông báo (${res.status})`);
            const json = await res.json();
            setNotifications(json.data ?? []);
        } catch (err) {
            setError(err.message || "Không thể tải thông báo");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
        refreshUnreadCount();
    }, [loadNotifications, refreshUnreadCount]);

    // ── SSE: nhận thông báo mới real-time ───────────────────────────────
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        // EventSource không cho set header Authorization, nên truyền token qua query string.
        // Backend cần đọc token từ param này khi xác thực kết nối SSE.
        const url = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => setConnected(true);

        es.onmessage = (event) => {
            try {
                const newNotification = JSON.parse(event.data);
                setNotifications((prev) => {
                    if (prev.some((n) => n.notificationId === newNotification.notificationId)) {
                        return prev;
                    }
                    return [newNotification, ...prev];
                });
                if (!newNotification.isRead) {
                    setUnreadCount((prev) => prev + 1);
                }
            } catch {
                // bỏ qua event không parse được (ví dụ heartbeat ping)
            }
        };

        es.onerror = () => {
            setConnected(false);
            // EventSource tự reconnect; không cần xử lý thêm.
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, []);

    // ── Đánh dấu đã đọc 1 thông báo ──────────────────────────────────────
    const markAsRead = useCallback(async (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        try {
            const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error();
            refreshUnreadCount(); // đồng bộ lại số thật từ server (phòng trường hợp đa thiết bị)
        } catch {
            // Rollback nếu request thất bại
            setNotifications((prev) =>
                prev.map((n) => (n.notificationId === id ? { ...n, isRead: false } : n))
            );
            setUnreadCount((prev) => prev + 1);
        }
    }, [refreshUnreadCount]);

    // ── Đánh dấu tất cả đã đọc ───────────────────────────────────────────
    const markAllAsRead = useCallback(async () => {
        const previousList = notifications;
        const previousCount = unreadCount;
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            const res = await fetch(`${API_BASE}/notifications/read-all`, {
                method: "PATCH",
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error();
        } catch {
            setNotifications(previousList);
            setUnreadCount(previousCount);
        }
    }, [notifications, unreadCount]);

    const groups = groupByDate(notifications);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Top bar */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-4">
                <div className="flex items-center gap-10">
                    <span className="text-2xl font-extrabold text-blue-700">WashFlow Pro</span>
                    <nav className="flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#" className="hover:text-slate-900">Bảng điều khiển</a>
                        <a href="#" className="hover:text-slate-900">Đặt lịch</a>
                        <a href="#" className="hover:text-slate-900">Kho hàng</a>
                        <a href="#" className="hover:text-slate-900">Báo cáo</a>
                    </nav>
                </div>
                <div className="flex items-center gap-5 text-slate-500">
                    <div className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
                        )}
                    </div>
                    <HelpCircle className="h-5 w-5" />
                    <Settings className="h-5 w-5" />
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-300" />
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className="flex w-64 flex-none flex-col justify-between border-r border-slate-200 px-6 py-8"
                    style={{ minHeight: "calc(100vh - 65px)" }}
                >
                    <div>
                        <h2 className="text-xl font-bold text-blue-700">Trung tâm Hệ thống</h2>
                        <p className="mt-1 text-sm text-slate-400">Trạm #402</p>

                        <nav className="mt-8 flex flex-col gap-1">
                            {navItems.map(({ icon: Icon, label }) => (
                                <a
                                    key={label}
                                    href="#"
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                >
                                    <Icon className="h-[18px] w-[18px] text-slate-400" />
                                    {label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div>
                        <nav className="flex flex-col gap-1">
                            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                                <LifeBuoy className="h-[18px] w-[18px] text-slate-400" />
                                Hỗ trợ
                            </a>
                            <button
                                onClick={logout}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                                <LogOut className="h-[18px] w-[18px] text-slate-400" />
                                Đăng xuất
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 px-10 py-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-slate-900">Trung tâm thông báo</h1>
                                {!connected && (
                                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                    <WifiOff className="h-3.5 w-3.5" />
                    Mất kết nối real-time
                  </span>
                                )}
                            </div>
                            <p className="mt-1 text-slate-500">
                                Cập nhật các cảnh báo vận hành thời gian thực và tương tác với khách hàng.
                            </p>
                        </div>
                        <button
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className="flex flex-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Đánh dấu đã đọc tất cả
                        </button>
                    </div>

                    {loading && (
                        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm">Đang tải thông báo…</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
                            <p className="text-sm text-red-500">{error}</p>
                            <button
                                onClick={loadNotifications}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && notifications.length === 0 && (
                        <div className="mt-16 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
                            <Bell className="h-8 w-8" />
                            <p className="text-sm">Chưa có thông báo nào.</p>
                        </div>
                    )}

                    {!loading && !error && notifications.length > 0 && (
                        <>
                            {groups.today.length > 0 && (
                                <div className="mt-8">
                                    <SectionLabel>HÔM NAY</SectionLabel>
                                    <div className="flex flex-col gap-4">
                                        {groups.today.map((n) => (
                                            <NotificationCard key={n.notificationId} n={n} onMarkRead={markAsRead} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {groups.yesterday.length > 0 && (
                                <div className="mt-10">
                                    <SectionLabel>HÔM QUA</SectionLabel>
                                    <div className="flex flex-col gap-3">
                                        {groups.yesterday.map((n) => (
                                            <NotificationCard key={n.notificationId} n={n} onMarkRead={markAsRead} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {groups.older.length > 0 && (
                                <div className="mt-10">
                                    <SectionLabel>CŨ HƠN</SectionLabel>
                                    <div className="flex flex-col gap-3">
                                        {groups.older.map((n) => (
                                            <NotificationCard key={n.notificationId} n={n} onMarkRead={markAsRead} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}