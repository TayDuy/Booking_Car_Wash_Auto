import React, { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import servicePackageApi from "../../../api/servicePackageApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import "./ManageServicesPage.css";

const emptyForm = {
  serviceName: "",
  description: "",
  basePrice: "",
  durationMinutes: "",
  isActive: true,
};

export default function ManageServicesPage() {
  const { confirmAction, showMessage } = useAppDialog();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedService, setSelectedService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);

    try {
      const response = await servicePackageApi.list();
      console.log("SERVICE API:", response.data);

      const result = response.data?.data || response.data || [];

      if (Array.isArray(result)) {
        setServices(result);
      } else if (Array.isArray(result.content)) {
        setServices(result.content);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Load services failed:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const text = [
        service.serviceName,
        service.name,
        service.description,
        service.basePrice,
        service.durationMinutes,
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());

      const activeValue =
        service.isActive ?? service.active ?? service.status === "active";

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && activeValue === true) ||
        (statusFilter === "inactive" && activeValue === false);

      return matchKeyword && matchStatus;
    });
  }, [services, keyword, statusFilter]);

  function openCreateForm() {
    setEditingService(null);
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEditForm(service) {
    setEditingService(service);

    setFormData({
      serviceName: service.serviceName || service.name || "",
      description: service.description || "",
      basePrice: service.basePrice ?? service.price ?? "",
      durationMinutes: service.durationMinutes ?? service.duration ?? "",
      isActive: service.isActive ?? service.active ?? true,
    });

    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "basePrice" || name === "durationMinutes"
            ? Number(value)
            : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.serviceName.trim()) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Vui lòng nhập tên dịch vụ.",
        variant: "warning",
      });
      return;
    }

    if (!formData.basePrice || Number(formData.basePrice) < 0) {
      await showMessage({
        title: "Giá không hợp lệ",
        message: "Vui lòng nhập giá dịch vụ hợp lệ.",
        variant: "warning",
      });
      return;
    }

    if (!formData.durationMinutes || Number(formData.durationMinutes) <= 0) {
      await showMessage({
        title: "Thời gian không hợp lệ",
        message: "Vui lòng nhập thời gian thực hiện hợp lệ.",
        variant: "warning",
      });
      return;
    }

    try {
      const isEditing = Boolean(editingService);

      if (isEditing) {
        const serviceId =
          editingService.serviceId ||
          editingService.servicePackageId ||
          editingService.id;

        await servicePackageApi.update(
          serviceId,
          formData
        );
      } else {
        await servicePackageApi.create(formData);
      }

      setShowForm(false);
      setEditingService(null);
      setFormData(emptyForm);

      await loadServices();

      await showMessage({
        title: "Thành công",
        message: isEditing
          ? "Cập nhật dịch vụ thành công."
          : "Thêm dịch vụ thành công.",
        variant: "success",
      });
    } catch (error) {
      console.error(
        "Save service failed:",
        error
      );

      await showMessage({
        title: "Lưu dịch vụ thất bại",
        message:
          error.response?.data?.message ||
          "Lưu dịch vụ thất bại.",
        variant: "error",
      });
    }
  }

  async function handleDelete(service) {
    const serviceId =
      service.serviceId ||
      service.servicePackageId ||
      service.id;

    if (!serviceId) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Không tìm thấy serviceId.",
        variant: "error",
      });
      return;
    }

    const serviceName =
      service.serviceName ||
      service.name ||
      `#${serviceId}`;

    const ok = await confirmAction({
      title: "Xóa dịch vụ",
      message: `Bạn có chắc muốn xóa dịch vụ "${serviceName}" không?`,
      confirmText: "Xóa dịch vụ",
      cancelText: "Hủy",
      variant: "danger",
    });

    if (!ok) return;

    try {
      await servicePackageApi.delete(serviceId);
      await loadServices();

      await showMessage({
        title: "Thành công",
        message: "Xóa dịch vụ thành công.",
        variant: "success",
      });
    } catch (error) {
      console.error(
        "Delete service failed:",
        error
      );

      await showMessage({
        title: "Xóa dịch vụ thất bại",
        message:
          error.response?.data?.message ||
          "Xóa dịch vụ thất bại.",
        variant: "error",
      });
    }
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
  }

  function getActive(service) {
    return service.isActive ?? service.active ?? service.status === "active";
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Quản lý dịch vụ</h1>
          <p>Theo dõi, thêm, sửa và xóa mềm các gói dịch vụ rửa xe.</p>
        </div>

        <button className="create-btn" onClick={openCreateForm}>
          <Plus size={18} />
          Thêm dịch vụ
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên dịch vụ, mô tả, giá..."
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
        </select>

        <button className="refresh-btn" onClick={loadServices}>
          Làm mới
        </button>
      </div>

      <div className="manage-card">
        {loading ? (
          <div className="empty-state">Đang tải danh sách dịch vụ...</div>
        ) : filteredServices.length === 0 ? (
          <div className="empty-state">Không có dịch vụ phù hợp.</div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table service-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên dịch vụ</th>
                  <th>Mô tả</th>
                  <th>Giá</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((service, index) => (
                  <tr
                    key={
                      service.serviceId ||
                      service.servicePackageId ||
                      service.id ||
                      index
                    }
                  >
                    <td>{index + 1}</td>
                    <td>{service.serviceName || service.name || "N/A"}</td>
                    <td>{service.description || "Không có mô tả"}</td>
                    <td>
                      {formatMoney(service.basePrice ?? service.price ?? 0)}
                    </td>
                    <td>
                      {service.durationMinutes ?? service.duration ?? 0} phút
                    </td>
                    <td>
                      <span
                        className={
                          getActive(service)
                            ? "status-badge success"
                            : "status-badge danger"
                        }
                      >
                        {getActive(service) ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="action-btn view"
                          title="Xem chi tiết"
                          onClick={() => setSelectedService(service)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="action-btn edit"
                          title="Sửa dịch vụ"
                          onClick={() => openEditForm(service)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="action-btn cancel"
                          title="Xóa mềm dịch vụ"
                          onClick={() => handleDelete(service)}
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

      {selectedService && (
        <div className="modal-backdrop">
          <div className="service-modal">
            <div className="modal-header">
              <h2>Chi tiết dịch vụ</h2>
              <button onClick={() => setSelectedService(null)}>×</button>
            </div>

            <div className="detail-content">
              <p>
                <strong>ID:</strong>{" "}
                {selectedService.serviceId ||
                  selectedService.servicePackageId ||
                  selectedService.id ||
                  "N/A"}
              </p>
              <p>
                <strong>Tên dịch vụ:</strong>{" "}
                {selectedService.serviceName || selectedService.name || "N/A"}
              </p>
              <p>
                <strong>Mô tả:</strong>{" "}
                {selectedService.description || "Không có mô tả"}
              </p>
              <p>
                <strong>Giá:</strong>{" "}
                {formatMoney(selectedService.basePrice ?? selectedService.price)}
              </p>
              <p>
                <strong>Thời gian:</strong>{" "}
                {selectedService.durationMinutes ??
                  selectedService.duration ??
                  0}{" "}
                phút
              </p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                {getActive(selectedService) ? "Hoạt động" : "Tạm dừng"}
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop">
          <div className="service-modal">
            <div className="modal-header">
              <h2>{editingService ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}</h2>
              <button onClick={() => setShowForm(false)}>×</button>
            </div>

            <form className="service-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Tên dịch vụ</label>
                  <input
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleChange}
                    placeholder="VD: Rửa xe cao cấp"
                  />
                </div>

                <div className="form-group">
                  <label>Giá dịch vụ</label>
                  <input
                    type="number"
                    name="basePrice"
                    min="0"
                    value={formData.basePrice}
                    onChange={handleChange}
                    placeholder="VD: 150000"
                  />
                </div>

                <div className="form-group">
                  <label>Thời gian thực hiện</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={handleChange}
                    placeholder="VD: 45"
                  />
                </div>

                <div className="form-group full">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Nhập mô tả dịch vụ..."
                    rows="4"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    Dịch vụ đang hoạt động
                  </label>
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
                  {editingService ? "Lưu thay đổi" : "Tạo dịch vụ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}