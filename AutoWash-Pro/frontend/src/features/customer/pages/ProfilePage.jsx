import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { useNavigate } from 'react-router-dom';
import customerApi from '../../../api/customerApi';
import vehicleApi from '../../../api/vehicleApi';
import bookingApi from '../../../api/bookingApi';
import { logout, changePassword } from '../../../api/authService';
import { getMyTier } from '../../../api/loyaltyApi';
import { getMyPointBalance } from '../../../api/loyaltyTransactionApi';

const ProfilePage = () => {
  const navigate = useNavigate();
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
    logout();
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

  const getPointsNeeded = (points) => {
    if (points >= 5000) return 0;
    if (points >= 1500) return 5000 - points;
    if (points >= 500) return 1500 - points;
    return 500 - points;
  };

  const getNextTierName = (points) => {
    if (points >= 5000) return 'Tối đa';
    if (points >= 1500) return 'Bạch Kim';
    if (points >= 500) return 'Vàng';
    return 'Bạc';
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

  function getCurrentPoints() {
    return Number(
      pointBalance ||
        loyaltyInfo?.currentPoints ||
        loyaltyInfo?.totalPoints ||
        loyaltyInfo?.points ||
        user.totalPoints ||
        0
    );
  }

  // Dynamic Subscription details based on user tierId
  const getSubscriptionDetails = (tierId) => {
    if (tierId === 3) {
      return {
        title: 'Gói Vàng VVIP',
        price: '399.000 ₫ / tháng',
        features: [
          'Rửa xe cao cấp không giới hạn',
          'Miễn phí 2 lần phủ Nano & Wax / tháng',
          'Lối đi VIP ưu tiên không cần chờ đợi'
        ]
      };
    } else if (tierId === 2) {
      return {
        title: 'Gói Bạc Premium',
        price: '199.000 ₫ / tháng',
        features: [
          'Rửa xe cơ bản không giới hạn',
          'Miễn phí 1 lần phủ Wax / tháng',
          'Hỗ trợ đặt lịch nhanh qua hotline'
        ]
      };
    } else {
      return {
        title: 'Gói Đồng Tiết Kiệm',
        price: '99.000 ₫ / tháng',
        features: [
          'Rửa xe cơ bản giảm 20% mọi hóa đơn',
          'Nhân hệ số tích lũy điểm thưởng x1.2',
          'Hỗ trợ đặt lịch rửa xe linh hoạt'
        ]
      };
    }
  };

  const subInfo = getSubscriptionDetails(user.tierId);

  if (loading) return <div className="p-8 text-center" style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>Đang tải...</div>;

  return (
    <div className="profile-page-wrapper">
      {/* Main Content Area */}
      <main className="main-area">
        {/* Top App Bar */}
        <header className="topbar glass-header">
          <div className="topbar-titles">
            <h2 className="page-title">Hồ sơ</h2>
            <p className="page-subtitle">Welcome, {user.fullName || user.username}</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="icon-btn">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="content-canvas">
          <div className="main-grid">
            
            {/* Left Column: Personal Info & Vehicles */}
            <div className="col-left">
              
              {/* Personal Info Card */}
              <section id="personal-info" className="card card-shadow no-pad">
                <div className="table-header">
                  <h3 className="card-title">
                    <span className="material-symbols-outlined text-primary">person</span>
                    Thông tin cá nhân
                  </h3>
                  {!isEditing ? (
                    <button className="btn-edit" onClick={() => setIsEditing(true)}>
                      <span className="material-symbols-outlined icon-small">edit</span>
                      Chỉnh sửa
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-edit" style={{ color: '#ba1a1a' }} onClick={() => setIsEditing(false)}>Hủy</button>
                      <button className="btn-add" onClick={handleSave}>Lưu</button>
                    </div>
                  )}
                </div>
                
                <div className="info-grid info-grid-inset">
                  <div className="info-item">
                    <label>Họ và tên</label>
                    {!isEditing ? <p>{user.fullName || 'Chưa cập nhật'}</p> : 
                      <input type="text" name="fullName" value={editForm.fullName} onChange={handleInputChange} className="info-edit-input" />}
                  </div>
                  <div className="info-item">
                    <label>Địa chỉ Email</label>
                    {!isEditing ? <p>{user.email || 'Chưa cập nhật'}</p> : 
                      <input type="email" name="email" value={editForm.email} onChange={handleInputChange} className="info-edit-input" />}
                  </div>
                  <div className="info-item">
                    <label>Số điện thoại</label>
                    {!isEditing ? <p>{user.phone || 'Chưa cập nhật'}</p> : 
                      <input type="text" name="phone" value={editForm.phone} onChange={handleInputChange} className="info-edit-input" />}
                  </div>
                  <div className="info-item">
                    <label>Giới tính</label>
                    {!isEditing ? <p>{user.gender || 'Chưa cập nhật'}</p> : 
                      <select name="gender" value={editForm.gender} onChange={handleInputChange} className="info-edit-select">
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    }
                  </div>
                  <div className="info-item">
                    <label>Ngày sinh</label>
                    {!isEditing ? <p>{user.dateOfBirth || 'Chưa cập nhật'}</p> : 
                      <input type="date" name="dateOfBirth" value={editForm.dateOfBirth} onChange={handleInputChange} className="info-edit-input" />}
                  </div>
                  <div className="info-item">
                    <label>Địa điểm</label>
                    <p>Hồ Chí Minh, Việt Nam</p>
                  </div>
                </div>
              </section>

              {/* Change Password Section */}
              <section className="card card-shadow no-pad">
                <div className="table-header">
                  <h3 className="card-title">
                    <span className="material-symbols-outlined text-primary">lock</span>
                    <span>Mật khẩu</span>
                  </h3>
                  <button className="btn-edit" onClick={() => setShowChangePassword(true)}>
                    <span className="material-symbols-outlined icon-small">edit</span>
                    <span>Đổi mật khẩu</span>
                  </button>
                </div>
                <div className="password-preview-wrap">
                  <div className="password-preview">
                    <span className="password-dots">••••••••</span>
                    <span className="password-hint">Nên thay đổi mật khẩu định kỳ để đảm bảo an toàn cho tài khoản của bạn.</span>
                  </div>
                  {passwordSuccess && <div className="password-success">{passwordSuccess}</div>}
                </div>
              </section>

              {/* My Vehicles Section */}
              <section id="vehicles" className="card card-shadow no-pad">
                <div className="table-header">
                  <h3 className="card-title">
                    <span className="material-symbols-outlined text-primary">directions_car</span>
                    <span>Xe của tôi</span>
                  </h3>
                  <button className="btn-add" onClick={() => setShowAddVehicleModal(true)}>
                    <span className="material-symbols-outlined icon-small">add_circle</span>
                    <span>Thêm xe mới</span>
                  </button>
                </div>
                
                <div className="vehicles-grid vehicles-grid-inset">
                  {vehicles.length === 0 ? (
                    <div className="card card-shadow" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px', color: 'var(--on-surface-variant)' }}>
                      Bạn chưa thêm phương tiện nào. Hãy nhấn nút thêm xe để bắt đầu!
                    </div>
                  ) : (
                    vehicles.map(vehicle => (
                      <div key={vehicle.vehicleId} className="vehicle-card card-shadow group">
                        <div className="vehicle-info">
                          <div className="vehicle-icon-box bg-cyan">
                            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '32px' }}>
                              {vehicle.vehicleType === 'suv' ? 'airport_shuttle' : 'directions_car'}
                            </span>
                          </div>
                          <div>
                            <h4 className="vehicle-name">{vehicle.nickname || `${vehicle.brand} ${vehicle.model}`}</h4>
                            <span className="vehicle-plate">{vehicle.licensePlate}</span>
                            <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginLeft: '8px' }}>
                              ({vehicle.vehicleType === 'suv' ? 'Xe 7 chỗ' : 'Xe 4 chỗ'})
                            </span>
                            {vehicle.nickname && (
                              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                                {vehicle.brand} {vehicle.model}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="vehicle-footer">
                          <span className="vehicle-date">{vehicle.color ? `Màu: ${vehicle.color}` : 'Chưa nhập màu'}</span>
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
              </section>

              {/* Booking History Table */}
              <section id="history" className="card card-shadow no-pad">
                <div className="table-header">
                  <h3 className="card-title">
                    <span className="material-symbols-outlined text-primary">history</span>
                    <span>Lịch sử đặt lịch</span>
                  </h3>
                  <button className="link-primary" onClick={() => navigate('/customer/history')}>Xem tất cả</button>
                </div>
                <div className="table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Chi nhánh & Phương tiện</th>
                        <th>Trạng thái</th>
                        <th className="text-right">Tổng thanh toán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center text-dark" style={{ padding: '24px', textAlign: 'center' }}>
                            Chưa có dữ liệu đặt lịch rửa xe.
                          </td>
                        </tr>
                      ) : (
                        bookings.map(booking => {
                          const dateObj = booking.slotDate ? new Date(booking.slotDate) : new Date(booking.bookingDate);
                          const dateString = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          const amountString = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount || 0);

                          let badgeClass = 'bg-blue';
                          let dotClass = 'dot-blue';
                          let textViet = 'Chờ xử lý';

                          switch(booking.status) {
                            case 'completed':
                              badgeClass = 'bg-green';
                              dotClass = 'dot-green';
                              textViet = 'Đã hoàn thành';
                              break;
                            case 'cancelled':
                              badgeClass = 'inactive';
                              dotClass = 'dot-gray';
                              textViet = 'Đã hủy';
                              break;
                            case 'confirmed':
                              badgeClass = 'bg-blue pulse-active';
                              dotClass = 'dot-blue';
                              textViet = 'Đã xác nhận';
                              break;
                            case 'in_progress':
                              badgeClass = 'bg-blue pulse-active';
                              dotClass = 'dot-blue';
                              textViet = 'Đang làm';
                              break;
                            case 'no_show':
                              badgeClass = 'inactive';
                              dotClass = 'dot-gray';
                              textViet = 'Vắng mặt';
                              break;
                            default:
                              break;
                          }

                          return (
                            <tr key={booking.bookingId}>
                              <td className="font-medium text-dark">
                                {dateString} {booking.slotStartTime ? ` - ${booking.slotStartTime.substring(0, 5)}` : ''}
                              </td>
                              <td>
                                <div className="service-cell">
                                  <span className="service-name">{booking.branchName || 'AutoWash-Pro Branch'}</span>
                                  <span className="service-car">{booking.vehicleNickname || booking.licensePlate || 'Mã: ' + booking.bookingCode}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge ${badgeClass}`}>
                                  <span className={`dot ${dotClass}`}></span> {textViet}
                                </span>
                              </td>
                              <td className="text-right font-bold text-dark">{amountString}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

            </div>

            {/* Right Column: Loyalty & Stats */}
            <div className="col-right">
              
              {/* Loyalty Summary Card */}
              <section className="loyalty-card card-shadow">
                <div className="loyalty-bg-glow"></div>
                <div className="loyalty-header">
                  <div>
                    <p className="loyalty-label">Hạng thành viên</p>
                    <h3 className="loyalty-tier">{getCurrentTierName()}</h3>
                  </div>
                  <span className="material-symbols-outlined icon-star">stars</span>
                </div>
                <div className="loyalty-body">
                  <div className="loyalty-points-row">
                    <span className="points-label">Số dư hiện tại</span>
                    <span className="points-value">{getCurrentPoints().toLocaleString("vi-VN")} điểm</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min((getCurrentPoints() || 0) / 5000 * 100, 100)}%` }}></div>
                  </div>
                  {getPointsNeeded(getCurrentPoints()) > 0 ? (
                    <p className="points-hint">Chỉ còn {getPointsNeeded(getCurrentPoints())} điểm nữa để đạt hạng {getNextTierName(getCurrentPoints())}!</p>
                  ) : (
                    <p className="points-hint">Chúc mừng! Bạn đã đạt hạng thành viên cao nhất.</p>
                  )}
                </div>
                <button className="btn-loyalty" onClick={() => navigate('/customer/promotions')}>Đổi phần thưởng</button>
              </section>

              {/* Subscription Details */}
              <section id="subscription" className="card card-shadow">
                <h3 className="card-title text-dark mb-md">Gói đăng ký hiện tại</h3>
                <div className="sub-header">
                  <div className="sub-icon">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                  <div>
                    <h4 className="sub-title">{subInfo.title}</h4>
                    <p className="sub-price">{subInfo.price}</p>
                  </div>
                </div>
                <div className="sub-features">
                  {subInfo.features.map((feature) => (
                    <div key={feature} className="sub-feature">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      {feature}
                    </div>
                  ))}
                </div>
                <button className="btn-manage-sub">Quản lý gói đăng ký</button>
              </section>

              {/* Promo Card */}
              <div className="promo-card group">
                <div className="promo-content">
                  <h4 className="promo-title">GIỚI THIỆU BẠN BÈ</h4>
                  <p className="promo-desc">Nhận ngay 500 điểm cho mỗi người bạn tham gia WashFlow Pro!</p>
                  <button className="btn-promo-link">
                    Chia sẻ liên kết
                    <span className="material-symbols-outlined icon-small group-hover-gap">arrow_forward</span>
                  </button>
                </div>
                <span className="material-symbols-outlined promo-icon-bg">loyalty</span>
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