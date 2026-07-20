import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Plus,
} from "lucide-react";
import customerApi from "../../../api/customerApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import "./ManageCustomersPage.css";

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const items = [1];

  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(
    totalPages - 1,
    currentPage + 1
  );

  if (startPage > 2) {
    items.push("ellipsis-start");
  }

  for (
    let page = startPage;
    page <= endPage;
    page += 1
  ) {
    items.push(page);
  }

  if (endPage < totalPages - 1) {
    items.push("ellipsis-end");
  }

  items.push(totalPages);

  return items;
}
const emptyCustomerForm = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
};
export default function ManageCustomersPage() {
  const { confirmAction, showMessage } = useAppDialog();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    ...emptyCustomerForm,
  });
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);

    try {
      const response = await customerApi.list();

      console.log("CUSTOMER API:", response.data);

      const result =
        response.data?.data ||
        response.data ||
        [];

      if (Array.isArray(result)) {
        setCustomers(result);
      } else if (Array.isArray(result.content)) {
        setCustomers(result.content);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Load customers failed:", error);

      setCustomers([]);

      await showMessage({
        title: "Tải dữ liệu thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được danh sách khách hàng.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshCustomers() {
    setCurrentPage(1);
    await loadCustomers();
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

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCustomers = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    return filteredCustomers.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [
    filteredCustomers,
    currentPage,
    pageSize,
  ]);

  const paginationItems = useMemo(
    () =>
      getPaginationItems(
        currentPage,
        totalPages
      ),
    [currentPage, totalPages]
  );

  const firstVisibleItem =
    filteredCustomers.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastVisibleItem = Math.min(
    currentPage * pageSize,
    filteredCustomers.length
  );

  function handleViewCustomer(customer) {
    setSelectedCustomer(customer);
  }
  function openCreateForm() {
    setEditingCustomer(null);
    setFormData({
      ...emptyCustomerForm,
    });
    setShowForm(true);
  }
  function openEditForm(customer) {
    setEditingCustomer(customer);
    setFormData({
      ...emptyCustomerForm,
      fullName: customer.fullName || "",
      email: customer.email || customer.user?.email || "",
      phone: customer.phone || customer.user?.phone || "",
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

    const isEditing = Boolean(editingCustomer);
    const customerId =
      editingCustomer?.customerId ||
      editingCustomer?.id;

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!fullName || !email || !phone) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message:
          "Vui lòng nhập đầy đủ họ tên, email và số điện thoại.",
        variant: "warning",
      });
      return;
    }

    if (!isEditing && !username) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Vui lòng nhập tên đăng nhập.",
        variant: "warning",
      });
      return;
    }

    if (!isEditing && username.length < 3) {
      await showMessage({
        title: "Tên đăng nhập không hợp lệ",
        message: "Tên đăng nhập phải có ít nhất 3 ký tự.",
        variant: "warning",
      });
      return;
    }

    if (!isEditing && password && password.length < 6) {
      await showMessage({
        title: "Mật khẩu không hợp lệ",
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
        variant: "warning",
      });
      return;
    }

    if (isEditing && !customerId) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Không tìm thấy customerId.",
        variant: "error",
      });
      return;
    }

    try {
      if (isEditing) {
        const updatePayload = {
          fullName,
          email,
          phone,
          gender: formData.gender || null,
          dateOfBirth: formData.dateOfBirth || null,
        };

        await customerApi.update(
          customerId,
          updatePayload
        );

        setShowForm(false);
        setEditingCustomer(null);
        setFormData({
          ...emptyCustomerForm,
        });

        await loadCustomers();

        await showMessage({
          title: "Thành công",
          message: "Cập nhật khách hàng thành công.",
          variant: "success",
        });

        return;
      }

      const createPayload = {
        username,
        email,
        phone,
        fullName,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
      };

      if (password) {
        createPayload.password = password;
      }

      const response =
        await customerApi.create(createPayload);

      const result =
        response?.data ?? response;

      const generatedPassword =
        result?.generatedPassword;

      const createdUsername =
        result?.customer?.username ||
        username;

      setShowForm(false);
      setEditingCustomer(null);
      setFormData({
        ...emptyCustomerForm,
      });

      await loadCustomers();

      await showMessage({
        title: "Tạo khách hàng thành công",
        message: generatedPassword
          ? `Tài khoản: ${createdUsername}. Mật khẩu tạm thời: ${generatedPassword}`
          : `Đã tạo tài khoản ${createdUsername} thành công.`,
        variant: "success",
      });
    } catch (error) {
      console.error(
        isEditing
          ? "Update customer failed:"
          : "Create customer failed:",
        error
      );

      await showMessage({
        title: isEditing
          ? "Cập nhật thất bại"
          : "Tạo khách hàng thất bại",
        message:
          error.response?.data?.message ||
          (isEditing
            ? "Cập nhật khách hàng thất bại."
            : "Tạo khách hàng thất bại."),
        variant: "error",
      });
    }
  }

  async function handleDeleteCustomer(customer) {
    const customerId =
      customer.customerId || customer.id;

    if (!customerId) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Không tìm thấy customerId.",
        variant: "error",
      });
      return;
    }

    const customerName =
      customer.fullName ||
      customer.email ||
      `#${customerId}`;

    const ok = await confirmAction({
      title: "Xóa/khóa khách hàng",
      message: `Bạn có chắc muốn xóa hoặc khóa khách hàng "${customerName}" không?`,
      confirmText: "Xóa/khóa",
      cancelText: "Quay lại",
      variant: "danger",
    });

    if (!ok) return;

    try {
      await customerApi.delete(customerId);

      await showMessage({
        title: "Thành công",
        message: "Xóa/khóa khách hàng thành công.",
        variant: "success",
      });

      await loadCustomers();
    } catch (error) {
      console.error(
        "Delete customer failed:",
        error
      );

      await showMessage({
        title: "Thao tác thất bại",
        message:
          error.response?.data?.message ||
          "Xóa/khóa khách hàng thất bại.",
        variant: "error",
      });
    }
  }
  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Quản lý khách hàng</h1>
          <p>Theo dõi thông tin khách hàng trong hệ thống.</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="create-btn"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Thêm khách hàng
          </button>

          <button
            type="button"
            className="refresh-btn"
            onClick={handleRefreshCustomers}
            disabled={loading}
          >
            <RefreshCw
              size={18}
              className={
                loading
                  ? "customer-refresh-spinning"
                  : ""
              }
            />

            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
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
          <>
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
                  {paginatedCustomers.map((customer, index) => (
                    <tr key={customer.customerId || customer.id || index}>
                      <td>
                        {(currentPage - 1) * pageSize +
                          index +
                          1}
                      </td>
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
            <div className="customer-pagination">
              <div className="customer-pagination-summary">
                Hiển thị{" "}
                <strong>
                  {firstVisibleItem}–{lastVisibleItem}
                </strong>{" "}
                trong tổng số{" "}
                <strong>
                  {filteredCustomers.length}
                </strong>{" "}
                khách hàng
              </div>

              <div className="customer-pagination-controls">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.max(previousPage - 1, 1)
                    )
                  }
                >
                  Trước
                </button>

                {paginationItems.map((item) =>
                  typeof item === "number" ? (
                    <button
                      type="button"
                      key={item}
                      className={
                        item === currentPage
                          ? "active"
                          : ""
                      }
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      className="customer-pagination-ellipsis"
                      key={item}
                    >
                      …
                    </span>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.min(
                        previousPage + 1,
                        totalPages
                      )
                    )
                  }
                >
                  Sau
                </button>
              </div>

              <label className="customer-page-size-control">
                <span>Mỗi trang</span>

                <select
                  value={pageSize}
                  onChange={(event) =>
                    setPageSize(
                      Number(event.target.value)
                    )
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </>
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
              <h2>
                {editingCustomer
                  ? "Cập nhật khách hàng"
                  : "Thêm khách hàng"}
              </h2>
              <button onClick={() => setShowForm(false)}>×</button>
            </div>

            <form className="customer-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                {!editingCustomer && (
                  <>
                    <div className="form-group">
                      <label>Tên đăng nhập</label>
                      <input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Tối thiểu 3 ký tự"
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Mật khẩu</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Để trống để hệ thống tự tạo"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}

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
                  {editingCustomer
                    ? "Lưu thay đổi"
                    : "Tạo khách hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
