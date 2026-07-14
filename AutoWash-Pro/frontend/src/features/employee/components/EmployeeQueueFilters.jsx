import { Filter, RefreshCw } from "lucide-react";

import { EMPLOYEE_QUEUE_FILTER_OPTIONS } from "../constants/employeeBookingStatus";

import "./EmployeeQueueFilters.css";

function EmployeeQueueFilters({
  date,
  status,
  onDateChange,
  onStatusChange,
  onRefresh,
  refreshing = false,
}) {
  const handleDateChange = (event) => {
    onDateChange?.(event.target.value);
  };

  const handleStatusChange = (event) => {
    onStatusChange?.(event.target.value);
  };

  return (
    <section
      className="employee-queue-filters"
      aria-label="Bộ lọc hàng đợi"
    >
      <div className="employee-queue-filters__heading">
        <Filter size={19} aria-hidden="true" />

        <div>
          <h2>Bộ lọc hàng đợi</h2>
          <p>Chọn ngày và trạng thái booking cần hiển thị.</p>
        </div>
      </div>

      <div className="employee-queue-filters__controls">
        <label className="employee-queue-filters__field">
          <span>Ngày phục vụ</span>

          <input
            type="date"
            value={date || ""}
            onChange={handleDateChange}
          />
        </label>

        <label className="employee-queue-filters__field">
          <span>Trạng thái</span>

          <select
            value={status || ""}
            onChange={handleStatusChange}
          >
            {EMPLOYEE_QUEUE_FILTER_OPTIONS.map((option) => (
              <option
                key={option.value || "processing"}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="employee-queue-filters__refresh"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            aria-hidden="true"
            className={refreshing ? "is-spinning" : ""}
          />

          {refreshing ? "Đang tải..." : "Tải lại"}
        </button>
      </div>
    </section>
  );
}

export default EmployeeQueueFilters;