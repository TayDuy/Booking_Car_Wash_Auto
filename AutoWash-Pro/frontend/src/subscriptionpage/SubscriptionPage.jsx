import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubscriptionPage.css';
import customerApi from '../api/customerApi';
import bookingApi from '../api/bookingApi';
import { getActiveServices } from '../api/servicePackageService';
import { logout } from '../api/authService';

// Map tierId (1=Đồng, 2=Bạc, 3=Vàng) sang tên hiển thị tiếng Việt
const getTierName = (id) => {
    if (id === 3) return 'Vàng';
    if (id === 2) return 'Bạc';
    return 'Đồng';
};

// Map từng hạng thành viên ra danh sách quyền lợi hiển thị trên thẻ "Gói đang hoạt động"
const TIER_DETAILS = {
    1: {
        name: 'Gói Đồng Tiết Kiệm',
        price: 99000,
        perks: ['Rửa xe cơ bản không giới hạn'],
    },
    2: {
        name: 'Gói Bạc Premium',
        price: 199000,
        perks: ['Rửa xe cao cấp không giới hạn', 'Làn ưu tiên'],
    },
    3: {
        name: 'Gói Vàng VVIP',
        price: 399000,
        perks: ['Rửa xe Gold không giới hạn', 'Làn ưu tiên', 'Chăm sóc xe tận nơi (1 lần/tháng)'],
    },
};

