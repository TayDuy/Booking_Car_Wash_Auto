import React, { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import promotionApi from "../../../api/promotionApi";
import "./ManagePromotionsPage.css";

const emptyForm = {
  promotionName: "",
  vehicleType: "",
  discountType: "percent",
  discountValue: "",
  minOrderValue: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  status: "active",
};

export default function ManagePromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    setLoading(true);

    try {
      const response = await promotionApi.list();
      console.log("PROMOTION API:", response.data);

      const result = response.data?.data || response.data || [];

      if (Array.isArray(result)) {
        setPromotions(result);
      } else if (Array.isArray(result.content)) {
        setPromotions(result.content);
      } else {
        setPromotions([]);
      }
    } catch (error) {
      console.error("Load promotions failed:", error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      const text = [
        promotion.promotionId,
        promotion.promotionName,
        promotion.vehicleType,
        promotion.discountType,
        promotion.discountValue,
        promotion.minOrderValue,
        promotion.startDate,
        promotion.endDate,
        promotion.usageLimit,
        promotion.status,
        formatDiscount(promotion),
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        String(promotion.status || "").toLowerCase() === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [promotions, keyword, statusFilter]);

  function openCreateForm() {
    setEditingPromotion(null);
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEditForm(promotion) {
    setEditingPromotion(promotion);

    setFormData({
      promotionName: promotion.promotionName || "",
      vehicleType: promotion.vehicleType || "",
      discountType: promotion.discountType || "percent",
      discountValue: promotion.discountValue ?? "",
      minOrderValue: promotion.minOrderValue ?? "",
      startDate: promotion.startDate ? String(promotion.startDate).slice(0, 10) : "",
      endDate: promotion.endDate ? String(promotion.endDate).slice(0, 10) : "",
      usageLimit: promotion.usageLimit ?? "",
      status: promotion.status || "active",
    });

    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "discountValue" ||
          name === "minOrderValue" ||
          name === "usageLimit"
          ? value === "" ? "" : Number(value)
          : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.promotionName.trim()) {
      alert("Vui lòng nhập tên khuyến mãi.");
      return;
    }

    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      alert("Vui lòng nhập giá trị giảm hợp lệ.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const payload = {
      ...formData,
      vehicleType: formData.vehicleType || null,
      minOrderValue: formData.minOrderValue === "" ? null : formData.minOrderValue,
      usageLimit: formData.usageLimit === "" ? null : formData.usageLimit,
    };

    try {
      if (editingPromotion) {
        const promotionId = editingPromotion.promotionId || editingPromotion.id;

        await promotionApi.update(promotionId, payload);
        alert("Cập nhật khuyến mãi thành công.");
      } else {
        await promotionApi.create(payload);
        alert("Tạo khuyến mãi thành công.");
      }

      setShowForm(false);
      setEditingPromotion(null);
      setFormData(emptyForm);
      loadPromotions();
    } catch (error) {
      console.error("Save promotion failed:", error);
      alert(error.response?.data?.message || "Lưu khuyến mãi thất bại.");
    }
  }
  async function handleDelete(promotion) {
    const promotionId = promotion.promotionId || promotion.id;

    if (!promotionId) {
      alert("Không tìm thấy promotionId.");
      return;
    }

    const ok = window.confirm("Bạn có chắc muốn vô hiệu hóa khuyến mãi này không?");
    if (!ok) return;

    try {
      await promotionApi.delete(promotionId);
      alert("Vô hiệu hóa khuyến mãi thành công.");
      loadPromotions();
    } catch (error) {
      console.error("Delete promotion failed:", error);
      alert(error.response?.data?.message || "Vô hiệu hóa khuyến mãi thất bại.");
    }
  }

  function formatDiscount(promotion) {
    const type = String(promotion.discountType || "").toLowerCase();
    const value = promotion.discountValue || 0;

    if (type === "percent") return `${value}%`;
    if (type === "fixed") return `${Number(value).toLocaleString("vi-VN")} đ`;
    if (type === "free_service") return "Miễn phí dịch vụ";

    return value;
  }

  function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (value === "active") return "success";
    if (value === "expired") return "danger";
    if (value === "inactive") return "warning";

    return "warning";
  }

  function getStatusText(status) {
    const value = String(status || "").toLowerCase();

    if (value === "active") return "Hoạt động";
    if (value === "inactive") return "Tạm dừng";
    if (value === "expired") return "Hết hạn";

    return status || "N/A";
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Quản lý khuyến mãi</h1>
          <p>Theo dõi, thêm, sửa và vô hiệu hóa các chương trình khuyến mãi.</p>
        </div>

        <button className="create-btn" onClick={openCreateForm}>
          <Plus size={18} />
          Thêm khuyến mãi
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã, tên, mô tả khuyến mãi..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <select
          className="manage-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm dừng</option>
          <option value="expired">Hết hạn</option>
        </select>

        <button className="refresh-btn" onClick={loadPromotions}>
          Làm mới
        </button>
      </div>

      <div className="manage-card">
        {loading ? (
          <div className="empty-state">Đang tải danh sách khuyến mãi...</div>
        ) : filteredPromotions.length === 0 ? (
          <div className="empty-state">Không có khuyến mãi phù hợp.</div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  <th>Tên khuyến mãi</th>
                  <th>Loại giảm</th>
                  <th>Giá trị</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredPromotions.map((promotion, index) => (
                  <tr key={promotion.promotionId || promotion.id || index}>
                    <td>{index + 1}</td>
                    <td>{promotion.promotionId || "N/A"}</td>
                    <td>{promotion.promotionName || "N/A"}</td>
                    <td>{promotion.discountType || "N/A"}</td>
                    <td>{formatDiscount(promotion)}</td>
                    <td>
                      {(promotion.startDate || "N/A") +
                        " - " +
                        (promotion.endDate || "N/A")}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(promotion.status)}`}>
                        {getStatusText(promotion.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="action-btn view"
                          title="Xem chi tiết"
                          onClick={() => setSelectedPromotion(promotion)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="action-btn edit"
                          title="Sửa khuyến mãi"
                          onClick={() => openEditForm(promotion)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="action-btn cancel"
                          title="Vô hiệu hóa"
                          onClick={() => handleDelete(promotion)}
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

      {selectedPromotion && (
        <div className="modal-backdrop">
          <div className="promotion-modal">
            <div className="modal-header">
              <h2>Chi tiết khuyến mãi</h2>
              <button onClick={() => setSelectedPromotion(null)}>×</button>
            </div>

            <div className="detail-content">
              <p><strong>ID:</strong> {selectedPromotion.promotionId || "N/A"}</p>
              <p><strong>Tên:</strong> {selectedPromotion.promotionName || "N/A"}</p>
              <p><strong>Loại xe:</strong> {selectedPromotion.vehicleType || "Tất cả"}</p>
              <p><strong>Loại giảm:</strong> {selectedPromotion.discountType || "N/A"}</p>
              <p><strong>Giá trị:</strong> {formatDiscount(selectedPromotion)}</p>
              <p><strong>Đơn tối thiểu:</strong> {selectedPromotion.minOrderValue ? Number(selectedPromotion.minOrderValue).toLocaleString("vi-VN") + " đ" : "Không yêu cầu"}</p>
              <p><strong>Giới hạn lượt dùng:</strong> {selectedPromotion.usageLimit || "Không giới hạn"}</p>
              <p><strong>Bắt đầu:</strong> {selectedPromotion.startDate || "N/A"}</p>
              <p><strong>Kết thúc:</strong> {selectedPromotion.endDate || "N/A"}</p>
              <p><strong>Trạng thái:</strong> {getStatusText(selectedPromotion.status)}</p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop">
          <div className="promotion-modal">
            <div className="modal-header">
              <h2>{editingPromotion ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi"}</h2>
              <button onClick={() => setShowForm(false)}>×</button>
            </div>

            <form className="promotion-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Loại giảm</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                  >
                    <option value="percent">Phần trăm</option>
                    <option value="fixed">Số tiền cố định</option>
                    <option value="free_service">Miễn phí dịch vụ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Giá trị giảm</label>
                  <input
                    type="number"
                    name="discountValue"
                    min="0"
                    value={formData.discountValue}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Loại xe</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                  >
                    <option value="">Tất cả loại xe</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="minivan">Minivan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                    <option value="expired">Hết hạn</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Đơn tối thiểu</label>
                  <input
                    type="number"
                    name="minOrderValue"
                    min="0"
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    placeholder="VD: 100000"
                  />
                </div>

                <div className="form-group">
                  <label>Giới hạn lượt dùng</label>
                  <input
                    type="number"
                    name="usageLimit"
                    min="1"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    placeholder="VD: 100"
                  />
                </div>

                <div className="form-group full">
                  <label>Tên khuyến mãi</label>
                  <input
                    name="promotionName"
                    value={formData.promotionName}
                    onChange={handleChange}
                    placeholder="VD: Giảm giá mùa hè"
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
                  {editingPromotion ? "Lưu thay đổi" : "Tạo khuyến mãi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}