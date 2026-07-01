import "./AdminDashboardPage.css";

function AdminDashboardPage() {
  const stats = [
    {
      icon: "📅",
      label: "Tổng booking hôm nay",
      value: "42",
      badge: "+12%",
      tone: "blue",
    },
    {
      icon: "💵",
      label: "Doanh thu hôm nay",
      value: "12.5M",
      sub: "VNĐ",
      badge: "+8.4%",
      tone: "cyan",
    },
    {
      icon: "👤",
      label: "Tổng khách hàng",
      value: "1,284",
      badge: "New",
      tone: "gray",
    },
    {
      icon: "👥",
      label: "Tổng nhân viên",
      value: "15",
      tone: "orange",
    },
    {
      icon: "🏢",
      label: "Chi nhánh hoạt động",
      value: "4/5",
      tone: "purple",
    },
    {
      icon: "✅",
      label: "Tỷ lệ hoàn thành",
      value: "94%",
      tone: "green",
    },
  ];

  const bookings = [
    {
      code: "WF-1024",
      avatar: "NA",
      customer: "Nguyễn Văn A",
      service: "Gói Cao Cấp",
      branch: "Quận 7",
      time: "10:00",
      status: "completed",
      statusText: "Hoàn thành",
      total: "350.000 VNĐ",
    },
    {
      code: "WF-1023",
      avatar: "TH",
      customer: "Trần Thị H",
      service: "Rửa Tiêu Chuẩn",
      branch: "Quận 1",
      time: "11:30",
      status: "processing",
      statusText: "Đang rửa",
      total: "150.000 VNĐ",
    },
    {
      code: "WF-1022",
      avatar: "LV",
      customer: "Lê Văn V",
      service: "Gói VIP",
      branch: "Thủ Đức",
      time: "14:00",
      status: "pending",
      statusText: "Chờ nhận xe",
      total: "850.000 VNĐ",
    },
    {
      code: "WF-1021",
      avatar: "PQ",
      customer: "Phạm Quốc Q",
      service: "Vệ sinh Nội thất",
      branch: "Quận 7",
      time: "09:15",
      status: "cancelled",
      statusText: "Đã hủy",
      total: "0 VNĐ",
    },
  ];

  const quickActions = [
    { icon: "🏢", title: "Thêm chi nhánh" },
    { icon: "🎟", title: "Tạo khuyến mãi" },
    { icon: "🧾", title: "Thêm dịch vụ" },
    { icon: "📋", title: "Xem báo cáo" },
  ];

  return (
    <div className="st-dashboard">
      <div className="st-dashboard-header">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>
            Chào mừng trở lại, đây là hiệu suất hoạt động của chuỗi WashFlow hôm nay.
          </p>
        </div>

        <div className="st-header-actions">
          <button className="st-soft-btn" type="button">
            ⬇ Xuất báo cáo
          </button>
          <button className="st-primary-btn" type="button">
            + Booking mới
          </button>
        </div>
      </div>

      <section className="st-stat-grid">
        {stats.map((item) => (
          <div className="st-stat-card" key={item.label}>
            <div className={`st-stat-icon ${item.tone}`}>{item.icon}</div>
            {item.badge && <span className="st-stat-badge">{item.badge}</span>}
            <p>{item.label}</p>
            <h3>
              {item.value}
              {item.sub && <small>{item.sub}</small>}
            </h3>
          </div>
        ))}
      </section>

      <section className="st-main-grid">
        <div className="st-card st-revenue-card">
          <div className="st-card-head">
            <div>
              <h2>Doanh thu 7 ngày gần nhất</h2>
              <p>Thống kê doanh thu thực tế so với mục tiêu</p>
            </div>

            <div className="st-tabs">
              <button className="active" type="button">
                Theo ngày
              </button>
              <button type="button">Theo tuần</button>
            </div>
          </div>

          <div className="st-chart">
            <div className="st-chart-line"></div>
            <div className="st-chart-line"></div>
            <div className="st-chart-line"></div>

            <div className="st-chart-labels">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>
          </div>
        </div>

        <div className="st-card st-booking-status-card">
          <h2>Trạng thái Booking</h2>

          <div className="st-donut">
            <div className="st-donut-inner">
              <strong>42</strong>
              <span>HÔM NAY</span>
            </div>
          </div>

          <div className="st-legend">
            <span><i className="done"></i> Hoàn thành (65%)</span>
            <span><i className="processing"></i> Đang xử lý (20%)</span>
            <span><i className="waiting"></i> Chờ xác nhận</span>
            <span><i className="cancel"></i> Đã hủy (5%)</span>
          </div>
        </div>
      </section>

      <section className="st-bottom-grid">
        <div className="st-card st-table-card">
          <div className="st-table-head">
            <div>
              <h2>Booking gần đây</h2>
              <p>Cập nhật lúc 14:20 PM</p>
            </div>

            <button type="button">Xem tất cả</button>
          </div>

          <table className="st-booking-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Chi nhánh</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.code}>
                  <td className="code">{booking.code}</td>
                  <td>
                    <div className="st-customer">
                      <span>{booking.avatar}</span>
                      <strong>{booking.customer}</strong>
                    </div>
                  </td>
                  <td>{booking.service}</td>
                  <td>{booking.branch}</td>
                  <td>{booking.time}</td>
                  <td>
                    <span className={`st-status ${booking.status}`}>
                      {booking.statusText}
                    </span>
                  </td>
                  <td className="money">{booking.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="st-side-column">
          <div className="st-card st-quick-card">
            <h2>Thao tác nhanh</h2>

            <div className="st-quick-list">
              {quickActions.map((item) => (
                <button type="button" key={item.title}>
                  <span>{item.icon}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="st-blue-card">
            <h2>Tối ưu hóa doanh thu</h2>
            <p>
              Bạn có 3 khung giờ trống tại chi nhánh Quận 7. Tạo khuyến mãi chớp
              nhoáng để lấp đầy lịch?
            </p>
            <button type="button">Tạo ngay</button>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default AdminDashboardPage;