import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CircleCheckBig,
  CircleX,
  Clock3,
  Eye,
  ReceiptText,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import paymentApi from "../../../api/paymentApi";
import bookingApi from "../../../api/bookingApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";

import "./PaymentHistoryPage.css";

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

function unwrapObject(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateTime(value) {
  const date = parseDate(value);

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

function getPaymentStatusLabel(status) {
  switch (normalizeValue(status)) {
    case "paid":
      return "Đã thanh toán";

    case "unpaid":
      return "Chưa thanh toán";

    case "failed":
      return "Thất bại";

    case "cancelled":
      return "Đã hủy";

    default:
      return status || "N/A";
  }
}

function getPaymentStatusClass(status) {
  switch (normalizeValue(status)) {
    case "paid":
      return "paid";

    case "unpaid":
      return "unpaid";

    case "failed":
      return "failed";

    case "cancelled":
      return "cancelled";

    default:
      return "default";
  }
}

function getPaymentMethodLabel(method) {
  switch (normalizeValue(method)) {
    case "cash":
      return "Tiền mặt";

    case "bank_transfer":
      return "Chuyển khoản";

    case "pos":
      return "Máy POS";

    case "paypal":
      return "PayPal";

    default:
      return method || "N/A";
  }
}

function getBookingStatusLabel(status) {
  switch (normalizeValue(status)) {
    case "pending":
      return "Chờ xác nhận";

    case "confirmed":
      return "Đã xác nhận";

    case "checked_in":
      return "Đã tiếp nhận";

    case "in_progress":
      return "Đang thực hiện";

    case "completed":
      return "Hoàn thành";

    case "cancelled":
      return "Đã hủy";

    case "no_show":
      return "Khách không đến";

    default:
      return status || "N/A";
  }
}

function getPaymentMainDate(payment) {
  return (
    parseDate(payment.paidAt) ||
    parseDate(payment.createdAt) ||
    parseDate(payment.updatedAt)
  );
}

function getTransactionReference(payment) {
  if (payment.vnpayTransactionNo) {
    return payment.vnpayTransactionNo;
  }

  if (payment.paypalCaptureId) {
    return payment.paypalCaptureId;
  }

  if (payment.paypalOrderId) {
    return payment.paypalOrderId;
  }

  return "Chưa có";
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

export default function PaymentHistoryPage() {
  const { showMessage } = useAppDialog();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);

    try {
      const [paymentResponse, bookingResponse] = await Promise.all([
        paymentApi.list(),
        bookingApi.adminList(),
      ]);

      const paymentList = unwrapList(paymentResponse);
      const bookingList = unwrapList(bookingResponse);

      const bookingMap = new Map(
        bookingList.map((booking) => [
          Number(booking.bookingId),
          booking,
        ])
      );

      const mergedPayments = paymentList
        .map((payment) => {
          const booking = bookingMap.get(
            Number(payment.bookingId)
          );

          return {
            ...payment,

            customerName:
              booking?.customerName || "N/A",

            licensePlate:
              booking?.licensePlate || "N/A",

            branchName:
              booking?.branchName || "N/A",

            bookingStatus:
              booking?.status || null,

            bookingDate:
              booking?.bookingDate || null,

            slotDate:
              booking?.slotDate || null,

            slotStartTime:
              booking?.slotStartTime || null,
          };
        })
        .sort((firstPayment, secondPayment) => {
          const firstTime =
            getPaymentMainDate(firstPayment)?.getTime() || 0;

          const secondTime =
            getPaymentMainDate(secondPayment)?.getTime() || 0;

          if (secondTime !== firstTime) {
            return secondTime - firstTime;
          }

          return (
            Number(secondPayment.paymentId || 0) -
            Number(firstPayment.paymentId || 0)
          );
        });

      setPayments(mergedPayments);

      console.log("ADMIN PAYMENT HISTORY:", mergedPayments);
    } catch (error) {
      console.error("Load payment history failed:", error);

      setPayments([]);

      await showMessage({
        title: "Tải lịch sử thanh toán thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được lịch sử thanh toán.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const statistics = useMemo(() => {
    return payments.reduce(
      (result, payment) => {
        const status = normalizeValue(
          payment.paymentStatus
        );

        result.totalTransactions += 1;

        if (status === "paid") {
          result.paidCount += 1;
          result.totalRevenue += Number(
            payment.finalAmount || 0
          );
        }

        if (status === "unpaid") {
          result.unpaidCount += 1;
          result.unpaidAmount += Number(
            payment.finalAmount || 0
          );
        }

        if (status === "failed") {
          result.failedCount += 1;
        }

        if (status === "cancelled") {
          result.cancelledCount += 1;
        }

        return result;
      },
      {
        totalTransactions: 0,
        totalRevenue: 0,
        paidCount: 0,
        unpaidCount: 0,
        unpaidAmount: 0,
        failedCount: 0,
        cancelledCount: 0,
      }
    );
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const normalizedKeyword = normalizeValue(keyword);

    const startDate = fromDate
      ? new Date(`${fromDate}T00:00:00`)
      : null;

    const endDate = toDate
      ? new Date(`${toDate}T23:59:59`)
      : null;

    return payments.filter((payment) => {
      const searchableText = [
        payment.paymentId,
        payment.bookingCode,
        payment.customerName,
        payment.licensePlate,
        payment.branchName,
        payment.paymentMethod,
        payment.paymentStatus,
        payment.vnpayTransactionNo,
        payment.paypalOrderId,
        payment.paypalCaptureId,
        payment.paypalPayerEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        !normalizedKeyword ||
        searchableText.includes(normalizedKeyword);

      const matchesStatus =
        statusFilter === "all" ||
        normalizeValue(payment.paymentStatus) ===
        statusFilter;

      const matchesMethod =
        methodFilter === "all" ||
        normalizeValue(payment.paymentMethod) ===
        methodFilter;

      const paymentDate = getPaymentMainDate(payment);

      const matchesFromDate =
        !startDate ||
        (paymentDate &&
          paymentDate.getTime() >= startDate.getTime());

      const matchesToDate =
        !endDate ||
        (paymentDate &&
          paymentDate.getTime() <= endDate.getTime());

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesMethod &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    payments,
    keyword,
    statusFilter,
    methodFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword,
    statusFilter,
    methodFilter,
    fromDate,
    toDate,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPayments = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    return filteredPayments.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [
    filteredPayments,
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
    filteredPayments.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastVisibleItem = Math.min(
    currentPage * pageSize,
    filteredPayments.length
  );

  async function handleViewPayment(payment) {
    if (!payment.paymentId) {
      if (!payment.paymentId) {
        await showMessage({
          title: "Không thể mở thanh toán",
          message: "Không tìm thấy paymentId.",
          variant: "warning",
        });
        return;
      }
      return;
    }

    setSelectedPayment(payment);
    setSelectedBooking(null);
    setDetailLoading(true);

    try {
      const requests = [
        paymentApi.detail(payment.paymentId),
      ];

      if (payment.bookingId) {
        requests.push(
          bookingApi.adminDetail(payment.bookingId)
        );
      }

      const responses = await Promise.all(requests);

      const paymentDetail = unwrapObject(responses[0]);
      const bookingDetail = responses[1]
        ? unwrapObject(responses[1])
        : null;

      setSelectedPayment({
        ...payment,
        ...paymentDetail,
      });

      setSelectedBooking(bookingDetail);
    } catch (error) {
      console.error("Load payment detail failed:", error);

      await showMessage({
        title: "Tải chi tiết thanh toán thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được chi tiết thanh toán.",
        variant: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetailModal() {
    setSelectedPayment(null);
    setSelectedBooking(null);
    setDetailLoading(false);
  }

  function clearFilters() {
    setKeyword("");
    setStatusFilter("all");
    setMethodFilter("all");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="payment-history-page">
      <div className="payment-history-header">
        <div>
          <h1>Lịch sử thanh toán</h1>

          <p>
            Theo dõi doanh thu, công nợ và đối soát
            các giao dịch của hệ thống.
          </p>
        </div>

        <button
          type="button"
          className="payment-refresh-btn"
          onClick={loadPayments}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={loading ? "payment-spinning" : ""}
          />

          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="payment-stat-grid">
        <div className="payment-stat-card revenue">
          <div className="payment-stat-icon">
            <Banknote size={24} />
          </div>

          <div>
            <span>Tổng thực thu</span>

            <strong>
              {formatMoney(statistics.totalRevenue)} đ
            </strong>

            <small>
              {statistics.paidCount} giao dịch thành công
            </small>
          </div>
        </div>

        <div className="payment-stat-card unpaid">
          <div className="payment-stat-icon">
            <Clock3 size={24} />
          </div>

          <div>
            <span>Công nợ chưa thu</span>

            <strong>
              {formatMoney(statistics.unpaidAmount)} đ
            </strong>

            <small>
              {statistics.unpaidCount} giao dịch chưa thanh toán
            </small>
          </div>
        </div>

        <div className="payment-stat-card paid">
          <div className="payment-stat-icon">
            <CircleCheckBig size={24} />
          </div>

          <div>
            <span>Đã thanh toán</span>
            <strong>{statistics.paidCount}</strong>
            <small>Giao dịch thành công</small>
          </div>
        </div>

        <div className="payment-stat-card failed">
          <div className="payment-stat-icon">
            <CircleX size={24} />
          </div>

          <div>
            <span>Thất bại / Đã hủy</span>

            <strong>
              {statistics.failedCount +
                statistics.cancelledCount}
            </strong>

            <small>
              {statistics.failedCount} thất bại ·{" "}
              {statistics.cancelledCount} đã hủy
            </small>
          </div>
        </div>

        <div className="payment-stat-card total">
          <div className="payment-stat-icon">
            <ReceiptText size={24} />
          </div>

          <div>
            <span>Tổng giao dịch</span>
            <strong>{statistics.totalTransactions}</strong>
            <small>Tất cả bản ghi thanh toán</small>
          </div>
        </div>
      </div>

      <div className="payment-filter-card">
        <div className="payment-filter-row">
          <div className="payment-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Tìm mã thanh toán, booking, khách hàng, biển số..."
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
            />
          </div>

          <select
            className="payment-filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">
              Tất cả trạng thái
            </option>

            <option value="paid">
              Đã thanh toán
            </option>

            <option value="unpaid">
              Chưa thanh toán
            </option>

            <option value="failed">
              Thất bại
            </option>

            <option value="cancelled">
              Đã hủy
            </option>
          </select>

          <select
            className="payment-filter-select"
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(event.target.value)
            }
          >
            <option value="all">
              Tất cả phương thức
            </option>

            <option value="cash">
              Tiền mặt
            </option>

            <option value="bank_transfer">
              Chuyển khoản
            </option>

            <option value="pos">
              Máy POS
            </option>

            <option value="paypal">
              PayPal
            </option>
          </select>
        </div>

        <div className="payment-date-row">
          <div className="payment-date-field">
            <label>Từ ngày</label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
            />
          </div>

          <div className="payment-date-field">
            <label>Đến ngày</label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
            />
          </div>

          <button
            type="button"
            className="payment-clear-filter-btn"
            onClick={clearFilters}
          >
            Xóa bộ lọc
          </button>

          <div className="payment-filter-result">
            Hiển thị{" "}
            <strong>{filteredPayments.length}</strong> /{" "}
            {payments.length} giao dịch
          </div>
        </div>
      </div>

      <div className="payment-table-card">
        {loading ? (
          <div className="payment-empty-state">
            Đang tải lịch sử thanh toán...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="payment-empty-state">
            Không có giao dịch phù hợp.
          </div>
        ) : (
          <>
            <div className="payment-table-wrap">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã thanh toán</th>
                    <th>Mã booking</th>
                    <th>Khách hàng</th>
                    <th>Chi nhánh</th>
                    <th>Tiền gốc</th>
                    <th>Giảm giá</th>
                    <th>Thực thu</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPayments.map(
                    (payment, index) => (
                      <tr key={payment.paymentId}>
                        <td>
                          {(currentPage - 1) * pageSize +
                            index +
                            1}
                        </td>

                        <td>
                          <strong className="payment-id">
                            PAY-{payment.paymentId}
                          </strong>
                        </td>

                        <td>
                          <div className="payment-booking-cell">
                            <strong>
                              {payment.bookingCode || "N/A"}
                            </strong>

                            <small>
                              {payment.licensePlate || "N/A"}
                            </small>
                          </div>
                        </td>

                        <td>
                          {payment.customerName || "N/A"}
                        </td>

                        <td>
                          {payment.branchName || "N/A"}
                        </td>

                        <td>
                          {formatMoney(
                            payment.originalAmount
                          )}{" "}
                          đ
                        </td>

                        <td>
                          <span className="payment-discount-value">
                            -
                            {formatMoney(
                              payment.discountAmount
                            )}{" "}
                            đ
                          </span>
                        </td>

                        <td>
                          <strong className="payment-final-value">
                            {formatMoney(
                              payment.finalAmount
                            )}{" "}
                            đ
                          </strong>
                        </td>

                        <td>
                          <span className="payment-method-badge">
                            {getPaymentMethodLabel(
                              payment.paymentMethod
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`payment-history-status ${getPaymentStatusClass(
                              payment.paymentStatus
                            )}`}
                          >
                            {getPaymentStatusLabel(
                              payment.paymentStatus
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="payment-time-cell">
                            <strong>
                              {formatDateTime(
                                payment.paidAt ||
                                payment.createdAt
                              )}
                            </strong>

                            <small>
                              {payment.paidAt
                                ? "Thời gian thanh toán"
                                : "Thời gian tạo"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="payment-view-btn"
                            title="Xem chi tiết giao dịch"
                            onClick={() =>
                              handleViewPayment(payment)
                            }
                          >
                            <Eye size={17} />
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <div className="payment-pagination">
              <div className="payment-pagination-summary">
                Hiển thị{" "}
                <strong>
                  {firstVisibleItem}–{lastVisibleItem}
                </strong>{" "}
                trong tổng số{" "}
                <strong>
                  {filteredPayments.length}
                </strong>{" "}
                giao dịch
              </div>

              <div className="payment-pagination-controls">
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
                      onClick={() =>
                        setCurrentPage(item)
                      }
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      className="payment-pagination-ellipsis"
                      key={item}
                    >
                      …
                    </span>
                  )
                )}

                <button
                  type="button"
                  disabled={
                    currentPage === totalPages
                  }
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

              <label className="payment-page-size-control">
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

      {selectedPayment && (
        <div
          className="payment-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetailModal();
            }
          }}
        >
          <div className="payment-detail-modal">
            <div className="payment-modal-header">
              <div>
                <span>Chi tiết giao dịch</span>

                <h2>
                  PAY-{selectedPayment.paymentId}
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
              <div className="payment-empty-state">
                Đang tải chi tiết giao dịch...
              </div>
            ) : (
              <div className="payment-detail-content">
                <section className="payment-detail-section payment-summary-section">
                  <div>
                    <span>Số tiền thực thu</span>

                    <strong>
                      {formatMoney(
                        selectedPayment.finalAmount
                      )}{" "}
                      đ
                    </strong>
                  </div>

                  <span
                    className={`payment-history-status large ${getPaymentStatusClass(
                      selectedPayment.paymentStatus
                    )}`}
                  >
                    {getPaymentStatusLabel(
                      selectedPayment.paymentStatus
                    )}
                  </span>
                </section>

                <section className="payment-detail-section">
                  <h3>Thông tin thanh toán</h3>

                  <div className="payment-detail-grid">
                    <div>
                      <span>Mã thanh toán</span>
                      <strong>
                        PAY-{selectedPayment.paymentId}
                      </strong>
                    </div>

                    <div>
                      <span>Mã booking</span>
                      <strong>
                        {selectedPayment.bookingCode ||
                          "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Phương thức</span>
                      <strong>
                        {getPaymentMethodLabel(
                          selectedPayment.paymentMethod
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Trạng thái</span>
                      <strong>
                        {getPaymentStatusLabel(
                          selectedPayment.paymentStatus
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Ngày tạo</span>
                      <strong>
                        {formatDateTime(
                          selectedPayment.createdAt
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Ngày thanh toán</span>
                      <strong>
                        {formatDateTime(
                          selectedPayment.paidAt
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Mã giao dịch</span>
                      <strong>
                        {getTransactionReference(
                          selectedPayment
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Cập nhật lần cuối</span>
                      <strong>
                        {formatDateTime(
                          selectedPayment.updatedAt
                        )}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="payment-detail-section">
                  <h3>Chi tiết số tiền</h3>

                  <div className="payment-money-list">
                    <div>
                      <span>Tiền gốc</span>

                      <strong>
                        {formatMoney(
                          selectedPayment.originalAmount
                        )}{" "}
                        đ
                      </strong>
                    </div>

                    <div>
                      <span>Giảm từ khuyến mãi</span>

                      <strong>
                        -
                        {formatMoney(
                          selectedPayment.promoDiscount
                        )}{" "}
                        đ
                      </strong>
                    </div>

                    <div>
                      <span>Giảm từ voucher</span>

                      <strong>
                        -
                        {formatMoney(
                          selectedPayment.voucherDiscount
                        )}{" "}
                        đ
                      </strong>
                    </div>

                    <div>
                      <span>Ưu đãi thanh toán online</span>

                      <strong>
                        -
                        {formatMoney(
                          selectedPayment.onlineDiscount
                        )}{" "}
                        đ
                      </strong>
                    </div>

                    <div>
                      <span>Ưu đãi hạng thành viên</span>

                      <strong>
                        -
                        {formatMoney(
                          selectedPayment.tierDiscount
                        )}{" "}
                        đ
                      </strong>
                    </div>

                    <div className="total-discount">
                      <span>Tổng giảm giá</span>

                      <strong>
                        -
                        {formatMoney(
                          selectedPayment.discountAmount
                        )}{" "}
                        đ
                      </strong>
                    </div>

                    <div className="final-amount">
                      <span>Thực thu</span>

                      <strong>
                        {formatMoney(
                          selectedPayment.finalAmount
                        )}{" "}
                        đ
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="payment-detail-section">
                  <h3>Thông tin khách hàng và booking</h3>

                  <div className="payment-detail-grid">
                    <div>
                      <span>Khách hàng</span>

                      <strong>
                        {selectedBooking?.customerName ||
                          selectedPayment.customerName ||
                          "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Số điện thoại</span>

                      <strong>
                        {selectedBooking?.customerPhone ||
                          "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Biển số xe</span>

                      <strong>
                        {selectedBooking?.licensePlate ||
                          selectedPayment.licensePlate ||
                          "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Chi nhánh</span>

                      <strong>
                        {selectedBooking?.branchName ||
                          selectedPayment.branchName ||
                          "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Trạng thái booking</span>

                      <strong>
                        {getBookingStatusLabel(
                          selectedBooking?.status ||
                          selectedPayment.bookingStatus
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Nhân viên phụ trách</span>

                      <strong>
                        {selectedBooking?.assignedStaffName ||
                          "Chưa phân công"}
                      </strong>
                    </div>
                  </div>
                </section>

                {(selectedPayment.vnpayTransactionNo ||
                  selectedPayment.vnpayBankCode ||
                  selectedPayment.vnpayCardType ||
                  selectedPayment.vnpayResponseCode) && (
                    <section className="payment-detail-section">
                      <h3>Thông tin VNPay</h3>

                      <div className="payment-detail-grid">
                        <div>
                          <span>Mã giao dịch</span>

                          <strong>
                            {selectedPayment.vnpayTransactionNo ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>Ngân hàng</span>

                          <strong>
                            {selectedPayment.vnpayBankCode ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>Loại thẻ</span>

                          <strong>
                            {selectedPayment.vnpayCardType ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>Mã phản hồi</span>

                          <strong>
                            {selectedPayment.vnpayResponseCode ||
                              "N/A"}
                          </strong>
                        </div>
                      </div>
                    </section>
                  )}

                {(selectedPayment.paypalOrderId ||
                  selectedPayment.paypalCaptureId ||
                  selectedPayment.paypalPayerEmail) && (
                    <section className="payment-detail-section">
                      <h3>Thông tin PayPal</h3>

                      <div className="payment-detail-grid">
                        <div>
                          <span>PayPal Order ID</span>

                          <strong>
                            {selectedPayment.paypalOrderId ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>Capture ID</span>

                          <strong>
                            {selectedPayment.paypalCaptureId ||
                              "N/A"}
                          </strong>
                        </div>

                        <div className="full">
                          <span>Email người thanh toán</span>

                          <strong>
                            {selectedPayment.paypalPayerEmail ||
                              "N/A"}
                          </strong>
                        </div>
                      </div>
                    </section>
                  )}

                <section className="payment-detail-section">
                  <h3>Ưu đãi đã áp dụng</h3>

                  <div className="payment-detail-grid">
                    <div>
                      <span>Khuyến mãi</span>

                      <strong>
                        {selectedPayment.promotionName ||
                          "Không áp dụng"}
                      </strong>
                    </div>

                    <div>
                      <span>Voucher / phần thưởng</span>

                      <strong>
                        {selectedPayment.rewardName ||
                          "Không áp dụng"}
                      </strong>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}