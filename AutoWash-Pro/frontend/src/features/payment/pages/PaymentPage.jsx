import "./PaymentPage.css";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient, { BACKEND_ROOT_URL } from "../../../api/axiosClient";
import promotionApi from "../../../api/promotionApi";
import { getMyRewards } from "../../../api/customerRewardApi";

const API_BASE = BACKEND_ROOT_URL;
const STORE_NAME = "AutoWash Pro";

// VNPAY sandbox hết hạn giao dịch sau 15 phút kể từ vnp_CreateDate
// (xem VNPayServiceImpl#createPaymentUrl -> cld.add(Calendar.MINUTE, 15)).
const VNPAY_EXPIRE_SECONDS = 15 * 60;

function PaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bookingIdFromBookingPage = location.state?.bookingId;
    const bookingIdFromQuery = searchParams.get("bookingId");
    const paymentIdFromQuery = searchParams.get("paymentId");
    const paymentFailedFromQuery = searchParams.get("paymentFailed");
    const failReasonFromQuery = searchParams.get("reason");
    const bookingId = bookingIdFromBookingPage
        ? String(bookingIdFromBookingPage)
        : (bookingIdFromQuery || "");
    // Đọc promotion/voucher từ localStorage (được set từ trang trung tâm ưu đãi)
    // rồi xoá ngay để tránh ảnh hưởng lần thanh toán sau.
    useEffect(() => {
        const keys = [
            "selectedPromotionId", "selectedPromotionDiscount",
            "selectedPromotionCode", "selectedRewardId",
            "selectedVoucherCode", "selectedVoucherValue"
        ];
        keys.forEach(k => localStorage.removeItem(k));
    }, []);

    // Khách chọn giữa VNPAY (QR nội địa) và PayPal (thẻ/ví quốc tế).
    // "vnpay" -> gửi paymentMethod="bank_transfer" cho backend (enum không có "vnpay").
    // "paypal" -> gửi paymentMethod="paypal" thẳng, khớp enum PaymentMethod.paypal.
    const [selectedMethod, setSelectedMethod] = useState("vnpay");
    const paymentMethod = selectedMethod === "paypal" ? "paypal" : "bank_transfer";

    // Promotion & Reward LUÔN LÀ TUỲ CHỌN — nếu khách không có mã/điểm thì cứ để
    // trống, hàm handleCreatePayment bên dưới đã tự gửi null khi rỗng nên việc
    // thanh toán không bao giờ bị chặn bởi 2 trường này.
    const promotionFromState = location.state?.promotionId || location.state?.selectedPromoId;
    const rewardFromState = location.state?.rewardId || location.state?.selectedRewardId;
    const voucherCodeFromState = location.state?.selectedVouchCode;

    const [promotionId, setPromotionId] = useState(
        String(promotionFromState || localStorage.getItem("selectedPromotionId") || "")
    );
    const [rewardId, setRewardId] = useState(
        String(rewardFromState || localStorage.getItem("selectedRewardId") || "")
    );
    const [voucherCode, setVoucherCode] = useState(
        voucherCodeFromState || ""
    );
    const [paymentVouchers, setPaymentVouchers] = useState([]);
    const [paymentPromotions, setPaymentPromotions] = useState([]);

    useEffect(() => {
        const customerId = localStorage.getItem("customerId");
        if (!customerId) return;
        const cid = parseInt(customerId, 10);
        getMyRewards(cid).then(res => {
            const list = Array.isArray(res) ? res : res?.data || [];
            setPaymentVouchers(list.filter(v => v.status === "UNUSED"));
        }).catch(() => {});
        promotionApi.active().then(res => {
            const list = Array.isArray(res) ? res : res?.data || [];
            setPaymentPromotions(list);
        }).catch(() => {});
    }, []);

    const [paymentResult, setPaymentResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [bookingDetail, setBookingDetail] = useState(null);
    const [qrImageUrl, setQrImageUrl] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    // Cờ để chỉ tự động tạo payment + QR một lần duy nhất khi vào trang.
    const autoTriggeredRef = useRef(false);

    // Lưu lại object URL hiện tại để revoke khi tạo QR mới / rời trang (tránh leak bộ nhớ).
    const qrObjectUrlRef = useRef(null);

    // Đồng hồ đếm ngược "Hết hạn sau", đồng bộ với thời gian hết hạn thật của VNPAY (15 phút).
    const [timeLeft, setTimeLeft] = useState(VNPAY_EXPIRE_SECONDS);

    // Gọi thẳng backend GET /api/v1/payments/{id}/vnpay-qr — endpoint này trả về
    // ảnh PNG (byte[]) đã được ký HMAC-SHA512 hợp lệ trỏ tới cổng thanh toán VNPAY
    // sandbox thật, KHÔNG còn dựng QR VietQR ở phía client nữa.
    async function fetchVnpayQrImage(id) {
        setQrLoading(true);
        setErrorMessage("");
        try {
            const response = await axiosClient.get(`/payments/${id}/vnpay-qr`, {
                responseType: "blob",
            });

            const blob = response.data;

            // Revoke URL cũ trước khi tạo URL mới để tránh leak bộ nhớ.
            if (qrObjectUrlRef.current) {
                URL.revokeObjectURL(qrObjectUrlRef.current);
            }
            const objectUrl = URL.createObjectURL(blob);
            qrObjectUrlRef.current = objectUrl;
            setQrImageUrl(objectUrl);
        } catch (error) {
            if (error.response?.data instanceof Blob) {
                error.response.data.text().then(t => {
                    try { const j = JSON.parse(t); setErrorMessage(j.message || j.error || t); } catch { setErrorMessage(t); }
                });
            } else {
                setErrorMessage(error.response?.data?.message || error.message || "Không tạo được mã QR VNPAY");
            }
        } finally {
            setQrLoading(false);
        }
    }

    async function handleCreatePayment() {

        // Nếu đã có payment (đã POST /payments thành công trước đó), "Tạo lại mã QR"
        // chỉ cần gọi lại GET .../vnpay-qr cho paymentId cũ — KHÔNG tạo payment mới,
        // tránh tạo trùng nhiều payment "unpaid" cho cùng một booking.
        if (paymentId) {
            await fetchVnpayQrImage(paymentId);
            return;
        }

        if (!bookingId) {
            setErrorMessage("Please enter Booking ID");
            return;
        }

        if (isNaN(Number(bookingId))) {
            setErrorMessage("Booking ID must be a number");
            return;
        }

        if (Number(bookingId) <= 0) {
            setErrorMessage("Booking ID must be greater than 0");
            return;
        }

        // Cho phép tạo payment ngay cả khi booking đang pending/confirmed/in_progress.
        // Chỉ chặn khi booking đã bị hủy hoặc khách không đến — 2 trạng thái này
        // không còn ý nghĩa để thanh toán.
        if (bookingDetail && (bookingDetail.status === "cancelled" || bookingDetail.status === "no_show")) {
            setErrorMessage(
                `Không thể thanh toán cho booking đã ở trạng thái "${bookingDetail.status}".`
            );
            return;
        }

        // promotionId / rewardId là TUỲ CHỌN: rỗng -> gửi null, backend tự hiểu
        // là "không áp dụng ưu đãi" và vẫn tạo payment / QR bình thường.
        const data = {
            bookingId: Number(bookingId),
            paymentMethod: paymentMethod,
            promotionId: promotionId ? Number(promotionId) : null,
            rewardId: rewardId ? Number(rewardId) : null,
            voucherCode: voucherCode || null,
        };

        try {
            setIsLoading(true);
            const response = await axiosClient.post("/payments", data);
            const result = response.data?.data || response.data;

            setPaymentResult(result);
            setPaymentId(result.paymentId);
            setErrorMessage("");
            await fetchVnpayQrImage(result.paymentId);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || "Network Error");
        } finally {
            setIsLoading(false);
        }
    }

    // Tạo payment (nếu chưa có) với paymentMethod="paypal", sau đó tạo PayPal Order
    // và redirect trình duyệt sang trang PayPal để khách đăng nhập & xác nhận thanh toán.
    // Khi khách approve xong, PayPal tự redirect trình duyệt về backend (paypal-return),
    // backend capture rồi redirect tiếp về đúng trang này với ?paymentId=... (giống VNPAY).
    async function handlePayPalPay() {
        setErrorMessage("");

        if (!bookingId) {
            setErrorMessage("Please enter Booking ID");
            return;
        }
        if (isNaN(Number(bookingId)) || Number(bookingId) <= 0) {
            setErrorMessage("Booking ID must be a number greater than 0");
            return;
        }
        if (bookingDetail && (bookingDetail.status === "cancelled" || bookingDetail.status === "no_show")) {
            setErrorMessage(
                `Không thể thanh toán cho booking đã ở trạng thái "${bookingDetail.status}".`
            );
            return;
        }

        setIsLoading(true);
        try {
            let currentPaymentId = paymentId;

            // Chưa có payment -> tạo mới với paymentMethod = "paypal".
            if (!currentPaymentId) {
                const data = {
                    bookingId: Number(bookingId),
                    paymentMethod: "paypal",
                    promotionId: promotionId ? Number(promotionId) : null,
                    rewardId: rewardId ? Number(rewardId) : null,
                    voucherCode: voucherCode || null,
                };

                const response = await axiosClient.post("/payments", data);
                const result = response.data?.data || response.data;

                setPaymentResult(result);
                currentPaymentId = result.paymentId;
                setPaymentId(currentPaymentId);
            }

            const orderResponse = await axiosClient.post(`/payments/${currentPaymentId}/paypal-order`);
            const orderResult = orderResponse.data?.data || orderResponse.data;

            window.location.href = orderResult.approvalUrl;
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || "Network Error");
        } finally {
            setIsLoading(false);
        }
    }

    // Với VNPAY thật, trạng thái "paid" CHỈ được xác nhận qua vnpay-ipn (server-to-server,
    // có kiểm tra chữ ký HMAC-SHA512 + số tiền) — client không còn được tự PATCH status
    // sang "paid" nữa (làm vậy là giả mạo thanh toán). Hàm này chỉ ĐỌC lại trạng thái
    // mới nhất từ backend để biết VNPAY đã xác nhận hay chưa.
    async function handleGetPayment(silent = false) {
        if (!paymentId) return;

        try {
            const response = await axiosClient.get(`/payments/${paymentId}`);
            const result = response.data?.data || response.data;

            setPaymentResult(result);
            if (!silent) setErrorMessage("");
        } catch (error) {
            if (!silent) setErrorMessage(error.response?.data?.message || error.message || "Network Error");
            console.log("Cannot get payment", error);
        }
    }

    async function handleGetBookingDetail(id) {
        try {
            const response = await axiosClient.get(`/bookings/${id}`);
            const result = response.data?.data || response.data;

            setBookingDetail(result);
        } catch (error) {
            console.log("Cannot get booking detail", error);
        }
    }

    // Khi VNPAY redirect trình duyệt thật về đây (không phải điều hướng nội bộ của
    // React Router), location.state luôn rỗng. Đọc kết quả từ query string thay thế:
    // - Thành công: có ?paymentId=... -> load lại payment để hiển thị trạng thái "paid".
    // - Thất bại: có ?paymentFailed=1&reason=... -> hiển thị lý do, cho phép thử lại.
    useEffect(() => {
        if (paymentIdFromQuery && !autoTriggeredRef.current) {
            autoTriggeredRef.current = true;
            setPaymentId(paymentIdFromQuery);
        } else if (paymentFailedFromQuery === "1") {
            const reasonMessages = {
                invalid_signature: "Chữ ký giao dịch không hợp lệ. Vui lòng thử lại.",
                invalid_order: "Không xác định được đơn hàng thanh toán.",
                order_not_found: "Không tìm thấy đơn hàng tương ứng.",
                payment_failed: "Giao dịch không thành công. Vui lòng thử lại.",
                paypal_cancelled: "Bạn đã hủy thanh toán PayPal. Vui lòng thử lại nếu muốn tiếp tục.",
                paypal_not_completed: "PayPal chưa xác nhận hoàn tất giao dịch. Vui lòng thử lại.",
                paypal_capture_failed: "Không xác nhận được thanh toán PayPal. Vui lòng thử lại.",
            };
            setErrorMessage(
                reasonMessages[failReasonFromQuery] || "Thanh toán không thành công. Vui lòng thử lại."
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Có paymentId (từ query khi redirect về, hoặc vừa tạo) nhưng chưa có QR ảnh
    // (nghĩa là không cần quét QR nữa — chỉ cần load lại trạng thái mới nhất).
    useEffect(() => {
        if (paymentId && !qrImageUrl) {
            handleGetPayment(false).then(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentId]);

    // Khi đã có payment nhưng chưa có booking detail (trường hợp vào từ redirect,
    // chỉ có paymentId trong query) -> lấy bookingId từ payment để hiển thị tóm tắt.
    useEffect(() => {
        if (!bookingDetail && paymentResult?.bookingId) {
            handleGetBookingDetail(paymentResult.bookingId).then(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentResult?.bookingId]);

    useEffect(() => {
        if (bookingId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch dữ liệu booking từ server, không phải sync state nội bộ
            handleGetBookingDetail(bookingId).then(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    // Tự động tạo payment + sinh mã QR ngay khi vào trang, miễn là booking chưa bị
    // hủy / không đến. Không còn chờ trạng thái "completed" nữa.
    useEffect(() => {
        if (
            selectedMethod === "vnpay" &&
            bookingId &&
            bookingDetail &&
            bookingDetail.status !== "cancelled" &&
            bookingDetail.status !== "no_show" &&
            !autoTriggeredRef.current
        ) {
            autoTriggeredRef.current = true;
            // eslint-disable-next-line react-hooks/set-state-in-effect -- gọi API tạo payment + QR, không phải sync state nội bộ
            handleCreatePayment().then(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId, bookingDetail?.status, selectedMethod]);

    // Khi có mã QR mới -> reset đồng hồ về 15:00 (khớp vnp_ExpireDate ở backend)
    // và bắt đầu đếm ngược mỗi giây.
    useEffect(() => {
        if (!qrImageUrl || paymentResult?.paymentStatus === "paid") return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset đồng hồ đếm ngược khi có QR mới, cần chạy đồng bộ ngay khi effect kích hoạt
        setTimeLeft(VNPAY_EXPIRE_SECONDS);
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qrImageUrl]);

    // Poll trạng thái payment mỗi 5s trong khi đang chờ khách quét & thanh toán qua VNPAY.
    // Khi VNPAY gọi vnpay-ipn về backend và cập nhật status -> paid, poll này sẽ tự
    // phát hiện ra và dừng lại (không cần khách bấm nút "đã thanh toán" thủ công nữa).
    useEffect(() => {
        if (!paymentId || !qrImageUrl || paymentResult?.paymentStatus === "paid" || timeLeft <= 0) {
            return;
        }
        const poller = setInterval(() => {
            handleGetPayment(true).then(() => {});
        }, 5000);
        return () => clearInterval(poller);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentId, qrImageUrl, paymentResult?.paymentStatus, timeLeft > 0]);

    // Revoke object URL của ảnh QR khi rời trang, tránh leak bộ nhớ.
    useEffect(() => {
        return () => {
            if (qrObjectUrlRef.current) {
                URL.revokeObjectURL(qrObjectUrlRef.current);
            }
        };
    }, []);

    // Ngay khi phát hiện VNPAY đã xác nhận "paid" (qua polling hoặc bấm nút kiểm
    // tra trạng thái thủ công), điều hướng sang trang "Thanh toán thành công".
    // Đợi 900ms để người dùng kịp thấy dòng "✅ VNPAY đã xác nhận..." trước khi chuyển trang.
    useEffect(() => {
        if (paymentResult?.paymentStatus === "paid") {
            const timer = setTimeout(() => {
                navigate("/customer/payment/success", {
                    replace: true,
                    state: { paymentResult, bookingDetail },
                });
            }, 900);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentResult?.paymentStatus]);

    const timerMinutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const timerSeconds = String(timeLeft % 60).padStart(2, "0");

    const orderCode = paymentId ? `PAY${paymentId}` : "—";
    const isPaid = paymentResult?.paymentStatus === "paid";
    const originalAmount = Number(paymentResult?.originalAmount || bookingDetail?.totalAmount || 0);
    const discountAmount = Number(paymentResult?.discountAmount || 0);
    const finalAmountVnd = Number(paymentResult?.finalAmount || bookingDetail?.totalAmount || 0);

    // Phương thức thực tế đã dùng — ưu tiên payment đã tạo trên server (paymentResult),
    // fallback về lựa chọn hiện tại trên UI khi chưa tạo payment.
    const effectiveMethod =
        paymentResult?.paymentMethod === "paypal" || selectedMethod === "paypal" ? "paypal" : "vnpay";

    const firstService = bookingDetail?.details?.[0] ||
        bookingDetail?.bookingDetail?.[0] ||
        null;

    // Chỉ chặn thanh toán khi booking đã hủy / khách không đến.
    // Mọi trạng thái khác (pending/confirmed/in_progress/completed) đều cho phép thanh toán.
    const isBookingUnpayable =
        bookingDetail && (bookingDetail.status === "cancelled" || bookingDetail.status === "no_show");

    return (
        <>
            <div className="payment-page">
                <div className="payment-page-inner">
                    <h1>Thanh Toán</h1>
                    <p className="payment-page-subtitle">Vui lòng hoàn tất thông tin thanh toán cho dịch vụ của bạn.</p>

                    <div className="payment-layout">
                        <div className="payment-left">
                            <div className="booking-card">
                                <h3 className="section-subtitle">📅 Thông tin đặt lịch</h3>
                                <label>Booking ID</label>
                                <input value={bookingId ? `#${bookingId}` : ""} readOnly />
                            </div>

                            <div className="payment-method-card">
                                <div className="method-card-header">
                                    <h3 className="section-subtitle">💳 Phương thức thanh toán</h3>
                                    <span className="method-secure-tag">🔒 Bảo mật &amp; Mã hoá</span>
                                </div>

                                <div className="payment-method-grid">
                                    <div
                                        className={`method-card ${selectedMethod === "vnpay" ? "active" : ""} ${isPaid ? "disabled" : ""}`}
                                        title={isPaid ? "Đã thanh toán thành công — không thể đổi phương thức" : ""}
                                        onClick={() => {
                                            if (!isPaid) setSelectedMethod("vnpay");
                                        }}
                                    >
                                        <span className="method-icon">▦</span>
                                        <span>VNPAY</span>
                                    </div>
                                    <div
                                        className={`method-card ${selectedMethod === "paypal" ? "active" : ""} ${isPaid ? "disabled" : ""}`}
                                        title={isPaid ? "Đã thanh toán thành công — không thể đổi phương thức" : ""}
                                        onClick={() => {
                                            if (!isPaid) setSelectedMethod("paypal");
                                        }}
                                    >
                                        <span className="method-icon">🅿️</span>
                                        <span>PayPal</span>
                                    </div>
                                    <div className="method-card disabled" title="Sắp ra mắt">
                                        <span className="method-icon">👛</span>
                                        <span>Ví điện tử</span>
                                    </div>
                                </div>

                                {selectedMethod === "paypal" ? (
                                    <div className="method-summary-box">
                                        <span className="method-summary-icon">🅿️</span>
                                        <div>
                                            <strong>Thanh toán qua PayPal</strong>
                                            <p>Hỗ trợ thẻ Visa/Mastercard quốc tế và số dư PayPal. Số tiền sẽ được quy đổi sang USD.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="method-summary-box">
                                        <span className="method-summary-icon">▦</span>
                                        <div>
                                            <strong>Thanh toán qua VNPAY</strong>
                                            <p>Hỗ trợ tất cả ứng dụng ngân hàng tại Việt Nam</p>
                                        </div>
                                    </div>
                                )}

                                {isBookingUnpayable && (
                                    <div className="method-alert">
                                        Booking đang ở trạng thái "<strong>{bookingDetail.status}</strong>" nên không thể thanh toán.
                                    </div>
                                )}
                                {selectedMethod === "vnpay" && bookingDetail && !isBookingUnpayable && !paymentId && !qrLoading && (
                                    <p className="method-hint">Đang chuẩn bị mã QR thanh toán...</p>
                                )}
                                {selectedMethod === "vnpay" && qrLoading && <p className="method-hint">Đang tạo mã QR...</p>}
                                {selectedMethod === "paypal" && !isBookingUnpayable && (
                                    <p className="method-hint">
                                        Bấm "Thanh toán qua PayPal" bên dưới — bạn sẽ được chuyển sang trang PayPal
                                        để đăng nhập và xác nhận thanh toán.
                                    </p>
                                )}

                                {selectedMethod === "vnpay" && paymentId && qrImageUrl && (
                                    <div className="qr-panel">
                                        <div className="qr-panel-header">
                                            <span>Quét mã QR bằng App VNPAY / Mobile Banking</span>
                                            {!isPaid && timeLeft > 0 && (
                                                <span className="qr-countdown">
                                                    Hết hạn sau <strong>{timerMinutes}:{timerSeconds}</strong>
                                                </span>
                                            )}
                                            {!isPaid && timeLeft <= 0 && (
                                                <span className="qr-countdown">Đã hết hạn</span>
                                            )}
                                        </div>

                                        <div className="qr-panel-body">
                                            <div className="qr-frame">
                                                <img src={qrImageUrl} alt="Mã QR thanh toán VNPAY" />
                                            </div>
                                            <div className="qr-info">
                                                <div className="qr-info-row">
                                                    <span>Số tiền</span>
                                                    <strong>{finalAmountVnd.toLocaleString()}đ</strong>
                                                </div>
                                                <div className="qr-info-row">
                                                    <span>Mã giao dịch (vnp_TxnRef)</span>
                                                    <strong>{orderCode}</strong>
                                                </div>
                                                <div className="qr-info-row">
                                                    <span>Nhà cung cấp</span>
                                                    <strong>{STORE_NAME} · VNPAY</strong>
                                                </div>

                                                {!isPaid ? (
                                                    timeLeft > 0 ? (
                                                        <button
                                                            type="button"
                                                            className="qr-confirm-btn"
                                                            onClick={async () => {
                                                                setIsCheckingStatus(true);
                                                                await handleGetPayment(false);
                                                                setIsCheckingStatus(false);
                                                            }}
                                                            disabled={isCheckingStatus}
                                                        >
                                                            {isCheckingStatus ? "Đang kiểm tra..." : "Tôi đã thanh toán — Kiểm tra trạng thái"}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="qr-confirm-btn"
                                                            onClick={handleCreatePayment}
                                                            disabled={isLoading}
                                                        >
                                                            {isLoading ? "Đang tạo lại..." : "Tạo lại mã QR"}
                                                        </button>
                                                    )
                                                ) : (
                                                    <p className="status-paid">✅ VNPAY đã xác nhận thanh toán thành công.</p>
                                                )}
                                            </div>
                                        </div>

                                        {!isPaid && (
                                            <p className="qr-caution">
                                                ⚠️ Trang sẽ tự động kiểm tra trạng thái mỗi 5 giây sau khi VNPAY xác nhận
                                                giao dịch (qua vnpay-ipn). Vui lòng không tắt trình duyệt cho đến khi
                                                thanh toán hoàn tất. Nếu đã thanh toán nhưng chưa thấy cập nhật, bấm{" "}
                                                <button
                                                    type="button"
                                                    className="link-btn"
                                                    onClick={() => handleGetPayment(false)}
                                                >
                                                    tại đây
                                                </button>.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {errorMessage && (
                                <p className="error-message">{errorMessage}</p>
                            )}
                        </div>

                        <div className="payment-right">
                            <div className="summary-header">
                                <h2>Tóm Tắt Đặt Chỗ</h2>
                                <span className="summary-header-icon" aria-hidden="true">🚘</span>
                            </div>

                            <div className="summary-item">
                                <span>Dịch vụ</span>
                                <strong>{firstService?.serviceName || "-"}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Ngày</span>
                                <strong>{bookingDetail?.slotDate || bookingDetail?.bookingDate || "-"}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Giờ</span>
                                <strong className="summary-time">
                                    {bookingDetail?.startTime && bookingDetail?.endTime
                                        ? `${new Date(bookingDetail.startTime).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })} - ${new Date(bookingDetail.endTime).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}`
                                        : "-"}
                                </strong>
                            </div>
                            <div className="summary-item">
                                <span>Xe</span>
                                <span className="vehicle-chip">
                                    {bookingDetail?.licensePlate || "-"}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span>Booking ID</span>
                                <span>{bookingId || "-"}</span>
                            </div>
                            <div className="summary-item">
                                <span>Phương thức</span>
                                <span>{effectiveMethod === "paypal" ? "🅿️ PayPal" : "🏦 VNPAY QR"}</span>
                            </div>
                            <div className="summary-item no-border">
                                <span>Trạng thái</span>
                                <span className={`status-badge ${isPaid ? "status-badge--paid" : "status-badge--pending"}`}>
                                    {(paymentResult?.paymentStatus || "pending").toUpperCase()}
                                </span>
                            </div>

                            <div className="reward-box">
                                <label className="reward-box-header">
                                    🎫 Ưu đãi &amp; điểm thưởng
                                    <span className="reward-box-header-badge">không bắt buộc</span>
                                </label>

                                <div className="reward-box-body">
                                    <div className="promo-group">
                                        <span className="promo-group-label">🎁 Khuyến mãi hệ thống</span>
                                        {paymentPromotions.length === 0 ? (
                                            <p className="promo-empty-text">Không có khuyến mãi nào</p>
                                        ) : (
                                            <div className="promo-list">
                                                {paymentPromotions.map(p => {
                                                    const id = String(p.promotionId || p.id);
                                                    const pv = p.value || p.discountValue || 0;
                                                    const label = p.discountType?.toUpperCase() === "PERCENT" ? `-${pv}%` : `-${Number(pv).toLocaleString()}đ`;
                                                    return (
                                                        <label key={id} className={`promo-item ${promotionId === id ? "promo-item-selected" : ""}`}>
                                                            <input
                                                                type="radio" name="pay-promo"
                                                                checked={promotionId === id}
                                                                onChange={() => setPromotionId(id)}
                                                            />
                                                            <div className="promo-item-content">
                                                                <span className="promo-item-title">{p.title || p.promotionName}</span>
                                                                <span className="promo-item-badge">{label}</span>
                                                            </div>
                                                            <span className="promo-item-desc">{p.description || ""}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {promotionId && (
                                            <button className="promo-clear-btn" onClick={() => setPromotionId("")}>
                                                ✕ Bỏ chọn khuyến mãi
                                            </button>
                                        )}
                                    </div>

                                    <div className="promo-divider" />

                                    <div className="promo-group">
                                        <span className="promo-group-label">🏷️ Voucher của tôi</span>
                                        {paymentVouchers.length === 0 ? (
                                            <p className="promo-empty-text">Bạn chưa có voucher nào</p>
                                        ) : (
                                            <div className="promo-list">
                                                {paymentVouchers.map(v => (
                                                    <label key={v.customerRewardId} className={`promo-item ${voucherCode === v.voucherCode ? "promo-item-selected" : ""}`}>
                                                        <input
                                                            type="radio" name="pay-vouch"
                                                            checked={voucherCode === v.voucherCode}
                                                            onChange={() => { setVoucherCode(v.voucherCode); setRewardId(String(v.rewardId)); }}
                                                        />
                                                        <div className="promo-item-content">
                                                            <span className="promo-item-title">{v.rewardName || "Voucher"}</span>
                                                            <span className="promo-item-badge promo-item-badge--green">
                                                                -{Number(v.discountValue || 0).toLocaleString()}đ
                                                            </span>
                                                        </div>
                                                        <span className="promo-item-desc">{v.voucherCode}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {voucherCode && (
                                            <button className="promo-clear-btn" onClick={() => { setVoucherCode(""); setRewardId(""); }}>
                                                ✕ Bỏ chọn voucher
                                            </button>
                                        )}
                                    </div>

                                    {(promotionId || voucherCode) && (
                                        <div className="promo-applied-banner">
                                            Đã chọn ưu đãi (Hệ thống tự động áp dụng 1 cái cao nhất)
                                        </div>
                                    )}
                                </div>

                                <p className="reward-point-text">
                                    Bạn có <strong>{bookingDetail?.customerPoints || 0} điểm</strong> khả dụng
                                </p>
                            </div>

                            <div className="summary-total-box">
                                <div className="summary-item">
                                    <span>Tạm tính</span>
                                    <span>{originalAmount.toLocaleString()}đ</span>
                                </div>
                                <div className="summary-item discount">
                                    <span>Giảm giá</span>
                                    <span>-{discountAmount.toLocaleString()}đ</span>
                                </div>
                                <div className="summary-final">
                                    <span>Tổng cộng</span>
                                    <span>{finalAmountVnd.toLocaleString()}đ</span>
                                </div>
                            </div>

                            <button
                                className="pay-now-button"
                                onClick={effectiveMethod === "paypal" ? handlePayPalPay : handleCreatePayment}
                                disabled={isLoading || isBookingUnpayable || (effectiveMethod === "vnpay" && isPaid)}
                            >
                                <span>
                                    {isLoading
                                        ? "Đang xử lý..."
                                        : isBookingUnpayable
                                            ? "Booking không thể thanh toán"
                                            : effectiveMethod === "paypal"
                                                ? (paymentId ? "Tiếp tục với PayPal" : "Thanh Toán Qua PayPal")
                                                : (paymentId ? "Tạo lại mã QR" : "Xác Nhận & Hoàn Tất")}
                                </span>
                                {!isLoading && !isBookingUnpayable && (
                                    <span className="pay-now-arrow" aria-hidden="true">→</span>
                                )}
                            </button>

                            {paymentResult && (
                                <div className="payment-result-card">
                                    <h3>Payment Created</h3>
                                    <p>Payment ID: {paymentResult.paymentId}</p>
                                    <p>Booking ID: {paymentResult.bookingId}</p>
                                    <p>Status: {paymentResult.paymentStatus}</p>
                                    <p>Final Amount: {paymentResult.finalAmount}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
export default PaymentPage;