import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, XCircle, CheckCircle, PlayCircle, Plus, Pencil, Trash2, } from "lucide-react";
import bookingApi from "../../../api/bookingApi";
import customerApi from "../../../api/customerApi";
import vehicleApi from "../../../api/vehicleApi";
import servicePackageApi from "../../../api/servicePackageApi";
import { getBranches } from "../../../api/branchService";
import { getAvailableSlots } from "../../../api/timeSlotService";
import "./ManageBookingsPage.css";

const emptyCreateForm = {
  customerId: "",
  vehicleId: "",
  licensePlate: "",
  brand: "",
  model: "",
  vehicleType: "4_seats",

  branchId: "",
  bookingDate: "",
  slotId: "",

  note: "",
  paymentMethod: "offline",

  details: [
    {
      serviceId: "",
      quantity: 1,
    },
  ],
};

const emptyEditForm = {
  assignedStaffId: "",
  note: "",
};

function unwrapList(response) {
  const root = response?.data;
  const result = root?.data ?? root;

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.content)) {
    return result.content;
  }

  return [];
}

function getLocalToday() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60 * 1000;

  return new Date(now.getTime() - timezoneOffset)
      .toISOString()
      .slice(0, 10);
}

function mapVehicleTypeToBookingType(vehicleType) {
  const normalizedType = String(vehicleType || "").toLowerCase();

  if (normalizedType === "suv" || normalizedType === "truck") {
    return "7_seats";
  }

  return "4_seats";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatTime(value) {
  if (!value) return "";

  return String(value).slice(0, 5);
}

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

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [customers, setCustomers] = useState([]);

  const [branches, setBranches] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [servicePackages, setServicePackages] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [createOptionsLoading, setCreateOptionsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [updating, setUpdating] = useState(false);

  const [assignableStaff, setAssignableStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [sortBy, currentPage, pageSize]);

  useEffect(() => {
    if (
        !showCreateModal ||
        !createForm.branchId ||
        !createForm.bookingDate
    ) {
      setAvailableSlots([]);
      return;
    }

    let ignoreResult = false;

    async function loadAvailableSlots() {
      setSlotsLoading(true);

      try {
        const response = await getAvailableSlots(
            Number(createForm.branchId),
            createForm.bookingDate
        );

        const slotList = unwrapList(response);

        if (!ignoreResult) {
          setAvailableSlots(slotList);

          setCreateForm((prev) => ({
            ...prev,
            slotId: "",
          }));
        }
      } catch (error) {
        console.error("Load available slots failed:", error);

        if (!ignoreResult) {
          setAvailableSlots([]);
        }
      } finally {
        if (!ignoreResult) {
          setSlotsLoading(false);
        }
      }
    }

    loadAvailableSlots();

    return () => {
      ignoreResult = true;
    };
  }, [
    showCreateModal,
    createForm.branchId,
    createForm.bookingDate,
  ]);

  async function loadBookings() {
    setLoading(true);

    try {
      const response = await bookingApi.adminList({ sortBy, page: currentPage, size: pageSize });
      console.log("ADMIN BOOKINGS:", response.data);

      const body = response.data?.data || response.data || {};
      const content = body.content || [];

      setBookings(Array.isArray(content) ? content : []);
      if (body.totalPages !== undefined) setTotalPages(body.totalPages || 1);
      if (body.totalElements !== undefined) setTotalElements(body.totalElements);
    } catch (error) {
      console.error("Load bookings failed:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const text = [
        booking.bookingCode,
        booking.customerName,
        booking.customer?.fullName,
        booking.branchName,
        booking.branch?.branchName,
        booking.serviceName,
        booking.status,
      ]
          .join(" ")
          .toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());

      const matchStatus =
          statusFilter === "all" || booking.status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [bookings, keyword, statusFilter]);

  useEffect(() => {
    setCurrentPage(0);
  }, [keyword, statusFilter, sortBy, pageSize]);

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  const paginatedBookings = useMemo(() => {
    return filteredBookings;
  }, [filteredBookings]);

  const paginationItems = useMemo(
      () => getPaginationItems(currentPage + 1, totalPages),
      [currentPage, totalPages]
  );

  const firstVisibleItem =
      totalElements === 0
          ? 0
          : currentPage * pageSize + 1;

  const lastVisibleItem = Math.min(
      (currentPage + 1) * pageSize,
      totalElements
  );

  const selectedCustomerVehicles = useMemo(() => {
    if (!createForm.customerId) {
      return [];
    }

    return vehicles.filter((vehicle) => {
      const sameCustomer =
          Number(vehicle.customerId) === Number(createForm.customerId);

      const isActive =
          vehicle.isActive !== false &&
          vehicle.active !== false;

      return sameCustomer && isActive;
    });
  }, [vehicles, createForm.customerId]);

  async function handleCancelBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const confirmCancel = window.confirm(
        "Bạn có chắc muốn hủy đơn đặt lịch này không?"
    );

    if (!confirmCancel) return;

    try {
      await bookingApi.adminCancel(bookingId);

      alert("Hủy booking thành công.");
      await loadBookings();
    } catch (error) {
      console.error("Cancel booking failed:", error);

      alert(
          error.response?.data?.message ||
          "Hủy booking thất bại."
      );
    }
  }

  function getStatusClass(status) {
    const normalizedStatus = String(status || "").toLowerCase();

    if (
        normalizedStatus === "confirmed" ||
        normalizedStatus === "completed"
    ) {
      return "success";
    }

    if (
        normalizedStatus === "cancelled" ||
        normalizedStatus === "no_show"
    ) {
      return "danger";
    }

    if (
        normalizedStatus === "checked_in" ||
        normalizedStatus === "in_progress"
    ) {
      return "info";
    }

    return "warning";
  }

  async function handleViewBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    setDetailLoading(true);

    try {
      const response = await bookingApi.adminDetail(bookingId);
      setSelectedBooking(response.data?.data || response.data);
    } catch (error) {
      console.error("Load booking detail failed:", error);
      alert("Không tải được chi tiết booking.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleConfirmBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const ok = window.confirm(
        "Bạn có chắc muốn xác nhận booking này không?"
    );

    if (!ok) return;

    try {
      await bookingApi.adminConfirm(bookingId);

      alert("Xác nhận booking thành công.");
      await loadBookings();
    } catch (error) {
      console.error("Confirm booking failed:", error);

      alert(
          error.response?.data?.message ||
          "Xác nhận booking thất bại."
      );
    }
  }
  async function handleCheckInBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const ok = window.confirm(
        "Bạn có chắc khách hàng đã đến và muốn check-in booking này không?"
    );

    if (!ok) return;

    try {
      await bookingApi.adminCheckIn(bookingId);

      alert("Check-in booking thành công.");
      await loadBookings();
    } catch (error) {
      console.error("Check-in booking failed:", error);

      alert(
          error.response?.data?.message ||
          "Check-in booking thất bại."
      );
    }
  }

  async function handleStartWashBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const ok = window.confirm(
        "Bạn có chắc muốn bắt đầu thực hiện dịch vụ cho booking này không?"
    );

    if (!ok) return;

    try {
      await bookingApi.adminStartWash(bookingId);

      alert("Đã bắt đầu thực hiện dịch vụ.");
      await loadBookings();
    } catch (error) {
      console.error("Start wash booking failed:", error);

      alert(
          error.response?.data?.message ||
          "Không thể bắt đầu thực hiện dịch vụ."
      );
    }
  }

  async function handleCompleteBooking(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const ok = window.confirm(
        "Bạn có chắc muốn hoàn thành booking này không?"
    );

    if (!ok) return;

    try {
      await bookingApi.adminComplete(bookingId);

      alert("Hoàn thành booking thành công.");
      await loadBookings();
    } catch (error) {
      console.error("Complete booking failed:", error);

      alert(
          error.response?.data?.message ||
          "Hoàn thành booking thất bại."
      );
    }
  }

  async function loadCreateOptions() {
    setCreateOptionsLoading(true);

    try {
      const [
        customerResponse,
        branchResponse,
        vehicleResponse,
        serviceResponse,
      ] = await Promise.all([
        customerApi.list(),
        getBranches("active"),
        vehicleApi.list(),
        servicePackageApi.active(),
      ]);

      const customerList = unwrapList(customerResponse);
      const branchList = unwrapList(branchResponse);
      const vehicleList = unwrapList(vehicleResponse);
      const serviceList = unwrapList(serviceResponse);

      setCustomers(customerList);
      setBranches(
          branchList.filter(
              (branch) =>
                  branch.acceptingBookings !== false &&
                  String(branch.status || "").toLowerCase() === "active"
          )
      );
      setVehicles(vehicleList);
      setServicePackages(
          serviceList.filter(
              (service) =>
                  service.isActive !== false &&
                  service.active !== false
          )
      );

      console.log("CREATE BOOKING OPTIONS:", {
        customers: customerList,
        branches: branchList,
        vehicles: vehicleList,
        services: serviceList,
      });
    } catch (error) {
      console.error("Load create booking options failed:", error);

      alert(
          error.response?.data?.message ||
          "Không tải được dữ liệu để tạo booking."
      );
    } finally {
      setCreateOptionsLoading(false);
    }
  }

  async function openCreateModal() {
    setCreateForm({
      ...emptyCreateForm,
      bookingDate: getLocalToday(),
      details: [
        {
          serviceId: "",
          quantity: 1,
        },
      ],
    });

    setAvailableSlots([]);
    setShowCreateModal(true);

    await loadCreateOptions();
  }

  function handleCreateFieldChange(e) {
    const { name, value } = e.target;

    setCreateForm((prev) => {
      if (name === "branchId" || name === "bookingDate") {
        return {
          ...prev,
          [name]: value,
          slotId: "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function handleCreateCustomerChange(e) {
    const customerId = e.target.value;

    setCreateForm((prev) => ({
      ...prev,
      customerId,
      vehicleId: "",
      licensePlate: "",
      brand: "",
      model: "",
      vehicleType: "4_seats",
    }));
  }
  function handleCreateVehicleChange(e) {
    const vehicleId = e.target.value;

    if (!vehicleId) {
      setCreateForm((prev) => ({
        ...prev,
        vehicleId: "",
        licensePlate: "",
        brand: "",
        model: "",
        vehicleType: "4_seats",
      }));

      return;
    }

    if (vehicleId === "new") {
      setCreateForm((prev) => ({
        ...prev,
        vehicleId: "new",
        licensePlate: "",
        brand: "",
        model: "",
        vehicleType: "4_seats",
      }));

      return;
    }

    const selectedVehicle = vehicles.find(
        (vehicle) =>
            Number(vehicle.vehicleId || vehicle.id) === Number(vehicleId)
    );

    if (!selectedVehicle) {
      return;
    }

    setCreateForm((prev) => ({
      ...prev,
      vehicleId,
      licensePlate: selectedVehicle.licensePlate || "",
      brand: selectedVehicle.brand || "",
      model: selectedVehicle.model || "",
      vehicleType: mapVehicleTypeToBookingType(
          selectedVehicle.vehicleType
      ),
    }));
  }
  function handleCreateDetailChange(index, field, value) {
    setCreateForm((prev) => ({
      ...prev,
      details: prev.details.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addServiceRow() {
    setCreateForm((prev) => ({
      ...prev,
      details: [...prev.details, { serviceId: "", quantity: 1 }],
    }));
  }

  function removeServiceRow(index) {
    setCreateForm((prev) => ({
      ...prev,
      details:
          prev.details.length === 1
              ? prev.details
              : prev.details.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleCreateBooking(e) {
    e.preventDefault();

    if (
        !createForm.customerId ||
        !createForm.branchId ||
        !createForm.bookingDate ||
        !createForm.slotId ||
        !createForm.licensePlate.trim() ||
        !createForm.brand.trim() ||
        createForm.details.some(
            (item) =>
                !item.serviceId ||
                Number(item.quantity) < 1
        )
    ) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }

    const payload = {
      customerId: Number(createForm.customerId),
      licensePlate: createForm.licensePlate.trim(),
      brand: createForm.brand.trim(),
      model: createForm.model.trim() || null,
      vehicleType: createForm.vehicleType,
      slotId: Number(createForm.slotId),
      branchId: Number(createForm.branchId),
      note: createForm.note.trim() || null,
      paymentMethod: createForm.paymentMethod || null,
      details: createForm.details.map((item) => ({
        serviceId: Number(item.serviceId),
        quantity: Number(item.quantity),
      })),
    };

    setCreating(true);
    try {
      await bookingApi.adminCreate(payload);
      alert("Tạo booking thành công.");
      setShowCreateModal(false);
      setCurrentPage(1);
      await loadBookings();
    } catch (error) {
      console.error("Create booking failed:", error);
      alert(error.response?.data?.message || "Tạo booking thất bại.");
    } finally {
      setCreating(false);
    }
  }

  async function openEditModal(booking) {
    const bookingId = booking.bookingId || booking.id;

    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    setStaffLoading(true);
    setAssignableStaff([]);

    try {
      const [detailResponse, staffResponse] = await Promise.all([
        bookingApi.adminDetail(bookingId),
        bookingApi.adminAssignableStaff(bookingId),
      ]);

      const detail =
          detailResponse.data?.data || detailResponse.data;

      const staffResult =
          staffResponse.data?.data || staffResponse.data || [];

      const staffList = Array.isArray(staffResult)
          ? staffResult
          : Array.isArray(staffResult.content)
              ? staffResult.content
              : [];

      const currentAssignedStaffId =
          detail.assignedStaffId ??
          detail.employeeId ??
          detail.assignedStaff?.employeeId ??
          detail.assignedStaff?.id ??
          "";

      setEditingBooking(detail);
      setAssignableStaff(staffList);

      setEditForm({
        assignedStaffId:
            currentAssignedStaffId === null
                ? ""
                : String(currentAssignedStaffId),

        note: detail.note || "",
      });
    } catch (error) {
      console.error("Load booking for edit failed:", error);

      alert(
          error.response?.data?.message ||
          "Không tải được dữ liệu phân công nhân viên."
      );
    } finally {
      setStaffLoading(false);
    }
  }

  async function handleUpdateBooking(e) {
    e.preventDefault();

    const bookingId = editingBooking?.bookingId || editingBooking?.id;
    if (!bookingId) {
      alert("Không tìm thấy bookingId.");
      return;
    }

    const payload = {
      assignedStaffId:
          editForm.assignedStaffId === ""
              ? null
              : Number(editForm.assignedStaffId),
      note: editForm.note.trim() || null,
    };

    setUpdating(true);
    try {
      await bookingApi.adminUpdate(bookingId, payload);
      alert("Cập nhật booking thành công.");
      setEditingBooking(null);
      await loadBookings();
    } catch (error) {
      console.error("Update booking failed:", error);
      alert(error.response?.data?.message || "Cập nhật booking thất bại.");
    } finally {
      setUpdating(false);
    }
  }

  return (
      <div className="manage-page">
        <div className="manage-header">
          <div>
            <h1>Quản lý đặt lịch</h1>
            <p>Theo dõi, tìm kiếm và xử lý các đơn đặt lịch trong hệ thống.</p>
          </div>

          <div className="booking-header-actions">
            <button className="secondary-btn" onClick={loadBookings}>
              Làm mới
            </button>

            <button className="refresh-btn" onClick={openCreateModal}>
              <Plus size={18} />
              Tạo booking
            </button>
          </div>
        </div>

        <div className="manage-toolbar">
          <div className="manage-search">
            <Search size={18} />
            <input
                type="text"
                placeholder="Tìm theo mã đơn, khách hàng, chi nhánh..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked in</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No show</option>
          </select>

          <select
              className="manage-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Mới đặt trước</option>
            <option value="priority">Theo thứ hạng khách hàng</option>
          </select>
        </div>

        <div className="manage-card">
          {loading ? (
              <div className="empty-state">Đang tải danh sách đặt lịch...</div>
          ) : filteredBookings.length === 0 ? (
              <div className="empty-state">Không có đơn đặt lịch phù hợp.</div>
          ) : (
              <>
                <div className="booking-table-wrap">
                  <table className="booking-table">
                    <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Chi nhánh</th>
                      <th>Dịch vụ</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                    </thead>

                    <tbody>
                    {paginatedBookings.map((booking, index) => (
                        <tr
                            key={
                                booking.bookingId ||
                                booking.id ||
                                index
                            }
                        >
                          <td>
                            {currentPage * pageSize +
                                index +
                                1}
                          </td>

                          <td>{booking.bookingCode || "N/A"}</td>

                          <td>
                            {booking.customerName ||
                                booking.customer?.fullName ||
                                booking.customer ||
                                "N/A"}
                          </td>

                          <td>
                            {booking.branchName ||
                                booking.branch?.branchName ||
                                booking.branch ||
                                "N/A"}
                          </td>

                          <td>
                            {Array.isArray(booking.serviceNames)
                                ? booking.serviceNames.join(", ")
                                : booking.serviceName ||
                                booking.service?.serviceName ||
                                booking.service ||
                                "N/A"}
                          </td>

                          <td>
                            {booking.bookingDate
                                ? new Date(
                                    booking.bookingDate
                                ).toLocaleString("vi-VN")
                                : booking.startTime
                                    ? new Date(
                                        booking.startTime
                                    ).toLocaleString("vi-VN")
                                    : booking.time || "N/A"}
                          </td>

                          <td>
                        <span
                            className={`status-badge ${getStatusClass(
                                booking.status
                            )}`}
                        >
                          {booking.status || "pending"}
                        </span>
                          </td>

                          <td>
                              <div className="action-group">
                                <button
                                    type="button"
                                    className="action-btn view"
                                    title="Xem chi tiết"
                                    onClick={() => handleViewBooking(booking)}
                                >
                                  <Eye size={16} />
                                </button>

                                {!["completed", "cancelled"].includes(
                                    String(booking.status || "").toLowerCase()
                                ) && (
                                    <button
                                        type="button"
                                        className="action-btn edit"
                                        title="Phân công nhân viên và ghi chú"
                                        onClick={() => openEditModal(booking)}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                )}

                                {String(booking.status || "").toLowerCase() ===
                                    "pending" && (
                                        <button
                                            type="button"
                                            className="action-btn complete"
                                            title="Xác nhận booking"
                                            onClick={() => handleConfirmBooking(booking)}
                                        >
                                          <CheckCircle size={16} />
                                        </button>
                                    )}

                                {String(booking.status || "").toLowerCase() ===
                                    "confirmed" && (
                                        <button
                                            type="button"
                                            className="action-btn warning"
                                            title="Check-in booking"
                                            onClick={() => handleCheckInBooking(booking)}
                                        >
                                          <CheckCircle size={16} />
                                        </button>
                                    )}

                                {String(booking.status || "").toLowerCase() ===
                                    "checked_in" && (
                                        <button
                                            type="button"
                                            className="action-btn warning"
                                            title="Bắt đầu rửa"
                                            onClick={() => handleStartWashBooking(booking)}
                                        >
                                          <PlayCircle size={16} />
                                        </button>
                                    )}

                                {String(booking.status || "").toLowerCase() ===
                                    "in_progress" && (
                                        <button
                                            type="button"
                                            className="action-btn complete"
                                            title="Hoàn thành booking"
                                            onClick={() => handleCompleteBooking(booking)}
                                        >
                                          <CheckCircle size={16} />
                                        </button>
                                    )}

                                {["pending", "confirmed"].includes(
                                    String(booking.status || "").toLowerCase()
                                ) && (
                                    <button
                                        type="button"
                                        className="action-btn cancel"
                                        title="Hủy booking"
                                        onClick={() => handleCancelBooking(booking)}
                                    >
                                      <XCircle size={16} />
                                    </button>
                                )}
                              </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>

                <div className="booking-pagination">
                  <div className="pagination-summary">
                    Hiển thị{" "}
                    <strong>
                      {firstVisibleItem}–{lastVisibleItem}
                    </strong>{" "}
                    trong tổng số{" "}
                    <strong>{totalElements}</strong> đơn
                  </div>

                  <div className="pagination-controls">
                    <button
                        type="button"
                        disabled={currentPage === 0}
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.max(prev - 1, 0)
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
                                      item - 1 === currentPage ? "active" : ""
                                    }
                                    onClick={() => setCurrentPage(item - 1)}
                                >
                                  {item}
                                </button>
                            ) : (
                                <span
                                    className="pagination-ellipsis"
                                    key={item}
                                >
                      …
                    </span>
                            )
                    )}

                    <button
                        type="button"
                        disabled={currentPage >= totalPages - 1}
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(
                                    prev + 1,
                                    totalPages - 1
                                )
                            )
                        }
                    >
                      Sau
                    </button>
                  </div>

                  <label className="page-size-control">
                    <span>Mỗi trang</span>

                    <select
                        value={pageSize}
                        onChange={(event) =>
                            setPageSize(Number(event.target.value))
                        }
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                </div>
              </>
          )}
        </div>
        {selectedBooking && (
            <div className="modal-backdrop">
              <div className="booking-detail-modal">
                <div className="modal-header">
                  <h2>Chi tiết đặt lịch</h2>
                  <button onClick={() => setSelectedBooking(null)}>×</button>
                </div>

                {detailLoading ? (
                    <div className="empty-state">Đang tải chi tiết...</div>
                ) : (
                    <div className="detail-content">
                      <p><strong>Mã đơn:</strong> {selectedBooking.bookingCode || "N/A"}</p>
                      <p><strong>Khách hàng:</strong> {selectedBooking.customerName || "N/A"}</p>
                      <p><strong>SĐT:</strong> {selectedBooking.customerPhone || "N/A"}</p>
                      <p><strong>Biển số:</strong> {selectedBooking.licensePlate || "N/A"}</p>
                      <p><strong>Chi nhánh:</strong> {selectedBooking.branchName || "N/A"}</p>
                      <p><strong>Trạng thái:</strong> {selectedBooking.status || "N/A"}</p>
                      <p>
                        <strong>Thời gian:</strong>{" "}
                        {selectedBooking.bookingDate
                            ? new Date(selectedBooking.bookingDate).toLocaleString("vi-VN")
                            : "N/A"}
                      </p>
                      <p><strong>Ghi chú:</strong> {selectedBooking.note || "Không có"}</p>
                      <p>
                        <strong>Tổng tiền:</strong>{" "}
                        {Number(selectedBooking.totalAmount || 0).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                )}
              </div>
            </div>
        )}

        {showCreateModal && (
            <div className="modal-backdrop">
              <div className="booking-form-modal">
                <div className="modal-header">
                  <h2>Tạo booking mới</h2>
                  <button type="button" onClick={() => setShowCreateModal(false)}>
                    ×
                  </button>
                </div>

                <form className="booking-admin-form" onSubmit={handleCreateBooking}>
                  <div className="booking-form-grid">
                    <div className="form-group full">
                      <label>Khách hàng *</label>

                      <select
                          name="customerId"
                          value={createForm.customerId}
                          onChange={handleCreateCustomerChange}
                          disabled={createOptionsLoading}
                          required
                      >
                        <option value="">
                          {createOptionsLoading
                              ? "Đang tải khách hàng..."
                              : "-- Chọn khách hàng --"}
                        </option>

                        {customers.map((customer) => (
                            <option
                                key={customer.customerId}
                                value={customer.customerId}
                            >
                              {customer.fullName || "Chưa có tên"}
                              {" — "}
                              {customer.phone || "Chưa có SĐT"}
                              {customer.email ? ` — ${customer.email}` : ""}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Chi nhánh *</label>

                      <select
                          name="branchId"
                          value={createForm.branchId}
                          onChange={handleCreateFieldChange}
                          disabled={createOptionsLoading}
                          required
                      >
                        <option value="">
                          {createOptionsLoading
                              ? "Đang tải chi nhánh..."
                              : "-- Chọn chi nhánh --"}
                        </option>

                        {branches.map((branch) => (
                            <option
                                key={branch.branchId}
                                value={branch.branchId}
                            >
                              {branch.branchName}
                              {branch.address ? ` — ${branch.address}` : ""}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Ngày đặt lịch *</label>

                      <input
                          type="date"
                          name="bookingDate"
                          min={getLocalToday()}
                          value={createForm.bookingDate}
                          onChange={handleCreateFieldChange}
                          required
                      />
                    </div>

                    <div className="form-group full">
                      <label>Khung giờ còn trống *</label>

                      <select
                          name="slotId"
                          value={createForm.slotId}
                          onChange={handleCreateFieldChange}
                          disabled={
                              !createForm.branchId ||
                              !createForm.bookingDate ||
                              slotsLoading
                          }
                          required
                      >
                        <option value="">
                          {slotsLoading
                              ? "Đang tải khung giờ..."
                              : !createForm.branchId
                                  ? "Vui lòng chọn chi nhánh trước"
                                  : !createForm.bookingDate
                                      ? "Vui lòng chọn ngày trước"
                                      : availableSlots.length === 0
                                          ? "Không còn khung giờ trống"
                                          : "-- Chọn khung giờ --"}
                        </option>

                        {availableSlots.map((slot) => {
                          const remainingCapacity = Math.max(
                              Number(slot.maxCapacity || 0) -
                              Number(slot.currentBookings || 0),
                              0
                          );

                          return (
                              <option
                                  key={slot.slotId}
                                  value={slot.slotId}
                              >
                                {formatTime(slot.startTime)}
                                {" - "}
                                {formatTime(slot.endTime)}
                                {slot.bayName ? ` — ${slot.bayName}` : ""}
                                {` — còn ${remainingCapacity} chỗ`}
                              </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group full">
                      <label>Xe của khách *</label>

                      <select
                          value={createForm.vehicleId}
                          onChange={handleCreateVehicleChange}
                          disabled={!createForm.customerId}
                          required
                      >
                        <option value="">
                          {!createForm.customerId
                              ? "Vui lòng chọn khách hàng trước"
                              : "-- Chọn xe --"}
                        </option>

                        {selectedCustomerVehicles.map((vehicle) => (
                            <option
                                key={vehicle.vehicleId || vehicle.id}
                                value={vehicle.vehicleId || vehicle.id}
                            >
                              {vehicle.licensePlate}
                              {" — "}
                              {vehicle.brand || "Chưa rõ hãng"}
                              {vehicle.model ? ` ${vehicle.model}` : ""}
                            </option>
                        ))}

                        {createForm.customerId && (
                            <option value="new">
                              + Nhập xe mới cho khách hàng
                            </option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Biển số xe *</label>

                      <input
                          name="licensePlate"
                          value={createForm.licensePlate}
                          onChange={handleCreateFieldChange}
                          placeholder="Ví dụ: 51A-123.45"
                          required
                      />
                    </div>

                    <div className="form-group">
                      <label>Hãng xe *</label>

                      <input
                          name="brand"
                          value={createForm.brand}
                          onChange={handleCreateFieldChange}
                          placeholder="Ví dụ: Toyota"
                          required
                      />
                    </div>

                    <div className="form-group">
                      <label>Model</label>

                      <input
                          name="model"
                          value={createForm.model}
                          onChange={handleCreateFieldChange}
                          placeholder="Ví dụ: Camry"
                      />
                    </div>

                    <div className="form-group">
                      <label>Loại xe *</label>

                      <select
                          name="vehicleType"
                          value={createForm.vehicleType}
                          onChange={handleCreateFieldChange}
                          required
                      >
                        <option value="4_seats">
                          Xe 4 chỗ
                        </option>

                        <option value="7_seats">
                          Xe 7 chỗ / SUV
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Phương thức thanh toán</label>

                      <select
                          name="paymentMethod"
                          value={createForm.paymentMethod}
                          onChange={handleCreateFieldChange}
                      >
                        <option value="offline">
                          Thanh toán tại quầy
                        </option>

                        <option value="online">
                          Thanh toán online
                        </option>
                      </select>
                    </div>

                    <div className="form-group full">
                      <label>Ghi chú</label>

                      <textarea
                          name="note"
                          maxLength={255}
                          rows={3}
                          value={createForm.note}
                          onChange={handleCreateFieldChange}
                          placeholder="Yêu cầu đặc biệt của khách hàng..."
                      />
                    </div>
                  </div>

                  <div className="booking-service-editor">
                    <div className="service-editor-header">
                      <h3>Dịch vụ</h3>
                      <button
                          type="button"
                          className="secondary-btn"
                          onClick={addServiceRow}
                      >
                        <Plus size={16} />
                        Thêm dịch vụ
                      </button>
                    </div>

                    {createForm.details.map((detail, index) => (
                        <div className="service-row" key={index}>
                          <div className="form-group">
                            <label>Dịch vụ *</label>

                            <select
                                value={detail.serviceId}
                                onChange={(e) =>
                                    handleCreateDetailChange(
                                        index,
                                        "serviceId",
                                        e.target.value
                                    )
                                }
                                required
                            >
                              <option value="">
                                -- Chọn dịch vụ --
                              </option>

                              {servicePackages.map((service) => (
                                  <option
                                      key={service.serviceId}
                                      value={service.serviceId}
                                  >
                                    {service.serviceName}
                                    {" — "}
                                    {formatMoney(service.basePrice)} đ
                                    {service.durationMinutes
                                        ? ` — ${service.durationMinutes} phút`
                                        : ""}
                                  </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Số lượng *</label>
                            <input
                                type="number"
                                min="1"
                                value={detail.quantity}
                                onChange={(e) =>
                                    handleCreateDetailChange(
                                        index,
                                        "quantity",
                                        e.target.value
                                    )
                                }
                                required
                            />
                          </div>

                          <button
                              type="button"
                              className="remove-service-btn"
                              disabled={createForm.details.length === 1}
                              onClick={() => removeServiceRow(index)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setShowCreateModal(false)}
                        disabled={creating}
                    >
                      Hủy
                    </button>
                    <button
                        type="submit"
                        className="refresh-btn"
                        disabled={creating}
                    >
                      {creating ? "Đang tạo..." : "Tạo booking"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {editingBooking && (
            <div className="modal-backdrop">
              <div className="booking-form-modal booking-edit-modal">
                <div className="modal-header">
                  <h2>
                    Chỉnh sửa {editingBooking.bookingCode || "booking"}
                  </h2>
                  <button type="button" onClick={() => setEditingBooking(null)}>
                    ×
                  </button>
                </div>

                <form className="booking-admin-form" onSubmit={handleUpdateBooking}>
                  <div className="booking-form-grid">
                    <div className="form-group full">
                      <label>Nhân viên phụ trách</label>

                      <select
                          value={editForm.assignedStaffId}
                          onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                assignedStaffId: e.target.value,
                              }))
                          }
                          disabled={staffLoading}
                      >
                        <option value="">
                          {staffLoading
                              ? "Đang tải danh sách nhân viên..."
                              : assignableStaff.length === 0
                                  ? "Không có nhân viên active tại chi nhánh"
                                  : "-- Chọn nhân viên phụ trách --"}
                        </option>

                        {assignableStaff.map((employee) => (
                            <option
                                key={employee.employeeId}
                                value={employee.employeeId}
                            >
                              {employee.fullName || "Chưa có tên"}
                              {employee.phone ? ` — ${employee.phone}` : ""}
                              {employee.role ? ` — ${employee.role}` : ""}
                            </option>
                        ))}
                      </select>

                      {!staffLoading && assignableStaff.length > 0 && (
                          <small className="form-help-text">
                            Chỉ hiển thị nhân viên đang hoạt động và thuộc đúng chi nhánh.
                          </small>
                      )}
                    </div>

                    <div className="form-group full">
                      <label>Ghi chú</label>
                      <textarea
                          maxLength={255}
                          rows={4}
                          value={editForm.note}
                          onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                note: e.target.value,
                              }))
                          }
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setEditingBooking(null)}
                        disabled={updating}
                    >
                      Hủy
                    </button>
                    <button
                        type="submit"
                        className="refresh-btn"
                        disabled={updating}
                    >
                      {updating ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}