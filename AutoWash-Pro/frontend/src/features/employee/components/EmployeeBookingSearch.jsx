import { Search, X } from "lucide-react";

import "./EmployeeBookingSearch.css";

function EmployeeBookingSearch({
  value,
  onChange,
  onSearch,
  onClear,
  loading = false,
  error = "",
}) {
  const handleChange = (event) => {
    onChange?.(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedValue = value?.trim();

    if (!normalizedValue || loading) {
      return;
    }

    onSearch?.(normalizedValue);
  };

  const handleClear = () => {
    if (loading) {
      return;
    }

    onClear?.();
  };

  return (
    <section
      className="employee-booking-search"
      aria-label="Tìm kiếm booking"
    >
      <div className="employee-booking-search__heading">
        <Search size={20} aria-hidden="true" />

        <div>
          <h2>Tìm booking</h2>
          <p>Nhập mã booking để tra cứu nhanh trong chi nhánh.</p>
        </div>
      </div>

      <form
        className="employee-booking-search__form"
        onSubmit={handleSubmit}
      >
        <div className="employee-booking-search__input-wrapper">
          <Search
            size={18}
            className="employee-booking-search__input-icon"
            aria-hidden="true"
          />

          <input
            type="text"
            value={value || ""}
            onChange={handleChange}
            placeholder="Ví dụ: BK-20260713-73ADEC"
            autoComplete="off"
            spellCheck="false"
            aria-label="Mã booking"
            disabled={loading}
          />

          {value && (
            <button
              type="button"
              className="employee-booking-search__clear"
              onClick={handleClear}
              disabled={loading}
              aria-label="Xóa mã booking"
              title="Xóa"
            >
              <X size={17} aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="employee-booking-search__submit"
          disabled={!value?.trim() || loading}
        >
          <Search size={18} aria-hidden="true" />

          {loading ? "Đang tìm..." : "Tìm booking"}
        </button>
      </form>

      {error && (
        <p
          className="employee-booking-search__error"
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );
}

export default EmployeeBookingSearch;