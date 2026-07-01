import "./ManageCustomersPage.css";

function ManageCustomersPage() {
  const stats = [
    {
      icon: "👥",
      label: "TỔNG SỐ",
      value: "1,284",
      tone: "blue",
    },
    {
      icon: "👤",
      label: "HOẠT ĐỘNG",
      value: "1,120",
      tone: "cyan",
    },
    {
      icon: "🪪",
      label: "NHÂN VIÊN",
      value: "42",
      tone: "gray",
    },
    {
      icon: "🚫",
      label: "ĐÃ KHÓA",
      value: "12",
      tone: "red",
    },
  ];

  const users = [
    {
      id: "#US-9021",
      avatar: "NM",
      name: "Nguyễn Minh",
      sub: "Quản trị viên",
      email: "minh.nguyen@washflow.vn",
      phone: "0987 654 321",
      role: "Admin",
      roleClass: "admin",
      status: "Đang hoạt động",
      statusClass: "active",
      createdAt: "12/10/2023",
    },
    {
      id: "#US-8942",
      avatar: "TL",
      name: "Trần Linh",
      sub: "Nhân viên kỹ thuật",
      email: "linh.tran@washflow.vn",
      phone: "0912 345 678",
      role: "Employee",
      roleClass: "employee",
      status: "Đang hoạt động",
      statusClass: "active",
      createdAt: "05/11/2023",
    },
    {
      id: "#US-7731",
      avatar: "HA",
      name: "Hoàng Anh",
      sub: "Khách hàng Platinum",
      email: "anh.hoang@gmail.com",
      phone: "0333 444 555",
      role: "Customer",
      roleClass: "customer",
      status: "Bị khóa",
      statusClass: "locked",
      createdAt: "20/01/2024",
    },
    {
      id: "#US-6612",
      avatar: "PD",
      name: "Phạm Dương",
      sub: "Khách hàng mới",
      email: "duong.pham@outlook.com",
      phone: "0909 000 999",
      role: "Customer",
      roleClass: "customer",
      status: "Đang hoạt động",
      statusClass: "active",
      createdAt: "15/02/2024",
    },
  ];

  return (
    <div className="user-management-page">
      <div className="um-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>
            Quản lý và phân quyền tài khoản người dùng trong hệ thống WashFlow
            Pro.
          </p>
        </div>

        <button className="um-add-btn" type="button">
          👥 Thêm người dùng
        </button>
      </div>

      <section className="um-stat-grid">
        {stats.map((item) => (
          <div className="um-stat-card" key={item.label}>
            <div className={`um-stat-icon ${item.tone}`}>{item.icon}</div>

            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="um-table-card">
        <div className="um-table-toolbar">
          <div className="um-filter-group">
            <button className="active" type="button">
              Tất cả
            </button>
            <button type="button">Customer</button>
            <button type="button">Employee</button>
            <button type="button">Admin</button>

            <div className="um-divider"></div>

            <button className="status-filter" type="button">
              <i className="green-dot"></i> Đang hoạt động
            </button>

            <button className="status-filter" type="button">
              <i className="red-dot"></i> Bị khóa
            </button>
          </div>

          <button className="um-advanced-btn" type="button">
            ⏷ Bộ lọc nâng cao
          </button>
        </div>

        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ và tên</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="um-user-id">{user.id}</td>

                  <td>
                    <div className="um-user-cell">
                      <div className="um-avatar">{user.avatar}</div>
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.sub}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="um-contact">
                      <span>{user.email}</span>
                      <small>{user.phone}</small>
                    </div>
                  </td>

                  <td>
                    <span className={`um-role ${user.roleClass}`}>
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <span className={`um-status ${user.statusClass}`}>
                      {user.status}
                    </span>
                  </td>

                  <td>{user.createdAt}</td>

                  <td>
                    <div className="um-actions">
                      <button type="button" title="Xem chi tiết">
                        👁
                      </button>
                      <button type="button" title="Chỉnh sửa">
                        ✎
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="um-pagination">
          <p>Hiển thị 1 - 4 trên tổng số 1,284 người dùng</p>

          <div className="um-page-list">
            <button type="button">‹</button>
            <button className="active" type="button">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>...</span>
            <button type="button">321</button>
            <button type="button">›</button>
          </div>
        </div>
      </section>

      <section className="um-bottom-grid">
        <div className="um-info-card">
          <div className="um-info-icon blue">👥</div>

          <div>
            <h3>Phân quyền vai trò</h3>
            <p>Chỉnh sửa quyền truy cập cho Admin, Employee.</p>
          </div>

          <button type="button">›</button>
        </div>

        <div className="um-info-card">
          <div className="um-info-icon cyan">↺</div>

          <div>
            <h3>Nhật ký hoạt động</h3>
            <p>Xem lịch sử đăng nhập và thao tác của người dùng.</p>
          </div>

          <button type="button">›</button>
        </div>
      </section>
    </div>
  );
}

export default ManageCustomersPage;