import "./BookingStatusBadge.css";
import { getEmployeeBookingStatusMeta } from "../constants/employeeBookingStatus";

function BookingStatusBadge({ status }) {
  const statusMeta = getEmployeeBookingStatusMeta(status);

  return (
    <span
      className={`employee-booking-status-badge ${statusMeta.className}`}
      aria-label={`Trạng thái booking: ${statusMeta.label}`}
      title={`Trạng thái: ${statusMeta.label}`}
    >
      {statusMeta.label}
    </span>
  );
}

export default BookingStatusBadge;