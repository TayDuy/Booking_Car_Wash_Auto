import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { useNavigate } from 'react-router-dom';
import customerApi from '../../../api/customerApi';
import vehicleApi from '../../../api/vehicleApi';
import bookingApi from '../../../api/bookingApi';
import { changePassword } from '../../../api/authService';
import { getMyTier } from '../../../api/loyaltyApi';
import { getMyPointBalance } from '../../../api/loyaltyTransactionApi';
import useAuth from '../../../hooks/useAuth';
const ProfilePage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null); // vehicle object đang chỉnh sửa
  
  const [user, setUser] = useState({
    customerId: null,
    username: '',
    email: '',
    phone: '',
    fullName: '',
    gender: '',
    dateOfBirth: '',
    totalPoints: 0,
    tierId: 1,
    avatarUrl: '/car_avatar.png'
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: '',
    dateOfBirth: ''
  });

  // Change Password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // State for dynamic components
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Form state for adding a vehicle
  const [vehicleForm, setVehicleForm] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    vehicleType: 'car',
    color: '',
    nickname: ''
  });

  const [vehicleError, setVehicleError] = useState('');
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [pointBalance, setPointBalance] = useState(0);

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    try {
      setLoading(true);
      const res = await customerApi.profile();
      if (res.data) {
        const userData = res.data;
        setUser(prev => ({ ...prev, ...userData }));
        setEditForm({
          fullName: userData.fullName || '',
          phone: userData.phone || '',
          email: userData.email || '',
          gender: userData.gender || '',
          dateOfBirth: userData.dateOfBirth || ''
        });

        // Load vehicles (endpoint automatically checks current logged in user)
        try {
          const vehRes = await vehicleApi.listMyVehicles();
          if (vehRes.data) {
            setVehicles(vehRes.data);
          }
        } catch (vehErr) {
          console.error('Lỗi tải danh sách xe:', vehErr);
        }

        // Load bookings (limit to 5 for profile dashboard)
        try {
          const bookRes = await bookingApi.myBookings(userData.customerId, 5);
          if (bookRes.data) {
            setBookings(bookRes.data);
          }
        } catch (bookErr) {
          console.error('Lỗi tải lịch sử đặt lịch:', bookErr);
        }
      }
      // Load loyalty data
      try {
        const [tierRes, balanceRes] = await Promise.allSettled([
          getMyTier(),
          getMyPointBalance(),
        ]);
        if (tierRes.status === "fulfilled") {
          const raw = tierRes.value?.data || tierRes.value || null;
          setLoyaltyInfo(raw);
        }
        if (balanceRes.status === "fulfilled") {
          const data = balanceRes.value?.data || balanceRes.value || {};
          setPointBalance(Number(data.currentPoints || data.points || 0));
        }
      } catch (loyaltyErr) {
        console.error('Lỗi tải thông tin hạng thành viên:', loyaltyErr);
      }
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    const hasLowercase = /[a-z]/.test(passwordForm.newPassword);
    const hasUppercase = /[A-Z]/.test(passwordForm.newPassword);
    const hasDigit = /\d/.test(passwordForm.newPassword);
    if (!hasLowercase || !hasUppercase || !hasDigit) {
      setPasswordError('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu cũ');
      return;
    }

    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordSuccess('Đổi mật khẩu thành công');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/auth/login');
  };

  const handleSave = async () => {
    try {
      await customerApi.updateProfile(editForm);
      setUser(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      alert('Cập nhật hồ sơ thành công!');
    } catch (err) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      alert('Cập nhật thất bại. Vui lòng thử lại.');
    }
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Add Vehicle Handler
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setVehicleError('');

    const trimmedPlate = (vehicleForm.licensePlate || '').trim().toUpperCase();

    // Validate license plate pattern e.g. 51A-12345 or 30A-1234 (optional dots allowed)
    const platePattern = /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{1,2})?$/;
    if (!platePattern.test(trimmedPlate)) {
      setVehicleError('Biển số xe phải đúng định dạng (VD: 51A-12345, 29AB-12345).');
      return;
    }

    if (!vehicleForm.brand.trim() || !vehicleForm.model.trim()) {
      setVehicleError('Hãng xe và dòng xe không được để trống.');
      return;
    }

    try {
      const response = await vehicleApi.create({
        ...vehicleForm,
        licensePlate: trimmedPlate
      });
      if (response.data) {
        setVehicles(prev => [...prev, response.data]);
        setShowAddVehicleModal(false);
        // Reset form
        setVehicleForm({
          licensePlate: '',
          brand: '',
          model: '',
          vehicleType: 'car',
          color: '',
          nickname: ''
        });
        alert('Thêm xe thành công!');
      }
    } catch (err) {
      console.error('Lỗi thêm xe mới:', err);
      setVehicleError(err.response?.data?.message || 'Có lỗi xảy ra khi thêm xe mới. Vui lòng thử lại.');
    }
  };

  // Toggle Vehicle Active Status Handler
  const handleToggleActive = async (vehicleId, currentIsActive) => {
    const actionText = currentIsActive ? 'ngừng hoạt động' : 'kích hoạt lại';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} phương tiện này?`)) {
      return;
    }

    try {
      const response = await vehicleApi.toggleActive(vehicleId);
      if (response.data) {
        setVehicles(prev => prev.map(v => v.vehicleId === vehicleId ? response.data : v));
        alert(`Đã ${actionText} phương tiện thành công.`);
      }
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái xe:', err);
      alert(err.response?.data?.message || `Không thể ${actionText} phương tiện. Vui lòng thử lại.`);
    }
  };

  // Edit Vehicle Handler
  const handleEditVehicle = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;

    const trimmedPlate = (editingVehicle.licensePlate || '').trim().toUpperCase();
    const platePattern = /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{1,2})?$/;
    if (!platePattern.test(trimmedPlate)) {
      alert('Biển số xe phải đúng định dạng (VD: 51A-12345, 29AB-12345)');
      return;
    }
    if (!editingVehicle.brand?.trim() || !editingVehicle.model?.trim()) {
      alert('Hãng xe và dòng xe không được để trống.');
      return;
    }
    try {
      const res = await vehicleApi.update(editingVehicle.vehicleId, {
        licensePlate: trimmedPlate,
        brand: editingVehicle.brand,
        model: editingVehicle.model,
        vehicleType: editingVehicle.vehicleType,
        color: editingVehicle.color,
        nickname: editingVehicle.nickname,
      });
      if (res.data) {
        setVehicles(prev => prev.map(v => v.vehicleId === editingVehicle.vehicleId ? res.data : v));
        setEditingVehicle(null);
        alert('Cập nhật xe thành công!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật xe thất bại.');
    }
  };

  const getTierName = (id) => {
    if (id === 4) return 'Bạch Kim';
    if (id === 3) return 'Vàng';
    if (id === 2) return 'Bạc';
    return 'Đồng';
  };

  const getPointsNeeded = (tierId, amount) => {
    if (tierId >= 4) return 0;
    if (tierId === 3) return Math.max(0, 15000000 - amount);
    if (tierId === 2) return Math.max(0, 5000000 - amount);
    return Math.max(0, 2000000 - amount);
  };

  const getNextTierName = (tierId) => {
    if (tierId >= 4) return 'Tối đa';
    if (tierId === 3) return 'Bạch Kim';
    if (tierId === 2) return 'Vàng';
    return 'Bạc';
  };

  const getNextTierTarget = (tierId) => {
    if (tierId >= 4) return 15000000;
    if (tierId === 3) return 15000000;
    if (tierId === 2) return 5000000;
    return 2000000;
  };

  function getCurrentTierName() {
    return (
      loyaltyInfo?.currentTierName ||
      loyaltyInfo?.newTierName ||
      loyaltyInfo?.tierName ||
      user.tierName ||
      getTierName(user.tierId)
    );
  }

  const getCurrentPoints = () => {
    return Number(
      pointBalance ||
        loyaltyInfo?.currentPoints ||
        loyaltyInfo?.totalPoints ||
        loyaltyInfo?.points ||
        user.totalPoints ||
        0
    );
  };

  const getCurrentSpending = () => {
    return Number(
      loyaltyInfo?.totalSpending ||
        user.totalSpending ||
        0
    );
  };

  if (loading) return <div className="p-8 text-center" style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>Đang tải...</div>;

  const memberId = `WF-2026-${(user.customerId || 0).toString().padStart(5, '0')}`;

  return (
    <div className="profile-page-wrapper">
      {/* Main Content Area */}
      <main className="main-area" style={{ paddingTop: '24px' }}>
        {/* Content Canvas */}
        <div className="content-canvas">
          <div className="github-profile-grid">
            
            {/* Left Column: Profile Card */}
            <aside className="github-profile-sidebar">
              <div className={`github-avatar-wrapper tier-border-${user.tierId}`}>
                <img src={user.avatarUrl || '/car_avatar.png'} alt="Avatar" className="github-profile-avatar" />
              </div>
              
              <div className="github-user-names">
                <h1 className="github-display-name">{user.fullName || user.username || 'Khách hàng'}</h1>
                <p className="github-username">@{user.username || 'user'}</p>
              </div>

              {/* Edit Profile & Password Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                {!isEditing ? (
                  <>
                    <button className="github-btn-action" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => setIsEditing(true)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      <span>Chỉnh sửa hồ sơ</span>
                    </button>
                    <button className="github-btn-action" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => setShowChangePassword(true)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock</span>
                      <span>Đổi mật khẩu</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="github-btn-action save" onClick={handleSave}>Lưu thay đổi</button>
                    <button className="github-btn-action cancel" onClick={() => setIsEditing(false)}>Hủy</button>
                  </>
                )}
              </div>

              {/* User Bio / Details List */}
              <div className="github-profile-details">
                {isEditing ? (
                  <div className="github-edit-form">
                    <div className="edit-form-group">
                      <label>Họ và tên</label>
                      <input type="text" name="fullName" value={editForm.fullName} onChange={handleInputChange} />
                    </div>
                    <div className="edit-form-group">
                      <label>Số điện thoại</label>
                      <input type="text" name="phone" value={editForm.phone} onChange={handleInputChange} />
                    </div>
                    <div className="edit-form-group">
                      <label>Giới tính</label>
                      <select name="gender" value={editForm.gender} onChange={handleInputChange}>
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="edit-form-group">
                      <label>Ngày sinh</label>
                      <input type="date" name="dateOfBirth" value={editForm.dateOfBirth} onChange={handleInputChange} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="detail-item">
                      <span className="material-symbols-outlined">mail</span>
                      <span>{user.email || 'Chưa cập nhật email'}</span>
                    </div>
                    {user.phone && (
                      <div className="detail-item">
                        <span className="material-symbols-outlined">phone</span>
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.gender && (
                      <div className="detail-item">
                        <span className="material-symbols-outlined">wc</span>
                        <span>{user.gender}</span>
                      </div>
                    )}
                    {user.dateOfBirth && (
                      <div className="detail-item">
                        <span className="material-symbols-outlined">cake</span>
                        <span>{user.dateOfBirth}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="material-symbols-outlined">location_on</span>
                      <span>Hồ Chí Minh, Việt Nam</span>
                    </div>
                    <div className="detail-item font-semibold" style={{ color: 'var(--primary)', marginTop: '8px' }}>
                      <span className="material-symbols-outlined">workspace_premium</span>
                      <span>Hạng {getCurrentTierName()}</span>
                    </div>
                    <div className="detail-item" style={{ color: '#0052cc' }}>
                      <span className="material-symbols-outlined">stars</span>
                      <span>{getCurrentPoints().toLocaleString("vi-VN")} điểm tích lũy</span>
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* Right Column: Stacked Contents */}
            <div className="github-profile-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Section 1: Loyalty Membership */}
              <div className="shadcn-card">
                <div className="shadcn-card-header">
                  <div>
                    <h3 className="shadcn-card-title">
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>stars</span>
                      <span>Thẻ thành viên & Điểm tích luỹ</span>
                    </h3>
                    <p className="shadcn-card-description">
                      Thông tin phân hạng thành viên và các ưu đãi rửa xe đi kèm của bạn.
                    </p>
                  </div>
                </div>

                <div className="shadcn-card-content">
                  <div className="loyalty-columns-layout">
                    {/* Left: Wallet Card */}
                    <div className="loyalty-card-col">
                      <div className={`loyalty-wallet-card tier-card-${user.tierId}`}>
                        <div className="wallet-card-overlay"></div>
                        <div className="wallet-card-header">
                          <div className="wallet-brand">
                            <span className="material-symbols-outlined">waves</span>
                            <span>WASHFLOW PASS</span>
                          </div>
                          <span className="wallet-tier-label">{getCurrentTierName().toUpperCase()}</span>
                        </div>
                        
                        <div className="wallet-card-body">
                          <div className="wallet-user-info">
                            <h4 className="wallet-user-name">{user.fullName || user.username || 'Khách hàng'}</h4>
                            <p className="wallet-member-id">ID: {memberId}</p>
                          </div>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: '0.3', color: '#ffffff' }}>
                            workspace_premium
                          </span>
                        </div>

                        <div className="wallet-card-footer">
                          <div className="wallet-points-status">
                            <span className="points-label">Số dư điểm tích luỹ</span>
                            <strong className="points-value">{getCurrentPoints().toLocaleString("vi-VN")} pts</strong>
                          </div>
                          <div className="wallet-progress-wrap">
                            <div className="progress-track">
                              <div className="progress-fill" style={{ width: `${Math.min((getCurrentSpending() || 0) / getNextTierTarget(user.tierId) * 100, 100)}%` }}></div>
                            </div>
                            {getPointsNeeded(user.tierId, getCurrentSpending()) > 0 ? (
                              <p className="points-hint">Cần thêm {getPointsNeeded(user.tierId, getCurrentSpending()).toLocaleString("vi-VN")}₫ để lên hạng {getNextTierName(user.tierId)}</p>
                            ) : (
                              <p className="points-hint">Đã đạt hạng thành viên cao nhất 🎉</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Perks & Progress Details */}
                    <div className="loyalty-perks-col">
                      <div className="wallet-progress-wrap" style={{ maxWidth: '100%', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600' }}>Tiến trình thăng hạng:</span>
                          <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                            {getCurrentSpending().toLocaleString("vi-VN")}₫ / {getNextTierTarget(user.tierId).toLocaleString("vi-VN")}₫
                          </span>
                        </div>
                        <div className="progress-track" style={{ backgroundColor: 'rgba(0, 74, 173, 0.1)', height: '10px', borderRadius: '999px', overflow: 'hidden' }}>
                          <div className="progress-fill" style={{ 
                            background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)', 
                            height: '100%', 
                            borderRadius: '999px',
                            width: `${Math.min((getCurrentSpending() || 0) / getNextTierTarget(user.tierId) * 100, 100)}%` 
                          }}></div>
                        </div>
                        {getPointsNeeded(user.tierId, getCurrentSpending()) > 0 ? (
                          <p className="points-hint" style={{ color: '#64748b', marginTop: '6px', fontSize: '12px', margin: '6px 0 0' }}>
                            Bạn cần tích lũy thêm <strong>{getPointsNeeded(user.tierId, getCurrentSpending()).toLocaleString("vi-VN")}₫</strong> để nâng cấp lên hạng <strong>{getNextTierName(user.tierId)}</strong>.
                          </p>
                        ) : (
                          <p className="points-hint" style={{ color: 'var(--color-success)', marginTop: '6px', fontSize: '12px', margin: '6px 0 0', fontWeight: '600' }}>
                            Chúc mừng! Bạn đã đạt phân hạng thành viên cao nhất của hệ thống 🎉
                          </p>
                        )}
                      </div>

                      <div className="perks-list-inset" style={{ padding: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
                        <div className="perk-item" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span className="material-symbols-outlined perk-icon" style={{ color: 'var(--primary)', fontSize: '18px', marginTop: '1px' }}>check_circle</span>
                          <div className="perk-desc">
                            <strong style={{ display: 'block', fontSize: '13.5px', color: '#0f172a', fontWeight: '600' }}>Tích lũy tự động</strong>
                            <p style={{ margin: '1px 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>Tích lũy 10 điểm thưởng với mỗi 10.000đ chi tiêu dịch vụ rửa xe.</p>
                          </div>
                        </div>
                        <div className="perk-item" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span className="material-symbols-outlined perk-icon" style={{ color: 'var(--primary)', fontSize: '18px', marginTop: '1px' }}>check_circle</span>
                          <div className="perk-desc">
                            <strong style={{ display: 'block', fontSize: '13.5px', color: '#0f172a', fontWeight: '600' }}>Đổi Voucher giảm giá</strong>
                            <p style={{ margin: '1px 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>Quy đổi điểm thưởng trực tiếp thành các mã giảm giá dịch vụ từ 20k, 50k, 100k.</p>
                          </div>
                        </div>
                        <div className="perk-item" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span className="material-symbols-outlined perk-icon" style={{ color: 'var(--primary)', fontSize: '18px', marginTop: '1px' }}>check_circle</span>
                          <div className="perk-desc">
                            <strong style={{ display: 'block', fontSize: '13.5px', color: '#0f172a', fontWeight: '600' }}>Ưu tiên đặt lịch</strong>
                            <p style={{ margin: '1px 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>Hạng Vàng trở lên được ưu tiên hỗ trợ giữ thời gian đặt lịch trong giờ cao điểm.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shadcn-card-footer" style={{ gap: '12px' }}>
                  <button className="github-btn-action save" style={{ width: 'auto' }} onClick={() => navigate('/customer/promotions')}>
                    Đổi phần thưởng ngay
                  </button>
                </div>
              </div>

              {/* Section 2: My Garage (Nhà xe của tôi) */}
              <div className="shadcn-card" id="vehicles">
                <div className="shadcn-card-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="shadcn-card-title">
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>directions_car</span>
                      <span>Danh sách xe của tôi</span>
                    </h3>
                    <p className="shadcn-card-description">
                      Quản lý danh sách các phương tiện cá nhân đăng ký sử dụng dịch vụ tại trạm.
                    </p>
                  </div>
                  <button className="github-btn-action save" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAddVehicleModal(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                    <span>Đăng ký xe mới</span>
                  </button>
                </div>
                
                <div className="shadcn-card-content">
                  <div className="vehicles-grid" style={{ gridTemplateColumns: vehicles.length === 0 ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                    {vehicles.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748b', fontSize: '14px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                        Bạn chưa đăng ký phương tiện nào. Hãy nhấn nút thêm xe để bắt đầu!
                      </div>
                    ) : (
                      vehicles.map(vehicle => (
                        <div key={vehicle.vehicleId} className="vehicle-card card-shadow group" style={{ margin: '0', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                          <div className="vehicle-info" style={{ padding: '16px' }}>
                            <div className="vehicle-icon-box bg-cyan">
                              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '32px' }}>
                                {vehicle.vehicleType === 'suv' ? 'airport_shuttle' : 'directions_car'}
                              </span>
                            </div>
                            <div>
                              <h4 className="vehicle-name" style={{ fontSize: '15px', fontWeight: '600' }}>{vehicle.nickname || `${vehicle.brand} ${vehicle.model}`}</h4>
                              <div className="vietnam-license-plate">
                                <span className="plate-rivet"></span>
                                <span className="plate-text">{vehicle.licensePlate.toUpperCase()}</span>
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                                ({vehicle.vehicleType === 'suv' ? 'Xe 7 chỗ' : 'Xe 4 chỗ'})
                              </span>
                              {vehicle.nickname && (
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {vehicle.brand} {vehicle.model}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="vehicle-footer" style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="vehicle-date" style={{ fontSize: '12px', color: '#64748b' }}>{vehicle.color ? `Màu: ${vehicle.color}` : 'Chưa nhập màu'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button className="btn-edit" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setEditingVehicle({ ...vehicle })}>
                                <span className="material-symbols-outlined icon-small">edit</span>
                                <span>Sửa</span>
                              </button>
                              <button 
                                className={`vehicle-status-toggle ${vehicle.isActive ? 'active' : 'inactive'}`} 
                                onClick={() => handleToggleActive(vehicle.vehicleId, vehicle.isActive)}
                              >
                                <span className="material-symbols-outlined icon-small">
                                  {vehicle.isActive ? 'check_circle' : 'do_not_disturb_on'}
                                </span>
                                <span>{vehicle.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
                              </button>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Booking History */}
              <div className="shadcn-card" id="history">
                <div className="shadcn-card-header">
                  <div>
                    <h3 className="shadcn-card-title">
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history</span>
                      <span>Lịch sử đặt lịch rửa xe</span>
                    </h3>
                    <p className="shadcn-card-description">
                      Danh sách lịch hẹn rửa xe gần đây và trạng thái xử lý chi tiết.
                    </p>
                  </div>
                </div>
                
                <div className="shadcn-card-content" style={{ padding: '0 0 12px 0' }}>
                  <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none', borderRadius: '0' }}>
                    <table className="history-table" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Chi nhánh & Phương tiện</th>
                          <th>Trạng thái</th>
                          <th className="text-right" style={{ paddingRight: '24px' }}>Tổng thanh toán</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center text-dark" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                              Chưa có dữ liệu đặt lịch rửa xe nào.
                            </td>
                          </tr>
                        ) : (
                          bookings.map(booking => {
                            const dateObj = booking.slotDate ? new Date(booking.slotDate) : new Date(booking.bookingDate);
                            const dateString = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            
                            let badgeClass = 'status-pending';
                            let dotClass = 'dot-orange';
                            let textViet = 'Chờ xử lý';

                            switch (booking.status?.toLowerCase()) {
                              case 'completed':
                              case 'done':
                                badgeClass = 'status-success';
                                dotClass = 'dot-green';
                                textViet = 'Hoàn thành';
                                break;
                              case 'cancelled':
                              case 'canceled':
                                badgeClass = 'status-cancelled';
                                dotClass = 'dot-red';
                                textViet = 'Đã hủy';
                                break;
                              case 'in_progress':
                                badgeClass = 'status-progress';
                                dotClass = 'dot-blue';
                                textViet = 'Đang làm';
                                break;
                              case 'noshow':
                                badgeClass = 'status-noshow';
                                dotClass = 'dot-gray';
                                textViet = 'Vắng mặt';
                                break;
                              default:
                                break;
                            }

                            const amountString = (booking.finalAmount || booking.totalAmount || booking.price || 0).toLocaleString('vi-VN') + 'đ';

                            return (
                              <tr key={booking.bookingId}>
                                <td className="font-medium text-dark" style={{ paddingLeft: '24px' }}>
                                  {dateString} {booking.slotStartTime ? ` - ${booking.slotStartTime.substring(0, 5)}` : ''}
                                </td>
                                <td>
                                  <div className="service-cell">
                                    <span className="service-name" style={{ fontWeight: '500' }}>{booking.branchName || 'AutoWash-Pro Branch'}</span>
                                    <span className="service-car">{booking.vehicleNickname || booking.licensePlate || 'Mã: ' + booking.bookingCode}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`status-badge ${badgeClass}`}>
                                    <span className={`dot ${dotClass}`}></span> {textViet}
                                  </span>
                                </td>
                                <td className="text-right font-bold text-dark" style={{ paddingRight: '24px' }}>{amountString}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
      {/* Add Vehicle Modal Overlay */}
      {showAddVehicleModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddVehicle}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="material-symbols-outlined">directions_car</span>
                Đăng ký xe mới
              </h3>
              <button type="button" className="btn-close" onClick={() => setShowAddVehicleModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              {vehicleError && (
                <div style={{ color: '#ba1a1a', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  {vehicleError}
                </div>
              )}
              <div className="form-group">
                <label>Biển số xe (VD: 51A-12345)*</label>
                <input 
                  type="text" 
                  placeholder="VD: 51A-12345"
                  className="form-input"
                  value={vehicleForm.licensePlate} 
                  onChange={e => setVehicleForm({...vehicleForm, licensePlate: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Hãng xe (VD: Toyota)*</label>
                <input 
                  type="text" 
                  placeholder="VD: Toyota"
                  className="form-input"
                  value={vehicleForm.brand} 
                  onChange={e => setVehicleForm({...vehicleForm, brand: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Dòng xe (VD: Camry)*</label>
                <input 
                  type="text" 
                  placeholder="VD: Camry"
                  className="form-input"
                  value={vehicleForm.model} 
                  onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Loại xe*</label>
                <select 
                  className="form-select"
                  value={vehicleForm.vehicleType} 
                  onChange={e => setVehicleForm({...vehicleForm, vehicleType: e.target.value})}
                >
                  <option value="car">Xe 4 chỗ</option>
                  <option value="suv">Xe 7 chỗ</option>
                </select>
              </div>
              <div className="form-group">
                <label>Màu sắc (Tùy chọn)</label>
                <input 
                  type="text" 
                  placeholder="VD: Đen"
                  className="form-input"
                  value={vehicleForm.color} 
                  onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Tên gọi / Nickname (Tùy chọn)</label>
                <input 
                  type="text" 
                  placeholder="VD: Xe đi làm"
                  className="form-input"
                  value={vehicleForm.nickname} 
                  onChange={e => setVehicleForm({...vehicleForm, nickname: e.target.value})} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAddVehicleModal(false)}>Hủy</button>
              <button type="submit" className="btn-primary">Đăng ký xe</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleEditVehicle}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="material-symbols-outlined">edit</span>
                Chỉnh sửa xe
              </h3>
              <button type="button" className="btn-close" onClick={() => setEditingVehicle(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Biển số xe*</label>
                <input 
                  type="text" className="form-input"
                  value={editingVehicle.licensePlate} 
                  onChange={e => setEditingVehicle({...editingVehicle, licensePlate: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Hãng xe*</label>
                <input 
                  type="text" className="form-input"
                  value={editingVehicle.brand} 
                  onChange={e => setEditingVehicle({...editingVehicle, brand: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Dòng xe*</label>
                <input 
                  type="text" className="form-input"
                  value={editingVehicle.model} 
                  onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Loại xe*</label>
                <select 
                  className="form-select"
                  value={editingVehicle.vehicleType} 
                  onChange={e => setEditingVehicle({...editingVehicle, vehicleType: e.target.value})}
                >
                  <option value="car">Xe 4 chỗ</option>
                  <option value="suv">Xe 7 chỗ</option>
                </select>
              </div>
              <div className="form-group">
                <label>Màu sắc</label>
                <input 
                  type="text" className="form-input"
                  value={editingVehicle.color || ''} 
                  onChange={e => setEditingVehicle({...editingVehicle, color: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Tên gọi / Nickname</label>
                <input 
                  type="text" className="form-input"
                  value={editingVehicle.nickname || ''} 
                  onChange={e => setEditingVehicle({...editingVehicle, nickname: e.target.value})} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditingVehicle(null)}>Hủy</button>
              <button type="submit" className="btn-primary">Lưu thay đổi</button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleChangePassword}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="material-symbols-outlined">lock</span>
                Đổi mật khẩu
              </h3>
              <button type="button" className="btn-close" onClick={() => { setShowChangePassword(false); setPasswordError(''); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              {passwordError && <div style={{ color: '#ba1a1a', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>{passwordError}</div>}
              <div className="form-group">
                <label>Mật khẩu cũ</label>
                <input type="password" className="form-input" value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input type="password" className="form-input" value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" className="form-input" value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => { setShowChangePassword(false); setPasswordError(''); }}>Hủy</button>
              <button type="submit" className="btn-primary">Lưu mật khẩu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;