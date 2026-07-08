import React, { useEffect, useMemo, useState } from "react";
import { Search, Eye, Pencil, Trash2 } from "lucide-react";
import customerApi from "../../../api/customerApi";
import "./ManageCustomersPage.css";

function ManageCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const response = await customerApi.list();
      console.log("CUSTOMER API:", response.data);
      const result = response.data?.data || response.data || [];
      if (Array.isArray(result)) {
        setCustomers(result);
      } else if (Array.isArray(result.content)) {
        setCustomers(result.content);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const text = [
        customer.fullName,
        customer.email,
        customer.phone,
        customer.customerId ? customer.customerId.toString() : "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [customers, keyword]);

  const stats = useMemo(() => {
    const total = customers.length;
    const locked = customers.filter(c => c.user?.status === 'locked' || c.status === 'inactive').length;
    const active = total - locked;
    return [
      {
        icon: "👥",
        label: "TỔNG SỐ KHÁCH HÀNG",
        value: total.toLocaleString(),
        tone: "blue",
      },
      {
        icon: "👤",
        label: "HOẠT ĐỘNG",
        value: active.toLocaleString(),
        tone: "cyan",
      },
      {
        icon: "🚫",
        label: "ĐÃ KHÓA",
        value: locked.toLocaleString(),
        tone: "red",
      },
    ];
  }, [customers]);

  function handleViewCustomer(customer) {
    setSelectedCustomer(customer);
  }

  function openEditForm(customer) {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      gender: customer.gender || "",
      dateOfBirth: customer.dateOfBirth || "",
    });
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const customerId = editingCustomer?.customerId || editingCustomer?.id;

    if (!customerId) {
      alert("Không tìm thấy customerId.");
      return;
    }

    try {
      await customerApi.update(customerId, formData);
      alert("Cập nhật khách hàng thành công.");
      setShowForm(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error("Update customer failed:", error);
      alert(error.response?.data?.message || "Cập nhật khách hàng thất bại.");
    }
  }

  async function handleDeleteCustomer(customer) {
    const customerId = customer.customerId || customer.id;

    if (!customerId) {
      alert("Không tìm thấy customerId.");
      return;
    }

    const ok = window.confirm("Bạn có chắc muốn xóa/khóa khách hàng này không?");
    if (!ok) return;

    try {
      await customerApi.delete(customerId);
      alert("Xóa/khóa khách hàng thành công.");
      loadCustomers();
    } catch (error) {
      console.error("Delete customer failed:", error);
      alert(error.response?.data?.message || "Xóa/khóa khách hàng thất bại.");
    }
  }

  const getInitials = (name) => {
    if (!name) return "KH";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getTierLabel = (tierId) => {
    switch (tierId) {
      case 4: return "Khách hàng Bạch Kim";
      case 3: return "Khách hàng Vàng";
      case 2: return "Khách hàng Bạc";
      default: return "Thành viên";
    }
  };

  return (
    <div className="user-management-page">
      <div className="um-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>
            Quản lý thông tin và trạng thái tài khoản khách hàng trong hệ thống WashFlow Pro.
          </p>
        </div>

        <div className="um-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <div className="um-search-box" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '5px 15px' }}>
            <Search size={16} color="#64748b" style={{ marginRight: '8px' }} />
            <input
              style={{ border: 'none', outline: 'none', fontSize: '14px' }}
              placeholder="Tìm tên, email, SĐT..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
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
        <div className="um-table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="um-filter-group">
            <button className="active" type="button">
              Khách hàng ({filteredCustomers.length})
            </button>
          </div>
        </div>

        <div className="um-table-wrap">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Đang tải danh sách khách hàng...</div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Không có khách hàng phù hợp.</div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ và tên</th>
                  <th>Liên hệ</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày gia nhập</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => {
                  const isLocked = customer.user?.status === 'locked' || customer.status === 'inactive';
                  return (
                    <tr key={customer.customerId || customer.id}>
                      <td className="um-user-id">#US-{customer.customerId}</td>

                      <td>
                        <div className="um-user-cell">
                          <div className="um-avatar">{getInitials(customer.fullName)}</div>
                          <div>
                            <strong>{customer.fullName || "N/A"}</strong>
                            <span>{getTierLabel(customer.tierId)}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="um-contact">
                          <span>{customer.email || "N/A"}</span>
                          <small>{customer.phone || "N/A"}</small>
                        </div>
                      </td>

                      <td>
                        <span className="um-role customer">
                          Customer
                        </span>
                      </td>

                      <td>
                        <span className={`um-status ${isLocked ? "locked" : "active"}`}>
                          {isLocked ? "Bị khóa" : "Đang hoạt động"}
                        </span>
                      </td>

                      <td>{customer.joinedAt ? new Date(customer.joinedAt).toLocaleDateString('vi-VN') : "N/A"}</td>

                      <td>
                        <div className="um-actions">
                          <button type="button" title="Xem chi tiết" onClick={() => handleViewCustomer(customer)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" title="Chỉnh sửa" onClick={() => openEditForm(customer)}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" title="Xóa/Khóa" onClick={() => handleDeleteCustomer(customer)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {selectedCustomer && (
        <div className="modal-backdrop">
          <div className="customer-modal">
            <div className="modal-header">
              <h2>Chi tiết khách hàng</h2>
              <button onClick={() => setSelectedCustomer(null)}>×</button>
            </div>

            <div className="detail-content">
              <p><strong>ID:</strong> #US-{selectedCustomer.customerId || "N/A"}</p>
              <p><strong>Họ và tên:</strong> {selectedCustomer.fullName || "N/A"}</p>
              <p><strong>Email:</strong> {selectedCustomer.email || "N/A"}</p>
              <p><strong>SĐT:</strong> {selectedCustomer.phone || "N/A"}</p>
              <p><strong>Giới tính:</strong> {selectedCustomer.gender || "N/A"}</p>
              <p><strong>Ngày sinh:</strong> {selectedCustomer.dateOfBirth || "N/A"}</p>
              <p><strong>Điểm tích lũy:</strong> {selectedCustomer.totalPoints ?? 0} đ</p>
              <p><strong>Số lượt rửa xe:</strong> {selectedCustomer.totalVisits ?? 0}</p>
              <p><strong>Tổng chi tiêu:</strong> {Number(selectedCustomer.totalSpending || 0).toLocaleString("vi-VN")} đ</p>
              <p><strong>Hạng thành viên:</strong> {getTierLabel(selectedCustomer.tierId)}</p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop">
          <div className="customer-modal">
            <div className="modal-header">
              <h2>Cập nhật khách hàng</h2>
              <button onClick={() => setShowForm(false)}>×</button>
            </div>

            <form className="customer-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ tên</label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-modal-btn"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </button>

                <button type="submit" className="save-btn">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageCustomersPage;