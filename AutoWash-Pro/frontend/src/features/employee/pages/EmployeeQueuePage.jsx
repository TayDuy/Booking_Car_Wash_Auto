import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ClipboardList, X } from "lucide-react";

import employeeApi from "../../../api/employeeApi";
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
  return response?.data?.data ?? response?.data ?? response;
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

  "start-wash": (bookingId) =>
    employeeApi.startWash(bookingId),

  complete: (bookingId) =>
    employeeApi.completeBooking(bookingId),
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
    loadQueue();
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

  const handleBookingAction = async ({
    bookingId,
    action,
  }) => {
    const actionHandler = BOOKING_ACTIONS[action];

    if (!actionHandler) {
      setQueueError(
        `Hành động '${action}' chưa được hỗ trợ.`
      );
      return;
    }

    try {
      setProcessingBookingId(bookingId);
      setQueueError("");
      setSearchError("");

      const response = await actionHandler(bookingId);
      const updatedBooking = unwrapResponse(response);

      updateBookingAfterAction(updatedBooking);

      // Tải lại để booking được loại khỏi bộ lọc hiện tại
      // khi trạng thái của nó đã thay đổi.
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

    </section>
  );
}

export default EmployeeQueuePage;