import React, { useEffect, useMemo, useState } from "react";
import { Search, Eye, Pencil, Trash2 } from "lucide-react";
import customerApi from "../../../api/customerApi";
import "./ManageCustomersPage.css";

export default function ManageCustomersPage() {
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

      if (Array.isArray(result))
        setCustomers(result);
      else if (Array.isArray(result.content))
        setCustomers(result.content);
      else
        setCustomers([]);
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
        customer.customerId
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [customers, keyword]);

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
  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Quản lý khách hàng</h1>
          <p>Theo dõi thông tin khách hàng trong hệ thống.</p>
        </div>

        <button className="refresh-btn" onClick={loadCustomers}>
          Làm mới
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />

          <input
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="manage-card">
        {loading ? (
          <div className="empty-state">Đang tải danh sách khách hàng...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">Không có khách hàng phù hợp.</div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Điểm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.customerId || customer.id || index}>
                    <td>{index + 1}</td>
                    <td>{customer.customerId || "N/A"}</td>
                    <td>{customer.fullName || customer.name || "N/A"}</td>
                    <td>{customer.email || customer.user?.email || "N/A"}</td>
                    <td>{customer.phone || customer.user?.phone || "N/A"}</td>
                    <td>{customer.totalPoints ?? customer.loyaltyPoints ?? customer.points ?? 0}</td>
                    <td>
                      <div className="action-group">
                        <button
                          className="action-btn view"
                          title="Xem chi tiết"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="action-btn edit"
                          title="Sửa khách hàng"
                          onClick={() => openEditForm(customer)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="action-btn cancel"
                          title="Xóa/khóa khách hàng"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="modal-backdrop">
          <div className="customer-modal">
            <div className="modal-header">
              <h2>Chi tiết khách hàng</h2>
              <button onClick={() => setSelectedCustomer(null)}>×</button>
            </div>

            <div className="detail-content">
              <p><strong>ID:</strong> {selectedCustomer.customerId || "N/A"}</p>
              <p><strong>Họ và tên:</strong> {selectedCustomer.fullName || "N/A"}</p>
              <p><strong>Email:</strong> {selectedCustomer.email || "N/A"}</p>
              <p><strong>SĐT:</strong> {selectedCustomer.phone || "N/A"}</p>
              <p><strong>Giới tính:</strong> {selectedCustomer.gender || "N/A"}</p>
              <p><strong>Ngày sinh:</strong> {selectedCustomer.dateOfBirth || "N/A"}</p>
              <p><strong>Điểm:</strong> {selectedCustomer.totalPoints ?? selectedCustomer.loyaltyPoints ?? selectedCustomer.points ?? 0}</p>
              <p><strong>Lượt ghé:</strong> {selectedCustomer.totalVisits ?? 0}</p>
              <p><strong>Tổng chi tiêu:</strong> {Number(selectedCustomer.totalSpending || 0).toLocaleString("vi-VN")} đ</p>
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
