import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
    Car, LayoutGrid, BarChart2, Calendar, Archive, Megaphone, Bell,
    HelpCircle, Settings, Search, SlidersHorizontal, CheckCheck,
    AlertTriangle, Star, ThumbsUp, Clock,
} from "lucide-react";
import "./AdminNotificationPage.css";
import { getAll, createNotification, createBulk, markAllRead, markAsRead, subscribeSSE, getUnread, countUnread } from '../../api/notificationService';
import { isLoggedIn, logout as clearAuth, getRole } from '../../api/authService';

const SIDEBAR_NAV = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutGrid },
    { id: "analytics", label: "Phân tích", icon: BarChart2 },
    { id: "booking", label: "Đặt lịch", icon: Calendar },
    { id: "inventory", label: "Kho hàng", icon: Archive },
    { id: "marketing", label: "Tiếp thị", icon: Megaphone },
    { id: "notifications", label: "Thông báo", icon: Bell, active: true },
    { id: "catalog", label: "Chi nhánh & Dịch vụ", icon: Settings },
];

// Khớp với enum Notification.NotificationType ở backend — không tự đặt nhãn tùy ý
const NOTIFICATION_TYPES = {
    BOOKING_CONFIRMED:   { label: "Đặt lịch đã xác nhận",   category: "booking" },
    BOOKING_CANCELLED:   { label: "Đặt lịch đã hủy",        category: "booking" },
    BOOKING_RESCHEDULED: { label: "Đặt lịch đổi giờ",        category: "booking" },
    WAITLIST_PROMOTED:   { label: "Được xếp từ danh sách chờ", category: "booking" },
    TIER_UPGRADED:       { label: "Nâng hạng thành viên",    category: "tier" },
    TIER_DOWNGRADED:     { label: "Hạ hạng thành viên",      category: "tier" },
    PAYMENT_COMPLETED:   { label: "Thanh toán hoàn tất",     category: "payment" },
};

const CHANNELS = [
    { id: "in_app", label: "Trong ứng dụng" },
    { id: "sms", label: "SMS" },
    { id: "email", label: "Email" },
];

const FILTERS = [
    { id: "all", label: "Tất cả" },
    { id: "booking", label: "Đặt lịch" },
    { id: "tier", label: "Hạng thành viên" },
    { id: "payment", label: "Thanh toán" },
];

function categoryOf(type) {
    return NOTIFICATION_TYPES[type]?.category || "booking";
}

// initially empty; will be loaded from backend
const GROUPS = [];

function Badge({ label, tone }) {
    return <span className={`an-badge an-badge--${tone}`}>{label}</span>;
}

function NotifCard({ item, onMark }) {
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
                {!item.seen && (
                    <div className="an-card__actions">
                        <button className="an-btn" onClick={() => onMark && onMark(item.id)}>Đánh dấu đã đọc</button>
                    </div>
                )}
            </div>
        </article>
    );
}

export default function AdminNotificationPage() {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all");
    const [groups, setGroups] = useState(GROUPS);
    const [loading, setLoading] = useState(false);
    const [showCompose, setShowCompose] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [type, setType] = useState("");
    const [channel, setChannel] = useState("in_app");
    const [sendMode, setSendMode] = useState("single"); // 'single' | 'broadcast'
    const [targetUserId, setTargetUserId] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [categoryCounts, setCategoryCounts] = useState({ booking: 0, tier: 0, payment: 0 });
    const [toast, setToast] = useState(null);

    function showToast(message){
        setToast(message);
        setTimeout(()=> setToast(null), 2500);
    }

    useEffect(()=>{
        if(!isLoggedIn()){
            navigate('/login');
        }
    },[]);

    // helper to map backend DTO -> card item
    function mapDtoToItem(dto){
        const cat = categoryOf(dto.type);
        const tone = dto.isRead ? 'gray' : (cat === 'payment' ? 'green' : cat === 'tier' ? 'red' : 'blue');
        const icon = cat === 'payment' ? ThumbsUp : cat === 'tier' ? Star : AlertTriangle;
        const time = dto.createdAt ? new Date(dto.createdAt).toLocaleString() : '';
        return {
            id: dto.notificationId,
            icon,
            tone,
            title: dto.title || NOTIFICATION_TYPES[dto.type]?.label || dto.type,
            description: dto.body,
            time,
            category: NOTIFICATION_TYPES[dto.type]?.label || dto.type || 'Thông báo',
            categoryId: cat,
            badge: { label: dto.isRead ? 'Đã đọc' : 'Mới', tone: dto.isRead ? 'gray' : 'blue' },
            seen: dto.isRead,
            raw: dto,
        };
    }

    async function load(){
        setLoading(true);
        try{
            const data = await getAll();
            // group by date
            const today = [];
            const yesterday = [];
            const older = [];
            const now = new Date();
            const catCount = { booking: 0, tier: 0, payment: 0 };
            data.forEach(d => {
                const item = mapDtoToItem(d);
                catCount[item.categoryId] = (catCount[item.categoryId] || 0) + 1;
                const dt = d.createdAt ? new Date(d.createdAt) : null;
                if(!dt) { older.push(item); return; }
                const diff = Math.floor((now - dt)/(1000*60*60*24));
                if(diff === 0) today.push(item);
                else if(diff === 1) yesterday.push(item);
                else older.push(item);
            });
            const newGroups = [];
            if(today.length) newGroups.push({ id: 'today', label: 'HÔM NAY', items: today });
            if(yesterday.length) newGroups.push({ id: 'yesterday', label: 'HÔM QUA', items: yesterday });
            if(older.length) newGroups.push({ id: 'older', label: 'CŨ HƠN', items: older });
            setGroups(newGroups);
            setTotalCount(data.length);
            setCategoryCounts(catCount);
        }catch(err){
            console.error('load notifications', err);
            setFormError('Không tải được danh sách thông báo. Vui lòng thử lại.');
        }finally{ setLoading(false); }
    }

    const [role, setRole] = useState(getRole());
    const [unreadCount, setUnreadCount] = useState(0);
    const [showList, setShowList] = useState(false);
    const [unreadItems, setUnreadItems] = useState([]);

    async function loadUnread(){
        try{
            const u = await getUnread();
            setUnreadItems(u.map(mapDtoToItem));
            const cnt = await countUnread();
            setUnreadCount(cnt.count ?? cnt?.unread ?? 0);
        }catch(err){ console.error('load unread', err); }
    }

    React.useEffect(()=>{
        // ensure role and redirect
        if(!isLoggedIn()){ navigate('/login'); return; }
        setRole(getRole());
        load();
        loadUnread();
        const es = subscribeSSE((payload)=>{
            // payload expected to be NotificationResponseDTO
            if(payload && payload.notificationId){
                setGroups(prev => {
                    const item = mapDtoToItem(payload);
                    const g = [...prev];
                    if(g.length && g[0].id === 'today') g[0].items.unshift(item);
                    else g.unshift({ id: 'today', label: 'HÔM NAY', items: [item] });
                    return g;
                });
                // update unread list & count
                setUnreadItems(u => [mapDtoToItem(payload), ...u]);
                setUnreadCount(c => c + 1);
            }
        });
        return ()=>{ if(es && es.close) es.close(); };
    },[]);

    async function handleMarkAll(){
        try{
            await markAllRead();
            await load();
            await loadUnread();
            showToast('Đã đánh dấu tất cả là đã đọc');
        }catch(err){
            console.error(err);
            showToast('Không thể đánh dấu đã đọc, vui lòng thử lại');
        }
    }

    async function handleMark(id){
        try{ await markAsRead(id); load(); loadUnread(); }catch(err){ console.error(err); }
    }

    function resetComposeForm(){
        setTitle(''); setBody(''); setType(''); setChannel('in_app');
        setSendMode('single'); setTargetUserId('');
    }

    async function handleCreate(e){
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if(!type){
            setFormError('Vui lòng chọn loại thông báo.');
            return;
        }
        if(sendMode === 'single' && !targetUserId.trim()){
            setFormError('Vui lòng nhập ID người dùng nhận thông báo, hoặc chuyển sang "Gửi cho tất cả".');
            return;
        }

        setSubmitting(true);
        try{
            if(sendMode === 'broadcast'){
                const res = await createBulk({ type, title, body, channel });
                showToast(`Đã gửi thông báo đến ${res?.totalSent ?? 0} người dùng`);
            } else {
                const dto = { type, title, body, channel, userId: Number(targetUserId) };
                const created = await createNotification(dto);
                const item = mapDtoToItem(created);
                setGroups(prev => {
                    if(prev.length && prev[0].id === 'today') { prev[0].items.unshift(item); return [...prev]; }
                    return [{ id: 'today', label: 'HÔM NAY', items: [item] }, ...prev];
                });
                showToast('Đã gửi thông báo');
            }
            setFormSuccess('Gửi thông báo thành công.');
            resetComposeForm();
            setShowCompose(false);
        }catch(err){
            console.error('create', err);
            const apiMsg = err?.response?.data?.message;
            setFormError(apiMsg || 'Gửi thông báo thất bại. Vui lòng kiểm tra lại thông tin (đặc biệt là ID người dùng).');
        }finally{
            setSubmitting(false);
        }
    }

    const handleSidebarClick = (id) => {
        if (id === "catalog") {
            navigate("/admin/catalog");
        } else if (id === "notifications") {
            navigate("/admin/notifications");
        } else {
            alert("Chức năng đang phát triển!");
        }
    };

    const filteredGroups = groups
        .map(g => ({
            ...g,
            items: activeFilter === 'all' ? g.items : g.items.filter(it => it.categoryId === activeFilter),
        }))
        .filter(g => g.items.length > 0);

    return (
        <div className="an-app">
            <aside className="an-sidebar">
                <div className="an-brand">
                    <img src="/logo.png" alt="WashFlow Pro" style={{ height: "36px", width: "auto", alignSelf: "center" }} />
                    <div>
                        <h1>WashFlow Pro</h1>
                        <p>Bảng điều khiển Admin</p>
                    </div>
                </div>

                <nav className="an-sidebar__nav">
                    {SIDEBAR_NAV.map(({ id, label, icon: Icon, active }) => (
                        <button
                            key={id}
                            className={`an-sidebar__item ${active ? "is-active" : ""}`}
                            onClick={() => handleSidebarClick(id)}
                        >
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
                    <button className="an-sidebar__item an-sidebar__item--muted" onClick={() => { clearAuth(); navigate('/login'); }}>
                        <Megaphone size={18} /><span>Đăng xuất</span>
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
                        <button className="an-icon-btn" onClick={async ()=>{ await loadUnread(); setShowList(s=>!s); }}>
                            <Bell size={18} />
                            {unreadCount > 0 && <span className="an-bell-badge">{unreadCount}</span>}
                        </button>
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
                    <button className="an-mark-read" onClick={handleMarkAll}>
                        <CheckCheck size={16} /> Đánh dấu tất cả là đã đọc
                    </button>
                    {role === 'ADMIN' && (
                        <button className="an-filter-advanced" onClick={()=>setShowCompose(s=>!s)}>
                            <Megaphone size={16} /> {showCompose ? 'Đóng' : 'Tạo thông báo'}
                        </button>
                    )}
                </div>

                <div className="an-content">
                    <div className="an-list">
                        {showCompose && (
                            <form className="an-compose" onSubmit={handleCreate}>
                                <h3>Tạo thông báo mới</h3>

                                {formError && <div className="an-form-error">{formError}</div>}

                                <label className="an-field-label">Loại thông báo</label>
                                <select value={type} onChange={e=>setType(e.target.value)} required>
                                    <option value="" disabled>Chọn loại thông báo…</option>
                                    {Object.entries(NOTIFICATION_TYPES).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>

                                <input placeholder="Tiêu đề (tối đa 100 ký tự)" value={title} maxLength={100} onChange={e=>setTitle(e.target.value)} required />
                                <textarea placeholder="Nội dung (tối đa 500 ký tự)" value={body} maxLength={500} onChange={e=>setBody(e.target.value)} />

                                <label className="an-field-label">Kênh gửi</label>
                                <select value={channel} onChange={e=>setChannel(e.target.value)}>
                                    {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>

                                <label className="an-field-label">Đối tượng nhận</label>
                                <div className="an-send-mode">
                                    <button type="button"
                                            className={`an-filter ${sendMode === 'single' ? 'is-active' : ''}`}
                                            onClick={()=>setSendMode('single')}>
                                        Một người dùng
                                    </button>
                                    <button type="button"
                                            className={`an-filter ${sendMode === 'broadcast' ? 'is-active' : ''}`}
                                            onClick={()=>setSendMode('broadcast')}>
                                        Tất cả khách hàng đang hoạt động
                                    </button>
                                </div>

                                {sendMode === 'single' && (
                                    <input placeholder="ID người dùng nhận thông báo" value={targetUserId} onChange={e=>setTargetUserId(e.target.value)} required />
                                )}
                                {sendMode === 'broadcast' && (
                                    <p className="an-hint">Thông báo sẽ được gửi đến tất cả người dùng có trạng thái hoạt động (active).</p>
                                )}

                                <div className="an-compose__actions">
                                    <button className="an-btn" type="submit" disabled={submitting}>
                                        {submitting ? 'Đang gửi…' : 'Gửi'}
                                    </button>
                                    <button type="button" className="an-btn an-btn--muted" onClick={()=>{ setShowCompose(false); setFormError(''); }}>Hủy</button>
                                </div>
                            </form>
                        )}

                        {filteredGroups.length === 0 && !loading && (
                            <div className="an-empty">Không có thông báo phù hợp.</div>
                        )}
                        {filteredGroups.map((group) => (
                            <section key={group.id} className="an-group">
                                <h2 className="an-group__label">{group.label}</h2>
                                <div className="an-group__items">
                                    {group.items.map((item) => (
                                        <NotifCard key={item.id} item={item} onMark={handleMark} />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {/* unread dropdown for quick access (opened by bell) */}
                        {showList && (
                            <div className="an-unread-dropdown">
                                <h4>Thông báo chưa đọc ({unreadCount})</h4>
                                <div className="an-unread-items">
                                    {unreadItems.length === 0 && <div className="an-empty">Không có thông báo chưa đọc</div>}
                                    {unreadItems.map(it => (
                                        <div key={it.id} className="an-unread-item">
                                            <div className="an-unread-item__title">{it.title}</div>
                                            <div className="an-unread-item__time">{it.time}</div>
                                            <div className="an-unread-item__actions">
                                                <button className="an-btn an-btn--small" onClick={async ()=>{ await handleMark(it.id); await loadUnread(); setShowList(false); }}>Đánh dấu đã đọc</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="an-unread-footer">
                                    <button className="an-btn an-btn--muted" onClick={()=>{ setShowList(false); }}>Đóng</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className="an-side">
                        <div className="an-overview">
                            <h3>Tổng quan thông báo</h3>
                            <div className="an-overview__stats">
                                <div>
                                    <strong>{totalCount}</strong>
                                    <span>Tổng số thông báo</span>
                                </div>
                                <div>
                                    <strong>{unreadCount}</strong>
                                    <span>Chưa đọc</span>
                                </div>
                            </div>
                        </div>

                        <div className="an-legend">
                            <h3>Theo loại</h3>
                            <ul>
                                <li>
                                    <span className="an-legend__dot an-legend__dot--blue" />
                                    Đặt lịch ({categoryCounts.booking || 0})
                                </li>
                                <li>
                                    <span className="an-legend__dot an-legend__dot--red" />
                                    Hạng thành viên ({categoryCounts.tier || 0})
                                </li>
                                <li>
                                    <span className="an-legend__dot an-legend__dot--green" />
                                    Thanh toán ({categoryCounts.payment || 0})
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>

            {toast && (
                <div className="an-toast">
                    <CheckCheck size={16} /> {toast}
                </div>
            )}
        </div>
    );
}