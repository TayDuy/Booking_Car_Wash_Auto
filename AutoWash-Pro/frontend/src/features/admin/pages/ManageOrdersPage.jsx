import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Search,
  RefreshCw,
  ClipboardList,
  Clock3,
  CircleCheckBig,
  WalletCards,
  X,
} from "lucide-react";

import bookingApi from "../../../api/bookingApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import "./ManageOrdersPage.css";

const ORDER_STATUSES = [
  "checked_in",
  "in_progress",
  "completed",
];

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

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function getOrderDateValue(order) {
  if (order.slotDate) {
    const time = order.slotStartTime || "00:00:00";
    const date = new Date(`${order.slotDate}T${time}`);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (order.startTime) {
    const date = new Date(order.startTime);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (order.bookingDate) {
    const date = new Date(order.bookingDate);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function formatOrderDate(order) {
  const date = getOrderDateValue(order);

  if (!date) {
    return "N/A";
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getOrderStatusLabel(status) {
  const normalizedStatus = normalizeValue(status);

  switch (normalizedStatus) {
    case "checked_in":
      return "Đã tiếp nhận";

    case "in_progress":
      return "Đang thực hiện";

    case "completed":
      return "Hoàn thành";

    default:
      return status || "N/A";
  }
}

function getOrderStatusClass(status) {
  const normalizedStatus = normalizeValue(status);

  switch (normalizedStatus) {
    case "checked_in":
      return "received";

    case "in_progress":
      return "processing";

    case "completed":
      return "completed";

    default:
      return "default";
  }
}

function getPaymentStatusLabel(status) {
  const normalizedStatus = normalizeValue(status);

  switch (normalizedStatus) {
    case "paid":
      return "Đã thanh toán";

    case "unpaid":
      return "Chưa thanh toán";

    case "failed":
      return "Thất bại";

    case "cancelled":
      return "Đã hủy";

    default:
      return "Chưa tạo thanh toán";
  }
}

function getPaymentStatusClass(status) {
  const normalizedStatus = normalizeValue(status);

  switch (normalizedStatus) {
    case "paid":
      return "paid";

    case "unpaid":
      return "unpaid";

    case "failed":
      return "failed";

    case "cancelled":
      return "cancelled";

    default:
      return "not-created";
  }
}

function getPaymentMethodLabel(method) {
  const normalizedMethod = normalizeValue(method);

  switch (normalizedMethod) {
    case "cash":
      return "Tiền mặt";

    case "bank_transfer":
      return "Chuyển khoản";

    case "pos":
      return "POS";

    case "paypal":
      return "PayPal";

    case "offline":
      return "Tại quầy";

    case "online":
      return "Online";

    default:
      return "Chưa xác định";
  }
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

export default function ManageOrdersPage() {
  const { showMessage } = useAppDialog();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0, received: 0, processing: 0, completed: 0, totalValue: 0,
  });

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [currentPage, pageSize]);

  async function loadOrders() {
    setLoading(true);

    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        bookingApi.adminListOrders({ page: currentPage, size: pageSize }),
        bookingApi.adminOrderStatistics(),
      ]);

      const body = ordersResponse.data?.data || ordersResponse.data || {};
      const content = body.content || [];
      setOrders(Array.isArray(content) ? content : []);
      if (body.totalPages !== undefined) setTotalPages(body.totalPages || 1);
      if (body.totalElements !== undefined) setTotalElements(body.totalElements);

      const statsBody = statsResponse.data?.data || statsResponse.data || {};
      setStatistics({
        total: statsBody.total || 0,
        received: statsBody.checkedIn || 0,
        processing: statsBody.inProgress || 0,
        completed: statsBody.completed || 0,
        totalValue: statsBody.totalValue || 0,
      });
    } catch (error) {
      console.error("Load admin orders failed:", error);

      setOrders([]);

      await showMessage({
        title: "Tải đơn hàng thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được danh sách đơn hàng.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedKeyword = normalizeValue(keyword);

    return orders.filter((order) => {
      const searchableText = [
        order.bookingCode,
        order.customerName,
        order.licensePlate,
        order.vehicleNickname,
        order.branchName,
        order.status,
        order.paymentStatus,
        order.paymentMethod,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        !normalizedKeyword ||
        searchableText.includes(normalizedKeyword);

      const matchesStatus =
        statusFilter === "all" ||
        normalizeValue(order.status) === statusFilter;

      const normalizedPaymentStatus = normalizeValue(
        order.paymentStatus
      );

      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "not_created"
          ? !normalizedPaymentStatus
          : normalizedPaymentStatus === paymentFilter);

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    keyword,
    statusFilter,
    paymentFilter,
  ]);

  useEffect(() => {
    setCurrentPage(0);
  }, [
    keyword,
    statusFilter,
    paymentFilter,
    pageSize,
  ]);

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    return filteredOrders;
  }, [filteredOrders]);

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

  async function handleViewOrder(order) {
    const bookingId = order.bookingId || order.id;

    if (!bookingId) {
      await showMessage({
        title: "Không thể mở đơn hàng",
        message: "Không tìm thấy bookingId của đơn hàng.",
        variant: "warning",
      });
      return;
    }

    setSelectedOrder(order);
    setDetailLoading(true);

    try {
      const response =
        await bookingApi.adminDetail(bookingId);

      const detail =
        response.data?.data || response.data;

      setSelectedOrder(detail);
    } catch (error) {
      console.error("Load order detail failed:", error);

      await showMessage({
        title: "Tải chi tiết thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được chi tiết đơn hàng.",
        variant: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetailModal() {
    setSelectedOrder(null);
    setDetailLoading(false);
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>Quản lý đơn hàng</h1>

          <p>
            Theo dõi các xe đã tiếp nhận, đang thực hiện
            dịch vụ và đã hoàn thành.
          </p>
        </div>

        <button
          type="button"
          className="orders-refresh-btn"
          onClick={loadOrders}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={loading ? "is-spinning" : ""}
          />

          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="orders-stat-grid">
        <div className="orders-stat-card">
          <div className="orders-stat-icon total">
            <ClipboardList size={23} />
          </div>

          <div>
            <span>Tổng đơn dịch vụ</span>
            <strong>{statistics.total}</strong>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon received">
            <Clock3 size={23} />
          </div>

          <div>
            <span>Đã tiếp nhận</span>
            <strong>{statistics.received}</strong>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon processing">
            <RefreshCw size={23} />
          </div>

          <div>
            <span>Đang thực hiện</span>
            <strong>{statistics.processing}</strong>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon completed">
            <CircleCheckBig size={23} />
          </div>

          <div>
            <span>Đã hoàn thành</span>
            <strong>{statistics.completed}</strong>
          </div>
        </div>

        <div className="orders-stat-card value-card">
          <div className="orders-stat-icon value">
            <WalletCards size={23} />
          </div>

          <div>
            <span>Tổng giá trị dịch vụ</span>

            <strong>
              {formatMoney(statistics.totalValue)} đ
            </strong>
          </div>
        </div>
      </div>

      <div className="orders-toolbar">
        <div className="orders-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Tìm mã đơn, khách hàng, biển số, chi nhánh..."
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
          />
        </div>

        <select
          className="orders-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            Tất cả trạng thái đơn
          </option>

          <option value="checked_in">
            Đã tiếp nhận
          </option>

          <option value="in_progress">
            Đang thực hiện
          </option>

          <option value="completed">
            Hoàn thành
          </option>
        </select>

        <select
          className="orders-filter"
          value={paymentFilter}
          onChange={(event) =>
            setPaymentFilter(event.target.value)
          }
        >
          <option value="all">
            Tất cả thanh toán
          </option>

          <option value="not_created">
            Chưa tạo thanh toán
          </option>

          <option value="unpaid">
            Chưa thanh toán
          </option>

          <option value="paid">
            Đã thanh toán
          </option>

          <option value="failed">
            Thanh toán thất bại
          </option>

          <option value="cancelled">
            Thanh toán đã hủy
          </option>
        </select>
      </div>

      <div className="orders-card">
        {loading ? (
          <div className="orders-empty-state">
            Đang tải danh sách đơn hàng...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            Không có đơn hàng phù hợp.
          </div>
        ) : (
          <>
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Biển số</th>
                    <th>Chi nhánh</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order, index) => (
                    <tr
                      key={
                        order.bookingId ||
                        order.bookingCode ||
                        index
                      }
                    >
                      <td>
                        {currentPage * pageSize +
                          index +
                          1}
                      </td>

                      <td>
                        <strong className="orders-code">
                          {order.bookingCode || "N/A"}
                        </strong>
                      </td>

                      <td>
                        {order.customerName || "N/A"}
                      </td>

                      <td>
                        <span className="orders-license-plate">
                          {order.licensePlate || "N/A"}
                        </span>
                      </td>

                      <td>
                        {order.branchName || "N/A"}
                      </td>

                      <td>
                        {formatOrderDate(order)}
                      </td>

                      <td>
                        <span
                          className={`order-status-badge ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatMoney(order.finalAmount || order.totalAmount)} đ
                        </strong>
                      </td>

                      <td>
                        <div className="orders-payment-cell">
                          <span
                            className={`payment-status-badge ${getPaymentStatusClass(
                              order.paymentStatus
                            )}`}
                          >
                            {getPaymentStatusLabel(
                              order.paymentStatus
                            )}
                          </span>

                          {order.paymentMethod && (
                            <small>
                              {getPaymentMethodLabel(
                                order.paymentMethod
                              )}
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="orders-view-btn"
                          title="Xem chi tiết đơn hàng"
                          onClick={() =>
                            handleViewOrder(order)
                          }
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="orders-pagination">
              <div className="orders-pagination-summary">
                Hiển thị{" "}
                <strong>
                  {firstVisibleItem}–{lastVisibleItem}
                </strong>{" "}
                trong tổng số{" "}
                <strong>
                  {totalElements}
                </strong>{" "}
                đơn
              </div>

              <div className="orders-pagination-controls">
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
                        item - 1 === currentPage
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(item - 1)
                      }
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      className="orders-pagination-ellipsis"
                      key={item}
                    >
                      …
                    </span>
                  )
                )}

                <button
                  type="button"
                  disabled={
                    currentPage >= totalPages - 1
                  }
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

              <label className="orders-page-size-control">
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
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
        <div
          className="orders-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetailModal();
            }
          }}
        >
          <div className="orders-detail-modal">
            <div className="orders-modal-header">
              <div>
                <span>Chi tiết đơn hàng</span>

                <h2>
                  {selectedOrder.bookingCode || "Đơn hàng"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetailModal}
                aria-label="Đóng"
              >
                <X size={21} />
              </button>
            </div>

            {detailLoading ? (
              <div className="orders-empty-state">
                Đang tải chi tiết đơn hàng...
              </div>
            ) : (
              <div className="orders-detail-content">
                <section className="orders-detail-section">
                  <h3>Thông tin đơn hàng</h3>

                  <div className="orders-detail-grid">
                    <div>
                      <span>Mã đơn</span>
                      <strong>
                        {selectedOrder.bookingCode || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Trạng thái</span>

                      <strong>
                        {getOrderStatusLabel(
                          selectedOrder.status
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Thời gian đặt</span>

                      <strong>
                        {formatOrderDate(selectedOrder)}
                      </strong>
                    </div>

                    <div>
                      <span>Nhân viên phụ trách</span>

                      <strong>
                        {selectedOrder.assignedStaffName ||
                          "Chưa phân công"}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="orders-detail-section">
                  <h3>Khách hàng và xe</h3>

                  <div className="orders-detail-grid">
                    <div>
                      <span>Khách hàng</span>

                      <strong>
                        {selectedOrder.customerName || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Số điện thoại</span>

                      <strong>
                        {selectedOrder.customerPhone || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Biển số xe</span>

                      <strong>
                        {selectedOrder.licensePlate || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Loại xe</span>

                      <strong>
                        {selectedOrder.vehicleType || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Chi nhánh</span>

                      <strong>
                        {selectedOrder.branchName || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Khung giờ</span>

                      <strong>
                        {selectedOrder.slotStartTime &&
                          selectedOrder.slotEndTime
                          ? `${String(
                            selectedOrder.slotStartTime
                          ).slice(0, 5)} - ${String(
                            selectedOrder.slotEndTime
                          ).slice(0, 5)}`
                          : "N/A"}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="orders-detail-section">
                  <h3>Dịch vụ</h3>

                  {Array.isArray(selectedOrder.details) &&
                    selectedOrder.details.length > 0 ? (
                    <div className="orders-service-list">
                      {selectedOrder.details.map(
                        (detail, index) => (
                          <div
                            className="orders-service-item"
                            key={
                              detail.bookingDetailId ||
                              `${detail.serviceId}-${index}`
                            }
                          >
                            <div>
                              <strong>
                                {detail.serviceName ||
                                  "Dịch vụ"}
                              </strong>

                              <small>
                                {formatMoney(
                                  detail.unitPrice
                                )}{" "}
                                đ × {detail.quantity || 1}
                              </small>
                            </div>

                            <strong>
                              {formatMoney(
                                detail.subTotal
                              )}{" "}
                              đ
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="orders-no-services">
                      Chưa có dữ liệu dịch vụ.
                    </div>
                  )}

                  <div className="orders-total-row">
                    <span>Thành tiền thanh toán</span>

                    <strong>
                      {formatMoney(
                        selectedOrder.finalAmount || selectedOrder.totalAmount
                      )}{" "}
                      đ
                    </strong>
                  </div>
                </section>

                <section className="orders-detail-section">
                  <h3>Thanh toán</h3>

                  <div className="orders-detail-grid">
                    <div>
                      <span>Trạng thái</span>

                      <strong>
                        {getPaymentStatusLabel(
                          selectedOrder.paymentStatus
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Phương thức</span>

                      <strong>
                        {getPaymentMethodLabel(
                          selectedOrder.paymentMethod
                        )}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="orders-detail-section">
                  <h3>Ghi chú</h3>

                  <p className="orders-note">
                    {selectedOrder.note ||
                      "Không có ghi chú."}
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}