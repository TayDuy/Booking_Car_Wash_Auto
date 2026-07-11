import "./PaymentSuccessPage.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Copy, Home, ListChecks, MapPin } from "lucide-react";
import axiosClient from "../../../api/axiosClient";

const STORE_NAME = "AutoWash Pro";

// Trang này CHỈ hiển thị kết quả thanh toán đã thành công (đọc lại), không tạo
// payment mới và không tự sinh QR — việc đó là trách nhiệm của PaymentPage.
// Nguồn dữ liệu ưu tiên: state được PaymentPage truyền qua khi điều hướng
// (navigate("/customer/payment/success", { state: { paymentResult, bookingDetail } })).
// Nếu người dùng load thẳng URL này (F5, mở lại tab...), hoặc PaymentPage điều
// hướng sang khi bookingDetail chưa kịp tải xong, component sẽ tự gọi lại API
// bằng bookingId / paymentId để dựng lại đầy đủ dữ liệu hiển thị.
function PaymentSuccessPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [paymentResult, setPaymentResult] = useState(location.state?.paymentResult || null);
    const [bookingDetail, setBookingDetail] = useState(location.state?.bookingDetail || null);
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(!location.state?.paymentResult);
    const [copied, setCopied] = useState(false);

    const paymentIdFromQuery = searchParams.get("paymentId");
    const paymentId = paymentResult?.paymentId || paymentIdFromQuery;

    // Fallback: không có sẵn paymentResult trong state (ví dụ người dùng F5 trang)
    // -> tự gọi lại API bằng paymentId trên query để lấy thông tin thanh toán.
    useEffect(() => {
        if (paymentResult || !paymentIdFromQuery) return;

        let cancelled = false;
        async function loadPayment() {
            try {
                const res = await axiosClient.get(`/payments/${paymentIdFromQuery}`);
                const result = res.data?.data || res.data;
                if (cancelled) return;
                setPaymentResult(result);
            } catch (error) {
                console.log("Cannot load payment result", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadPayment();
        return () => {
            cancelled = true;
        };
    }, [paymentResult, paymentIdFromQuery]);

    // Luôn đảm bảo có bookingDetail đầy đủ: nếu chưa có (dù state đã mang sẵn
    // paymentResult) mà đã biết bookingId -> tự fetch lại. Trường hợp này xảy ra
    // khi PaymentPage điều hướng sang đây trước khi kịp load xong bookingDetail.
    useEffect(() => {
        const bookingId = paymentResult?.bookingId;
        if (!bookingId || bookingDetail) return;

        let cancelled = false;
        async function loadBooking() {
            try {
                const res = await axiosClient.get(`/bookings/${bookingId}`);
                const result = res.data?.data || res.data;
                if (!cancelled) setBookingDetail(result);
            } catch (error) {
                console.log("Cannot load booking detail", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadBooking();
        return () => {
            cancelled = true;
        };
    }, [paymentResult?.bookingId, bookingDetail]);

    // Lấy danh sách xe của khách để suy ra "Tên xe" (hãng + dòng xe) — BookingResponseDTO
    // chỉ trả về licensePlate/vehicleType chứ không có brand/model, nên phải khớp
    // theo vehicleId với GET /api/v1/vehicles (xe của chính khách đang đăng nhập).
    useEffect(() => {
        if (!bookingDetail?.vehicleId) return;

        let cancelled = false;
        async function loadVehicles() {
            try {
                const res = await axiosClient.get("/vehicles");
                const result = res.data?.data || res.data;
                if (!cancelled && Array.isArray(result)) setVehicles(result);
            } catch (error) {
                console.log("Cannot load vehicle list", error);
            }
        }
        loadVehicles();
        return () => {
            cancelled = true;
        };
    }, [bookingDetail?.vehicleId]);

    const firstService = useMemo(
        () => bookingDetail?.details?.[0] || bookingDetail?.bookingDetail?.[0] || null,
        [bookingDetail]
    );

    const timeRange = useMemo(() => {
        if (!bookingDetail?.startTime || !bookingDetail?.endTime) return "-";
        const fmt = (t) =>
            new Date(t).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        return `${fmt(bookingDetail.startTime)} - ${fmt(bookingDetail.endTime)}`;
    }, [bookingDetail]);

    const matchedVehicle = useMemo(
        () => vehicles.find((v) => v.vehicleId === bookingDetail?.vehicleId) || null,
        [vehicles, bookingDetail?.vehicleId]
    );

    // "Tên xe" ưu tiên nickname (biệt danh khách tự đặt) -> hãng + dòng xe -> loại xe.
    const vehicleName =
        matchedVehicle?.nickname ||
        [matchedVehicle?.brand, matchedVehicle?.model].filter(Boolean).join(" ") ||
        bookingDetail?.vehicleType ||
        "-";

    const finalAmountVnd = Number(paymentResult?.finalAmount || bookingDetail?.totalAmount || 0);
    const orderCode = paymentId ? `PAY${paymentId}` : "—";

    function handleCopyCode() {
        if (!paymentId) return;
        navigator.clipboard?.writeText(orderCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    if (isLoading) {
        return (
            <div className="pay-success-page">
                <div className="pay-success-empty">Đang tải kết quả thanh toán...</div>
            </div>
        );
    }

    // Không có dữ liệu nào để hiển thị (vào thẳng trang mà không có state lẫn paymentId).
    if (!paymentResult && !paymentIdFromQuery) {
        return (
            <div className="pay-success-page">
                <div className="pay-success-empty">
                    Không tìm thấy thông tin thanh toán để hiển thị.
                    <br />
                    <button
                        type="button"
                        className="pay-success-btn primary"
                        style={{ marginTop: 16, display: "inline-flex", width: "auto", padding: "10px 20px" }}
                        onClick={() => navigate("/customer/home")}
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pay-success-page">
            <div className="pay-success-inner">
                <div className="pay-success-icon">
                    <CheckCircle2 size={44} strokeWidth={2} />
                </div>
                <h1>Thanh Toán Thành Công!</h1>
                <p className="pay-success-subtitle">
                    Cảm ơn bạn đã sử dụng dịch vụ của {STORE_NAME}.{" "}
                    {paymentResult?.paymentMethod === "paypal" ? "PayPal" : "VNPAY"} đã xác nhận giao dịch của bạn,
                    booking của bạn giờ đã được thanh toán.
                </p>

                <div className="pay-success-layout">
                    <div className="pay-success-card">
                        <h3>Chi tiết giao dịch</h3>
                        <p className="pay-success-card-hint">Thông tin đặt lịch &amp; thanh toán của bạn</p>

                        <div className="booking-code-chip">
                            <span>Mã giao dịch</span>
                            <strong>{orderCode}</strong>
                            <button type="button" onClick={handleCopyCode} title="Sao chép mã">
                                <Copy size={16} />
                            </button>
                        </div>
                        {copied && <p className="pay-success-card-hint" style={{ margin: "6px 0 0" }}>Đã sao chép!</p>}

                        <div className="pay-success-divider" />

                        <div className="booking-summary-row">
                            <div>
                                <span>Dịch vụ</span>
                                <strong>{firstService?.serviceName || "-"}</strong>
                            </div>
                            <div>
                                <span>Tên xe</span>
                                <strong>{vehicleName}</strong>
                            </div>
                        </div>
                        <div className="booking-summary-row">
                            <div>
                                <span>Ngày</span>
                                <strong>{bookingDetail?.slotDate || bookingDetail?.bookingDate || "-"}</strong>
                            </div>
                            <div>
                                <span>Giờ</span>
                                <strong>{timeRange}</strong>
                            </div>
                        </div>
                        <div className="booking-summary-row">
                            <div>
                                <span>Biển số xe</span>
                                <strong>{bookingDetail?.licensePlate || "-"}</strong>
                            </div>
                            <div>
                                <span>Số điện thoại</span>
                                <strong>{bookingDetail?.customerPhone || "-"}</strong>
                            </div>
                        </div>
                        <div className="booking-summary-row">
                            <div>
                                <span>Booking ID</span>
                                <strong>#{bookingDetail?.bookingId || bookingDetail?.id || paymentResult?.bookingId || "-"}</strong>
                            </div>
                            <div>
                                <span>Phương thức</span>
                                <strong>
                                    {paymentResult?.paymentMethod === "paypal" ? "🅿️ PayPal" : "🏦 VNPAY QR"}
                                </strong>
                            </div>
                        </div>

                        <div className="pay-success-divider" />

                        <div className="booking-summary-row">
                            <div>
                                <span>Số tiền đã thanh toán</span>
                                <strong style={{ fontSize: 20, color: "var(--wf-green)" }}>
                                    {finalAmountVnd.toLocaleString()}đ
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="pay-success-side">
                        <div className="next-steps-card">
                            <h3>Bước tiếp theo</h3>
                            <p className="pay-success-card-hint">Bạn có thể làm gì tiếp theo</p>

                            <div className="next-step">
                                <span className="next-step-num">1</span>
                                <div>
                                    <strong>Chuẩn bị xe đúng giờ</strong>
                                    <p>Hãy mang xe đến trung tâm đúng khung giờ đã đặt để được phục vụ tốt nhất.</p>
                                </div>
                            </div>
                            <div className="next-step">
                                <span className="next-step-num">2</span>
                                <div>
                                    <strong>Theo dõi trạng thái đơn</strong>
                                    <p>Xem tiến độ xử lý và lịch sử đặt lịch của bạn trong mục "Lịch sử".</p>
                                </div>
                            </div>
                            <div className="next-step">
                                <span className="next-step-num">3</span>
                                <div>
                                    <strong>Nhận thông báo</strong>
                                    <p>Chúng tôi sẽ gửi thông báo khi xe của bạn được hoàn tất.</p>
                                </div>
                            </div>

                            <div className="pay-success-location">
                                <MapPin size={16} />
                                <span>Hoá đơn điện tử đã được lưu vào lịch sử đặt lịch của bạn.</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="pay-success-btn primary"
                            onClick={() => navigate("/customer/history")}
                        >
                            <ListChecks size={18} />
                            Xem lịch sử đặt lịch
                        </button>
                        <button
                            type="button"
                            className="pay-success-btn secondary"
                            onClick={() => navigate("/customer/home")}
                        >
                            <Home size={18} />
                            Về trang chủ
                        </button>
                    </div>
                </div>

                <div className="pay-success-footer">
                    <div className="pay-success-footer-text">
                        <span>Cần hỗ trợ?</span>
                        <button type="button" onClick={() => navigate("/customer/support")}>
                            Liên hệ chúng tôi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccessPage;