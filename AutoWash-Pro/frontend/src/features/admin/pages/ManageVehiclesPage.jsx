import React, { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import vehicleApi from "../../../api/vehicleApi";
import "./ManageVehiclesPage.css";

const emptyForm = {
  customerId: "",
  licensePlate: "",
  brand: "",
  model: "",
  vehicleType: "car",
  color: "",
};

export default function ManageVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      const response = await vehicleApi.list();
      console.log("VEHICLE API:", response.data);

      const result = response.data?.data || response.data || [];

      if (Array.isArray(result)) {
        setVehicles(result);
      } else if (Array.isArray(result.content)) {
        setVehicles(result.content);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error("Load vehicles failed:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const text = [
        vehicle.licensePlate,
        vehicle.brand,
        vehicle.model,
        vehicle.vehicleType,
        vehicle.color,
        vehicle.customerName,
        vehicle.customer?.fullName,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [vehicles, keyword]);

  function openCreateForm() {
    setEditingVehicle(null);
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEditForm(vehicle) {
    setEditingVehicle(vehicle);

    setFormData({
      customerId: vehicle.customerId || vehicle.customer?.customerId || "",
      licensePlate: vehicle.licensePlate || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      vehicleType: vehicle.vehicleType || "car",
      color: vehicle.color || "",
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

    if (!formData.licensePlate.trim()) {
      alert("Vui lòng nhập biển số xe.");
      return;
    }

    try {
      if (editingVehicle) {
        const vehicleId = editingVehicle.vehicleId || editingVehicle.id;
        await vehicleApi.update(vehicleId, formData);
        alert("Cập nhật xe thành công.");
      } else {
        await vehicleApi.create(formData);
        alert("Thêm xe thành công.");
      }

      setShowForm(false);
      setEditingVehicle(null);
      setFormData(emptyForm);
      loadVehicles();
    } catch (error) {
      console.error("Save vehicle failed:", error);
      alert("Lưu xe thất bại. Kiểm tra lại dữ liệu hoặc API backend.");
    }
  }

  async function handleDelete(vehicle) {
    const vehicleId = vehicle.vehicleId || vehicle.id;

    if (!vehicleId) {
      alert("Không tìm thấy vehicleId.");
      return;
    }

    const ok = window.confirm("Bạn có chắc muốn xoá xe này không?");
    if (!ok) return;

    try {
      await vehicleApi.delete(vehicleId);
      alert("Xoá xe thành công.");
      loadVehicles();
    } catch (error) {
      console.error("Delete vehicle failed:", error);
      alert("Xoá xe thất bại.");
    }
  }

  function handleView(vehicle) {
    alert(
      `ID: ${vehicle.vehicleId || vehicle.id || "N/A"}\n` +
        `Khách hàng: ${
          vehicle.customerName || vehicle.customer?.fullName || "N/A"
        }\n` +
        `Biển số: ${vehicle.licensePlate || "N/A"}\n` +
        `Hãng: ${vehicle.brand || "N/A"}\n` +
        `Model: ${vehicle.model || "N/A"}\n` +
        `Loại xe: ${vehicle.vehicleType || "N/A"}\n` +
        `Màu: ${vehicle.color || "N/A"}\n` +
        `Trạng thái: ${
          vehicle.active === false || vehicle.isActive === false
            ? "Không hoạt động"
            : "Đang hoạt động"
        }`
    );
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Quản lý xe của khách</h1>
          <p>Theo dõi, thêm, sửa và xoá xe của khách hàng.</p>
        </div>

        <button className="create-btn" onClick={openCreateForm}>
          <Plus size={18} />
          Thêm xe
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo biển số, hãng xe, khách hàng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <button className="refresh-btn" onClick={loadVehicles}>
          Làm mới
        </button>
      </div>

      <div className="manage-card">
        {loading ? (
          <div className="empty-state">Đang tải danh sách xe...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="empty-state">Không có xe phù hợp.</div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Biển số</th>
                  <th>Khách hàng</th>
                  <th>Hãng</th>
                  <th>Model</th>
                  <th>Loại xe</th>
                  <th>Màu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map((vehicle, index) => (
                  <tr key={vehicle.vehicleId || vehicle.id || index}>
                    <td>{index + 1}</td>
                    <td>{vehicle.licensePlate || "N/A"}</td>
                    <td>
                      {vehicle.customerName ||
                        vehicle.customer?.fullName ||
                        "N/A"}
                    </td>
                    <td>{vehicle.brand || "N/A"}</td>
                    <td>{vehicle.model || "N/A"}</td>
                    <td>{vehicle.vehicleType || "N/A"}</td>
                    <td>{vehicle.color || "N/A"}</td>
                    <td>
                      <span
                        className={
                          vehicle.active === false ||
                          vehicle.isActive === false
                            ? "status-badge danger"
                            : "status-badge success"
                        }
                      >
                        {vehicle.active === false ||
                        vehicle.isActive === false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="action-btn view"
                          title="Xem chi tiết"
                          onClick={() => handleView(vehicle)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="action-btn edit"
                          title="Sửa xe"
                          onClick={() => openEditForm(vehicle)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="action-btn cancel"
                          title="Xoá xe"
                          onClick={() => handleDelete(vehicle)}
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

      {showForm && (
        <div className="modal-backdrop">
          <div className="vehicle-modal">
            <div className="modal-header">
              <h2>{editingVehicle ? "Cập nhật xe" : "Thêm xe mới"}</h2>
              <button onClick={() => setShowForm(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="vehicle-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer ID</label>
                  <input
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    placeholder="VD: 1"
                  />
                </div>

                <div className="form-group">
                  <label>Biển số</label>
                  <input
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="VD: 51A-12345"
                  />
                </div>

                <div className="form-group">
                  <label>Hãng xe</label>
                  <input
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="VD: Toyota"
                  />
                </div>

                <div className="form-group">
                  <label>Model</label>
                  <input
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="VD: Vios"
                  />
                </div>

                <div className="form-group">
                  <label>Loại xe</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                  >
                    <option value="car">Car</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="motorbike">Motorbike</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Màu xe</label>
                  <input
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="VD: Đen"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-modal-btn"
                  onClick={() => setShowForm(false)}
                >
                  Huỷ
                </button>

                <button type="submit" className="save-btn">
                  {editingVehicle ? "Lưu thay đổi" : "Tạo xe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}