import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { useNavigate } from 'react-router-dom';
import customerApi from '../../../api/customerApi';
import vehicleApi from '../../../api/vehicleApi';
import bookingApi from '../../../api/bookingApi';
import { logout } from '../../../api/authService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  
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

        // Load bookings using customerId returned from backend
        if (userData.customerId) {
          try {
            const bookRes = await bookingApi.myBookings(userData.customerId);
            if (bookRes.data) {
              setBookings(bookRes.data);
            }
          } catch (bookErr) {
            console.error('Lỗi tải lịch sử đặt lịch:', bookErr);
          }
        }
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

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleSave = async () => {
    if (editForm.phone && !/^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(editForm.phone.trim())) {
      alert('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng SĐT Việt Nam (VD: 0912345678).');
      return;
    }
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
    const platePattern = /^[0-9]{2}[A-Z]-[0-9]{3,5}(\.[0-9]{1,2})?$/;
    if (!platePattern.test(trimmedPlate)) {
      setVehicleError('Biển số xe phải đúng định dạng (VD: 51A-12345 hoặc 30A-1234).');
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

  const getTierName = (id) => {
    if (id === 3) return 'Vàng';
    if (id === 2) return 'Bạc';
    return 'Đồng';
  };

  const getPointsNeeded = (points) => {
    if (points >= 3000) return 0;
    return 3000 - points;
  };

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
              <section id="personal-info" className="card card-shadow">
                <div className="card-header">
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
                
                <div className="info-grid">
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
                        <input
                            type="text"
                            name="phone"
                            inputMode="numeric"
                            maxLength={10}
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                            className="info-edit-input"
                        />}
                  </div>
                  <div className="info-item">
                    <label>Địa điểm</label>
                    <p>Hồ Chí Minh, Việt Nam</p>
                  </div>
                </div>
              </section>

              {/* My Vehicles Section */}
              <section id="vehicles" className="section-vehicles">
                <div className="card-header">
                  <h3 className="card-title">
                    <span className="material-symbols-outlined text-primary">directions_car</span>
                    Xe của tôi
                  </h3>
                  <button className="btn-add" onClick={() => setShowAddVehicleModal(true)}>
                    <span className="material-symbols-outlined icon-small">add_circle</span>
                    Thêm xe mới
                  </button>
                </div>
                
                <div className="vehicles-grid">
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
                            <h4 className="vehicle-name">{vehicle.brand} {vehicle.model}</h4>
                            <span className="vehicle-plate">{vehicle.licensePlate}</span>
                            <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginLeft: '8px', fontWeight: 'bold' }}>
                              ({vehicle.vehicleType === 'suv' ? 'Xe 7 chỗ' : 'Xe 4 chỗ'})
                            </span>
                          </div>
                        </div>
                        <div className="vehicle-footer">
                          <span className="vehicle-date">{vehicle.color ? `Màu: ${vehicle.color}` : 'Chưa nhập màu'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                              className={`vehicle-status-toggle ${vehicle.isActive ? 'active' : 'inactive'}`} 
                              onClick={() => handleToggleActive(vehicle.vehicleId, vehicle.isActive)}
                            >
                              <span className="material-symbols-outlined icon-small">
                                {vehicle.isActive ? 'check_circle' : 'do_not_disturb_on'}
                              </span>
                              {vehicle.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
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
                    Lịch sử đặt lịch
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
                                  <span className="service-car">{booking.licensePlate || 'Mã: ' + booking.bookingCode}</span>
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
                    <h3 className="loyalty-tier">{getTierName(user.tierId)}</h3>
                  </div>
                  <span className="material-symbols-outlined icon-star" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                </div>
                <div className="loyalty-body">
                  <div className="loyalty-points-row">
                    <span className="points-label">Số dư hiện tại</span>
                    <span className="points-value">{user.totalPoints || 0} điểm</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min((user.totalPoints || 0) / 3000 * 100, 100)}%` }}></div>
                  </div>
                  <p className="points-hint">Chỉ còn {getPointsNeeded(user.totalPoints || 0)} điểm nữa để đạt hạng Bạch Kim!</p>
                </div>
                <button className="btn-loyalty">Đổi phần thưởng</button>
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
                  {subInfo.features.map((feature, i) => (
                    <div key={i} className="sub-feature">
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
    </div>
  );
};

export default ProfilePage;