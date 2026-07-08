import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Copy, Home, ListChecks } from "lucide-react";
import bookingApi from "../../../api/bookingApi";
import "./BookingSuccessPage.css";

const fmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
const fmtTime = (t) => (t ? String(t).substring(0, 5) : "");

function BookingSuccessPage() {
    const { bookingId: bookingIdParam } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(location.state?.booking || null);
    const [isLoading, setIsLoading] = useState(!location.state?.booking);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

// FIX: POST /bookings chỉ trả về BookingCreateResponseDTO (bookingId, bookingCode,
// bookingDate, status, totalAmount, message) — KHÔNG có branchName, licensePlate,
// slotDate/slotStartTime/slotEndTime. Vì vậy nếu chỉ dùng location.state.booking
// thì Chi nhánh / Biển số xe / Ngày / Giờ luôn hiện "-".
// GET /bookings/{id} mới trả về BookingResponseDTO đầy đủ các field này.
    useEffect(() => {
        const id = bookingIdParam || booking?.bookingId || booking?.id;
        if (!id) return;
        let cancelled = false;
        async function loadBooking() {
            try {
                if (!booking) setIsLoading(true);
                const res = await bookingApi.get(id);
                if (!cancelled) setBooking((prev) => ({ ...prev, ...res.data }));
            } catch (err) {
                console.error("Không thể tải thông tin booking:", err);
                if (!cancelled && !booking) {
                    setError("Không thể tải thông tin đặt lịch. Vui lòng thử lại sau.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadBooking();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingIdParam]);

    const bookingId = booking?.bookingId || booking?.id || bookingIdParam;
    const bookingCode = booking?.bookingCode || (bookingId ? `#${bookingId}` : "—");
    const details = useMemo(() => booking?.details || [], [booking]);

    function handleCopyCode() {
        if (!bookingCode) return;
        navigator.clipboard?.writeText(bookingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    if (isLoading) {
        return (
            <div className="app-container" style={{ padding: "72px 0" }}>
                <div className="card booking-success-empty">Đang tải thông tin đặt lịch...</div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="app-container" style={{ padding: "72px 0" }}>
                <div className="card booking-success-empty">
                    {error || "Không tìm thấy thông tin đặt lịch để hiển thị."}
                    <div style={{ marginTop: 20 }}>
                        <Link to="/customer/home" className="primary-button">Về trang chủ</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ padding: "72px 0" }}>
            <div className="card booking-success-card">
                <div className="booking-success-icon">
                    <CheckCircle2 size={44} strokeWidth={2} />
                </div>

                <h1 className="booking-success-title">Đặt Lịch Thành Công!</h1>
                <p className="section-subtitle booking-success-subtitle">
                    Cảm ơn bạn đã đặt lịch tại AutoWash Pro. Chúng tôi đã ghi nhận yêu cầu của bạn và sẽ
                    liên hệ nếu cần thêm thông tin.
                </p>

                <div className="booking-code-chip">
                    <span>Mã đặt lịch</span>
                    <strong>{bookingCode}</strong>
                    <button type="button" onClick={handleCopyCode} title="Sao chép mã">
                        <Copy size={16} />
                    </button>
                </div>
                {copied && <p className="section-subtitle" style={{ margin: "6px 0 0" }}>Đã sao chép!</p>}

                <div className="booking-success-divider" />

                <div className="booking-success-grid">
                    <div><span>Chi nhánh</span><strong>{booking.branchName || "-"}</strong></div>
                    <div><span>Biển số xe</span><strong>{booking.licensePlate || "-"}</strong></div>
                    <div><span>Ngày</span><strong>{fmtDate(booking.slotDate || booking.bookingDate)}</strong></div>
                    <div>
                        <span>Giờ</span>
                        <strong>
                            {fmtTime(booking.slotStartTime)}
                            {booking.slotEndTime ? ` - ${fmtTime(booking.slotEndTime)}` : ""}
                        </strong>
                    </div>
                </div>

                {details.length > 0 && (
                    <>
                        <div className="booking-success-divider" />
                        <table className="booking-success-table">
                            <thead>
                            <tr><th>Dịch vụ</th><th>SL</th><th>Thành tiền</th></tr>
                            </thead>
                            <tbody>
                            {details.map((d) => (
                                <tr key={d.bookingDetailId || d.serviceId}>
                                    <td>{d.serviceName}</td>
                                    <td>{d.quantity}</td>
                                    <td>{fmt.format(d.subTotal || 0)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="booking-success-total">
                            <span>Tổng cộng</span>
                            <strong>{fmt.format(booking.totalAmount || 0)}</strong>
                        </div>
                    </>
                )}

                <div className="booking-success-actions">
                    <button type="button" className="primary-button" onClick={() => navigate("/customer/history")}>
                        <ListChecks size={18} />
                        Xem lịch sử đặt lịch
                    </button>
                    <button type="button" className="secondary-button" onClick={() => navigate("/customer/home")}>
                        <Home size={18} />
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookingSuccessPage;