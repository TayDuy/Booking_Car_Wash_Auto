import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import vehicleApi from "../../../api/vehicleApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import { isValidVietnameseLicensePlate, formatVietnameseLicensePlate } from "../../../utils/licensePlateUtils";
import "./ManageVehiclesPage.css";

const emptyForm = {
  customerId: "",
  licensePlate: "",
  brand: "",
  model: "",
  vehicleType: "car",
  color: "",
};

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

export default function ManageVehiclesPage() {
  const { confirmAction, showMessage } = useAppDialog();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    setLoading(true);

    try {
      const response = await vehicleApi.list();

      console.log("VEHICLE API:", response.data);

      const result =
        response.data?.data ||
        response.data ||
        [];

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

      await showMessage({
        title: "Tải dữ liệu thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được danh sách xe.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshVehicles() {
    setCurrentPage(1);
    await loadVehicles();
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

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVehicles.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedVehicles = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    return filteredVehicles.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [
    filteredVehicles,
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
    filteredVehicles.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastVisibleItem = Math.min(
    currentPage * pageSize,
    filteredVehicles.length
  );

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
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Vui lòng nhập biển số xe.",
        variant: "warning",
      });
      return;
    }

    if (!isValidVietnameseLicensePlate(formData.licensePlate)) {
      await showMessage({
        title: "Dữ liệu không hợp lệ",
        message: "Vui lòng nhập đúng định dạng biển số xe Việt Nam (Ví dụ: 30A-123.45 hoặc 51F-888.88).",
        variant: "warning",
      });
      return;
    }

    const payload = {
      ...formData,
      licensePlate: formatVietnameseLicensePlate(formData.licensePlate),
    };

    try {
      const isEditing = Boolean(editingVehicle);

      if (isEditing) {
        const vehicleId =
          editingVehicle.vehicleId ||
          editingVehicle.id;

        await vehicleApi.update(
          vehicleId,
          payload
        );
      } else {
        await vehicleApi.create(payload);
      }

      setShowForm(false);
      setEditingVehicle(null);
      setFormData(emptyForm);
      setCurrentPage(1);

      await loadVehicles();

      await showMessage({
        title: "Thành công",
        message: isEditing
          ? "Cập nhật xe thành công."
          : "Thêm xe thành công.",
        variant: "success",
      });
    } catch (error) {
      console.error(
        "Save vehicle failed:",
        error
      );

      await showMessage({
        title: "Lưu xe thất bại",
        message:
          error.response?.data?.message ||
          "Lưu xe thất bại. Kiểm tra lại dữ liệu hoặc API backend.",
        variant: "error",
      });
    }
  }

  async function handleDelete(vehicle) {
    const vehicleId =
      vehicle.vehicleId ||
      vehicle.id;

    if (!vehicleId) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Không tìm thấy vehicleId.",
        variant: "error",
      });
      return;
    }

    const licensePlate =
      vehicle.licensePlate ||
      `#${vehicleId}`;

    const ok = await confirmAction({
      title: "Xóa xe",
      message: `Bạn có chắc muốn xóa xe biển số "${licensePlate}" không?`,
      confirmText: "Xóa xe",
      cancelText: "Hủy",
      variant: "danger",
    });

    if (!ok) return;

    try {
      await vehicleApi.delete(vehicleId);
      await loadVehicles();

      await showMessage({
        title: "Thành công",
        message: "Xóa xe thành công.",
        variant: "success",
      });
    } catch (error) {
      console.error(
        "Delete vehicle failed:",
        error
      );

      await showMessage({
        title: "Xóa xe thất bại",
        message:
          error.response?.data?.message ||
          "Xóa xe thất bại.",
        variant: "error",
      });
    }
  }

  async function handleView(vehicle) {
    const vehicleId =
      vehicle.vehicleId ||
      vehicle.id ||
      "N/A";

    const customerName =
      vehicle.customerName ||
      vehicle.customer?.fullName ||
      "N/A";

    const licensePlate =
      vehicle.licensePlate ||
      "N/A";

    const status =
      vehicle.active === false ||
        vehicle.isActive === false
        ? "Không hoạt động"
        : "Đang hoạt động";

    await showMessage({
      title: `Chi tiết xe ${licensePlate}`,
      message:
        `ID: ${vehicleId}\n` +
        `Khách hàng: ${customerName}\n` +
        `Biển số: ${licensePlate}\n` +
        `Hãng: ${vehicle.brand || "N/A"}\n` +
        `Model: ${vehicle.model || "N/A"}\n` +
        `Loại xe: ${vehicle.vehicleType || "N/A"}\n` +
        `Màu: ${vehicle.color || "N/A"}\n` +
        `Trạng thái: ${status}`,
      variant: "info",
    });
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

        <button
          type="button"
          className="refresh-btn"
          onClick={handleRefreshVehicles}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={
              loading ? "vehicle-refresh-spinning" : ""
            }
          />

          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="manage-card">
        {loading ? (
          <div className="empty-state">Đang tải danh sách xe...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="empty-state">Không có xe phù hợp.</div>
        ) : (
          <>
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
                  {paginatedVehicles.map((vehicle, index) => (
                    <tr key={vehicle.vehicleId || vehicle.id || index}>
                      <td>
                        {(currentPage - 1) * pageSize +
                          index +
                          1}
                      </td>
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
            <div className="vehicle-pagination">
              <div className="vehicle-pagination-summary">
                Hiển thị{" "}
                <strong>
                  {firstVisibleItem}–{lastVisibleItem}
                </strong>{" "}
                trong tổng số{" "}
                <strong>
                  {filteredVehicles.length}
                </strong>{" "}
                xe
              </div>

              <div className="vehicle-pagination-controls">
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
                      className="vehicle-pagination-ellipsis"
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

              <label className="vehicle-page-size-control">
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