const currency = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const SubscriptionPage = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({
        fullName: '',
        username: '',
        tierId: 1,
        totalPoints: 0,
    });
    const [packages, setPackages] = useState([]);
    const [billingHistory, setBillingHistory] = useState([]);
    const [pendingTierId, setPendingTierId] = useState(null); // gói đang chờ xác nhận thay đổi

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const profileRes = await customerApi.profile();
            const profile = profileRes.data || {};
            setUser((prev) => ({ ...prev, ...profile }));

            try {
                const pkgRes = await getActiveServices();
                setPackages(pkgRes.data || []);
            } catch (err) {
                console.error('Lỗi tải danh sách gói dịch vụ:', err);
            }

            if (profile.customerId) {
                try {
                    const bookingsRes = await bookingApi.myBookings(profile.customerId);
                    const paidBookings = (bookingsRes.data || []).filter((b) => b.totalAmount > 0);
                    setBillingHistory(paidBookings);
                } catch (err) {
                    console.error('Lỗi tải lịch sử thanh toán:', err);
                }
            }
        } catch (err) {
            console.error('Lỗi tải dữ liệu gói đăng ký:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentTier = TIER_DETAILS[user.tierId] || TIER_DETAILS[1];

    const handleSelectTier = (tierId) => {
        if (tierId === user.tierId) return;
        setPendingTierId(tierId);
    };

    const confirmTierChange = () => {
        if (!pendingTierId) return;
        setUser((prev) => ({ ...prev, tierId: pendingTierId }));
        setPendingTierId(null);
        alert('Yêu cầu thay đổi gói đã được ghi nhận. Đội ngũ AutoWash-Pro sẽ kích hoạt trong giây lát.');
    };

    if (loading) {
        return (
            <div className="sub-page-wrapper">
                <div className="sub-loading">Đang tải thông tin gói đăng ký...</div>
            </div>
        );
    }

    return (
        <div className="sub-page-wrapper">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1 className="logo-text">WashFlow Pro</h1>
                </div>

                <div className="sidebar-profile">
                    <div className="avatar-container">
                        <img alt="Ảnh đại diện" className="avatar-img" src="/car_avatar.png" />
                    </div>
                    <div className="profile-info">
                        <span className="profile-name">{user.fullName || user.username}</span>
                        <span className="profile-tier">Thành viên {getTierName(user.tierId)}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <a className="nav-link" href="/booking" onClick={(e) => { e.preventDefault(); navigate('/booking'); }}>
                        <span className="material-symbols-outlined">dashboard</span>
                        Bảng điều khiển
                    </a>
                    <a className="nav-link" href="/profile" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
                        <span className="material-symbols-outlined">directions_car</span>
                        Xe của tôi
                    </a>
                    <a className="nav-link" href="/bookings" onClick={(e) => { e.preventDefault(); navigate('/bookings'); }}>
                        <span className="material-symbols-outlined">history</span>
                        Lịch sử rửa xe
                    </a>
                    <a className="nav-link active" href="/subscription" onClick={(e) => e.preventDefault()}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                        Gói đăng ký
                    </a>
                    <a className="nav-link" href="/profile" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
                        <span className="material-symbols-outlined">settings</span>
                        Cài đặt
                    </a>
                    <a className="nav-link" href="#logout" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                        <span className="material-symbols-outlined">logout</span>
                        Đăng xuất
                    </a>
                </nav>

                <button className="btn-book" onClick={() => navigate('/booking')}>
                    <span className="material-symbols-outlined icon-small">add</span>
                    Đặt lịch ngay
                </button>
            </aside>

            <main className="main-area">
                <header className="topbar glass-header">
                    <div className="topbar-titles">
                        <h2 className="page-title">Ưu đãi thành viên</h2>
                        <p className="page-subtitle">Chọn gói phù hợp với nhu cầu chăm sóc xe của bạn.</p>
                    </div>
                </header>

                <div className="content-canvas">

                    <section className="card card-shadow current-plan-card">
                        <div className="current-plan-top">
                            <div>
                                <span className="status-pill">GÓI ĐANG HOẠT ĐỘNG</span>
                                <h3 className="current-plan-name">{currentTier.name}</h3>
                            </div>
                            <div className="current-plan-cost">
                                <span className="cost-label">Chi phí hàng tháng</span>
                                <strong className="cost-value">{currency(currentTier.price)}/tháng</strong>
                            </div>
                        </div>

                        <div className="current-plan-meta">
                            <div className="meta-item">
                <span className="meta-label">
                  <span className="material-symbols-outlined icon-small">calendar_month</span>
                  Điểm tích lũy hiện tại
                </span>
                                <strong className="meta-value">{user.totalPoints || 0} điểm</strong>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Quyền lợi đang dùng</span>
                                <div className="meta-perks">
                                    {currentTier.perks.map((perk) => (
                                        <span key={perk} className="perk-chip">
                      <span className="material-symbols-outlined icon-small">check_circle</span>
                                            {perk}
                    </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="current-plan-actions">
                            <button
                                className="btn-primary"
                                onClick={() => document.getElementById('plan-options')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Nâng cấp gói
                            </button>
                            <button className="btn-outline-danger" onClick={() => window.confirm('Bạn có chắc muốn hủy gói đăng ký hiện tại?')}>
                                Hủy đăng ký
                            </button>
                        </div>
                    </section>

                    <section id="plan-options" className="plan-options-section">
                        <h3 className="section-title">Các gói dịch vụ hiện có</h3>
                        <p className="section-subtitle">Chọn gói phù hợp với nhu cầu chăm sóc xe của bạn.</p>

                        <div className="plan-grid">
                            {[1, 2, 3].map((tierId) => {
                                const tier = TIER_DETAILS[tierId];
                                const isCurrent = tierId === user.tierId;
                                return (
                                    <div key={tierId} className={`plan-card ${isCurrent ? 'plan-card--current' : ''}`}>
                                        {isCurrent && <span className="plan-badge">GÓI HIỆN TẠI</span>}
                                        <h4 className="plan-name">{tier.name}</h4>
                                        <p className="plan-price">{currency(tier.price)}<span>/tháng</span></p>

                                        <ul className="plan-perks">
                                            {tier.perks.map((perk) => (
                                                <li key={perk}>
                                                    <span className="material-symbols-outlined icon-small text-secondary">check_circle</span>
                                                    {perk}
                                                </li>
                                            ))}
                                        </ul>

                                        {isCurrent ? (
                                            <button className="btn-plan btn-plan--current" disabled>
                                                Gói hiện tại của bạn
                                            </button>
                                        ) : tierId > user.tierId ? (
                                            <button className="btn-plan btn-plan--upgrade" onClick={() => handleSelectTier(tierId)}>
                                                Nâng cấp lên {getTierName(tierId)}
                                            </button>
                                        ) : (
                                            <button className="btn-plan btn-plan--downgrade" onClick={() => handleSelectTier(tierId)}>
                                                Hạ cấp gói
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {packages.length > 0 && (
                            <div className="extra-services">
                                <h4 className="extra-services-title">Dịch vụ rửa xe lẻ (không cần đăng ký gói)</h4>
                                <div className="extra-services-grid">
                                    {packages.map((svc) => (
                                        <div key={svc.serviceId} className="extra-service-card">
                                            <span className="extra-service-name">{svc.serviceName}</span>
                                            <span className="extra-service-price">{currency(svc.basePrice)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="card card-shadow no-pad billing-history-card">
                        <div className="table-header">
                            <h3 className="card-title">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                Lịch sử thanh toán
                            </h3>
                            <button className="link-primary" onClick={() => navigate('/bookings')}>Xem tất cả</button>
                        </div>
                        <div className="table-wrapper">
                            <table className="history-table">
                                <thead>
                                <tr>
                                    <th>Ngày</th>
                                    <th>Mô tả</th>
                                    <th className="text-right">Số tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                                </thead>
                                <tbody>
                                {billingHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center" style={{ padding: '24px', textAlign: 'center' }}>
                                            Chưa có giao dịch thanh toán nào.
                                        </td>
                                    </tr>
                                ) : (
                                    billingHistory.map((booking) => {
                                        const dateObj = booking.slotDate ? new Date(booking.slotDate) : new Date(booking.bookingDate);
                                        const dateString = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

                                        let badgeClass = 'bg-blue';
                                        let dotClass = 'dot-blue';
                                        let textViet = 'Chờ xử lý';
                                        if (booking.status === 'completed') {
                                            badgeClass = 'bg-green'; dotClass = 'dot-green'; textViet = 'Đã thanh toán';
                                        } else if (booking.status === 'cancelled') {
                                            badgeClass = 'inactive'; dotClass = 'dot-gray'; textViet = 'Đã hủy';
                                        }

                                        return (
                                            <tr key={booking.bookingId}>
                                                <td>{dateString}</td>
                                                <td>{booking.branchName ? `Rửa xe tại ${booking.branchName}` : `Đặt lịch #${booking.bookingCode}`}</td>
                                                <td className="text-right font-bold text-dark">{currency(booking.totalAmount)}</td>
                                                <td>
                            <span className={`status-badge ${badgeClass}`}>
                              <span className={`dot ${dotClass}`}></span> {textViet}
                            </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            {pendingTierId && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined">workspace_premium</span>
                                Xác nhận thay đổi gói
                            </h3>
                            <button type="button" className="btn-close" onClick={() => setPendingTierId(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Bạn sắp chuyển sang <strong>{TIER_DETAILS[pendingTierId].name}</strong> với chi phí{' '}
                                <strong>{currency(TIER_DETAILS[pendingTierId].price)}/tháng</strong>. Thay đổi sẽ áp dụng cho kỳ thanh toán tiếp theo.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setPendingTierId(null)}>Hủy</button>
                            <button type="button" className="btn-primary" onClick={confirmTierChange}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPage;