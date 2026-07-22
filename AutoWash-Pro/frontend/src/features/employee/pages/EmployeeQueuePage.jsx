import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, Droplets, X } from "lucide-react";

import employeeApi from "../../../api/employeeApi";
import * as washBayService from "../../../api/washBayService";
import EmployeeBookingCard from "../components/EmployeeBookingCard";
import EmployeeBookingSearch from "../components/EmployeeBookingSearch";
import EmployeeQueueFilters from "../components/EmployeeQueueFilters";
import EmployeeBookingDetailModal from "../components/EmployeeBookingDetailModal";

import "./EmployeeQueuePage.css";

function getTodayInputValue() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function unwrapResponse(response) {
  const data = response?.data?.data ?? response?.data ?? response;

  if (data && typeof data === "object" && Array.isArray(data.content)) {
    return data.content;
  }

  return data;
}

function getErrorMessage(error) {
  return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Đã xảy ra lỗi. Vui lòng thử lại."
  );
}

const BOOKING_ACTIONS = {
  confirm: (bookingId) => employeeApi.confirmBooking(bookingId),

  "check-in": (bookingId) =>
      employeeApi.checkInBooking(bookingId),

  "no-show": (bookingId) =>
      employeeApi.markNoShow(bookingId),

  "start-wash": (bookingId, bayId) =>
      employeeApi.startWash(bookingId, bayId),

  complete: (bookingId) =>
      employeeApi.completeBooking(bookingId),
};

const ACTION_CONFIRMATIONS = {
  "no-show":
      "Xác nhận khách không đến? Booking sẽ chuyển sang no-show và trả lại chỗ cho khung giờ.",
  complete:
      "Bạn đã kiểm tra khách thanh toán tại quầy và xe đã rửa xong? Thao tác này sẽ hoàn thành booking và cộng điểm cho khách.",
};

function EmployeeQueuePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [selectedStatus, setSelectedStatus] = useState("");

  const [bookings, setBookings] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");

  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [detailBookingId, setDetailBookingId] = useState(null);

  // ── Wash Bay Selection ──
  const [showBayModal, setShowBayModal] = useState(false);
  const [availableBays, setAvailableBays] = useState([]);
  const [selectedBayId, setSelectedBayId] = useState(null);
  const [pendingWashBooking, setPendingWashBooking] = useState(null);

  const loadQueue = useCallback(async () => {
    try {
      setQueueLoading(true);
      setQueueError("");

      const response = await employeeApi.getQueue({
        date: selectedDate,
        status: selectedStatus,
      });

      const responseData = unwrapResponse(response);

      setBookings(
          Array.isArray(responseData) ? responseData : []
      );
    } catch (error) {
      setBookings([]);
      setQueueError(getErrorMessage(error));
    } finally {
      setQueueLoading(false);
    }
  }, [selectedDate, selectedStatus]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadQueue();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadQueue]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setDetailBookingId(null);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setDetailBookingId(null);
  };

  const handleSearchCodeChange = (value) => {
    setSearchCode(value);
    setSearchError("");
  };

  const handleSearch = async (bookingCode) => {
    try {
      setSearchLoading(true);
      setSearchError("");
      setSearchResult(null);

      const response =
          await employeeApi.searchBookingByCode(bookingCode);

      const booking = unwrapResponse(response);

      setSearchResult(booking);
    } catch (error) {
      setSearchResult(null);
      setSearchError(getErrorMessage(error));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchCode("");
    setSearchResult(null);
    setSearchError("");
  };

  const updateBookingAfterAction = (updatedBooking) => {
    if (!updatedBooking?.bookingId) {
      return;
    }

    setBookings((currentBookings) =>
        currentBookings.map((booking) =>
            booking.bookingId === updatedBooking.bookingId
                ? updatedBooking
                : booking
        )
    );

    setSearchResult((currentSearchResult) => {
      if (
          currentSearchResult?.bookingId ===
          updatedBooking.bookingId
      ) {
        return updatedBooking;
      }

      return currentSearchResult;
    });

  };

  const handleStartBaySelection = async (bookingId, booking) => {
    const branchId = booking?.branchId;

    if (!branchId) {
      setQueueError("Không thể xác định chi nhánh để chọn khu vực rửa.");
      return;
    }

    try {
      const response = await washBayService.getBaysByBranch(branchId);
      const bays = response?.data?.data ?? response?.data ?? [];

      if (!Array.isArray(bays) || bays.length === 0) {
        setQueueError("Chi nhánh chưa cài đặt khu vực rửa.");
        return;
      }

      const available = bays.filter(
          (bay) => bay.status === "available"
      );

      // Ưu tiên chọn khoang rửa mà khách đã đặt lịch (nếu khả dụng)
      const bookedBay = bays.find((b) => b.bayId === booking?.bayId);
      const defaultBayId =
          bookedBay && bookedBay.status === "available"
              ? bookedBay.bayId
              : (available.length > 0 ? available[0].bayId : (bookedBay?.bayId ?? null));

      setPendingWashBooking({
        bookingId,
        branchId,
        bookingCode: booking?.bookingCode,
        bookedBayName: booking?.bayName,
      });
      setAvailableBays(bays);
      setSelectedBayId(defaultBayId);
      setShowBayModal(true);
    } catch (error) {
      setQueueError("Không thể tải danh sách khu vực rửa.");
    }
  };

  const handleConfirmStartWash = async () => {
    if (!pendingWashBooking || !selectedBayId) {
      return;
    }

    const { bookingId } = pendingWashBooking;

    try {
      setShowBayModal(false);
      setPendingWashBooking(null);
      setProcessingBookingId(bookingId);
      setQueueError("");
      setSearchError("");

      const response = await BOOKING_ACTIONS["start-wash"](bookingId, selectedBayId);
      const updatedBooking = unwrapResponse(response);

      updateBookingAfterAction(updatedBooking);
      await loadQueue();
    } catch (error) {
      const message = getErrorMessage(error);

      if (searchResult?.bookingId === bookingId) {
        setSearchError(message);
      } else {
        setQueueError(message);
      }
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleCancelBaySelection = () => {
    setShowBayModal(false);
    setPendingWashBooking(null);
    setAvailableBays([]);
    setSelectedBayId(null);
  };

  const handleBookingAction = async ({
                                       bookingId,
                                       action,
                                       booking,
                                     }) => {
    const actionHandler = BOOKING_ACTIONS[action];

    if (!actionHandler) {
      setQueueError(
          `Hành động '${action}' chưa được hỗ trợ.`
      );
      return;
    }

    if (action === "start-wash") {
      await handleStartBaySelection(bookingId, booking);
      return;
    }

    const confirmationMessage = ACTION_CONFIRMATIONS[action];

    if (
        confirmationMessage &&
        !window.confirm(confirmationMessage)
    ) {
      return;
    }

    try {
      setProcessingBookingId(bookingId);
      setQueueError("");
      setSearchError("");

      const response = await actionHandler(bookingId);
      const updatedBooking = unwrapResponse(response);

      updateBookingAfterAction(updatedBooking);

      await loadQueue();
    } catch (error) {
      const message = getErrorMessage(error);

      if (searchResult?.bookingId === bookingId) {
        setSearchError(message);
      } else {
        setQueueError(message);
      }
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleViewDetails = (bookingOrId) => {
    const bookingId =
        typeof bookingOrId === "object"
            ? bookingOrId?.bookingId
            : bookingOrId;

    if (!bookingId) {
      return;
    }

    setDetailBookingId(bookingId);
  };

  const handleCloseDetails = () => {
    setDetailBookingId(null);
  };

  return (
      <section className="employee-queue-page">
        <header className="employee-queue-page__header">
          <div>
            <p className="employee-queue-page__eyebrow">
              Quản lý vận hành
            </p>

            <h1>Hàng đợi rửa xe</h1>

            <p>
              Theo dõi và cập nhật booking tại chi nhánh của
              bạn.
            </p>
          </div>

          <div className="employee-queue-page__summary">
            <ClipboardList size={22} aria-hidden="true" />

            <div>
              <strong>{bookings.length}</strong>
              <span>booking đang hiển thị</span>
            </div>
          </div>
        </header>

        <EmployeeBookingSearch
            value={searchCode}
            onChange={handleSearchCodeChange}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            loading={searchLoading}
            error={searchError}
        />

        {searchResult && (
            <section className="employee-queue-page__search-result">
              <div className="employee-queue-page__section-heading">
                <div>
                  <h2>Kết quả tìm kiếm</h2>
                  <p>
                    Booking thuộc chi nhánh của Employee đang
                    đăng nhập.
                  </p>
                </div>

                <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Đóng kết quả tìm kiếm"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <EmployeeBookingCard
                  booking={searchResult}
                  onAction={handleBookingAction}
                  onViewDetails={handleViewDetails}
                  actionLoading={
                      processingBookingId === searchResult.bookingId
                  }
              />
            </section>
        )}

        <EmployeeQueueFilters
            date={selectedDate}
            status={selectedStatus}
            onDateChange={handleDateChange}
            onStatusChange={handleStatusChange}
            onRefresh={loadQueue}
            refreshing={queueLoading}
        />

        {queueError && (
            <div
                className="employee-queue-page__error"
                role="alert"
            >
              <AlertCircle size={20} aria-hidden="true" />
              <span>{queueError}</span>
            </div>
        )}

        <section className="employee-queue-page__queue">
          <div className="employee-queue-page__section-heading">
            <div>
              <h2>Danh sách hàng đợi</h2>

              <p>
                Ngày {selectedDate}
                {selectedStatus
                    ? ` · Trạng thái ${selectedStatus}`
                    : " · Các booking đang xử lý"}
              </p>
            </div>
          </div>

          {queueLoading ? (
              <div className="employee-queue-page__state">
                <div className="employee-queue-page__spinner" />
                <p>Đang tải hàng đợi...</p>
              </div>
          ) : bookings.length === 0 ? (
              <div className="employee-queue-page__state">
                <ClipboardList size={42} aria-hidden="true" />
                <h3>Chưa có booking</h3>
                <p>
                  Không có booking phù hợp với ngày và trạng thái
                  đã chọn.
                </p>
              </div>
          ) : (
              <div className="employee-queue-page__grid">
                {bookings.map((booking) => (
                    <EmployeeBookingCard
                        key={booking.bookingId}
                        booking={booking}
                        onAction={handleBookingAction}
                        onViewDetails={handleViewDetails}
                        actionLoading={
                            processingBookingId === booking.bookingId
                        }
                    />
                ))}
              </div>
          )}
        </section>

        <EmployeeBookingDetailModal
            open={Boolean(detailBookingId)}
            bookingId={detailBookingId}
            onClose={handleCloseDetails}
        />

        {showBayModal && (
            <div
                className="employee-queue-page__modal-backdrop"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) {
                    handleCancelBaySelection();
                  }
                }}
            >
              <div className="employee-queue-page__bay-modal">
                <div className="employee-queue-page__bay-modal-header">
                  <div className="employee-queue-page__bay-modal-title">
                    <Droplets size={20} />
                    <h3>Chọn khu vực rửa</h3>
                  </div>
                  <button
                      type="button"
                      onClick={handleCancelBaySelection}
                      aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="employee-queue-page__bay-modal-body">
                  {pendingWashBooking && (
                      <div className="employee-queue-page__bay-booking-info">
                        <div>
                          <span>Booking:</span>
                          <strong>
                            {pendingWashBooking.bookingCode ||
                                bookings.find(
                                    (b) => b.bookingId === pendingWashBooking.bookingId
                                )?.bookingCode ||
                                `#${pendingWashBooking.bookingId}`}
                          </strong>
                        </div>
                        {pendingWashBooking.bookedBayName && (
                            <div style={{ marginLeft: "auto" }}>
                              <span>Đã đặt:</span>
                              <strong>{pendingWashBooking.bookedBayName}</strong>
                            </div>
                        )}
                      </div>
                  )}

                  <p className="employee-queue-page__bay-label">
                    Chọn khu vực rửa khả dụng:
                  </p>

                  <div className="employee-queue-page__bay-grid">
                    {availableBays.map((bay) => {
                      const isAvailable = bay.status === "available";
                      const isSelected = selectedBayId === bay.bayId;

                      const statusLabels = {
                        available: "Trống",
                        occupied: "Đang rửa",
                        maintenance: "Bảo trì",
                        inactive: "Ngừng HD",
                      };

                      return (
                          <button
                              key={bay.bayId}
                              type="button"
                              disabled={!isAvailable}
                              className={`employee-queue-page__bay-card${
                                  isSelected ? " employee-queue-page__bay-card--selected" : ""
                              }${!isAvailable ? " employee-queue-page__bay-card--disabled" : ""}`}
                              onClick={() => isAvailable && setSelectedBayId(bay.bayId)}
                          >
                            <Droplets
                                size={22}
                                className="employee-queue-page__bay-card-icon"
                            />
                            <span className="employee-queue-page__bay-card-name">
                              {bay.bayName}
                            </span>
                            <span className={`employee-queue-page__bay-card-status employee-queue-page__bay-card-status--${bay.status}`}>
                              {statusLabels[bay.status] || bay.status}
                            </span>
                            {isSelected && (
                                <CheckCircle2
                                    size={16}
                                    className="employee-queue-page__bay-card-check"
                                />
                            )}
                          </button>
                      );
                    })}
                  </div>
                </div>

                <div className="employee-queue-page__bay-modal-footer">
                  <button
                      type="button"
                      className="employee-queue-page__bay-btn-cancel"
                      onClick={handleCancelBaySelection}
                  >
                    Hủy
                  </button>
                  <button
                      type="button"
                      className="employee-queue-page__bay-btn-confirm"
                      onClick={handleConfirmStartWash}
                      disabled={!selectedBayId}
                  >
                    <Droplets size={16} />
                    Bắt đầu rửa
                  </button>
                </div>
              </div>
            </div>
        )}
      </section>
  );
}

export default EmployeeQueuePage;