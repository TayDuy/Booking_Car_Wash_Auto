import "./PaymentPage.css";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient, { BACKEND_ROOT_URL } from "../../../api/axiosClient";
import promotionApi from "../../../api/promotionApi";
import { getMyRewards } from "../../../api/customerRewardApi";

const API_BASE = BACKEND_ROOT_URL;
const STORE_NAME = "AutoWash Pro";
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

    // Cấu hình ban đầu cho Voucher/Promotion từ location.state hoặc localStorage
    const promotionFromState = location.state?.promotionId || location.state?.selectedPromoId;
    const rewardFromState = location.state?.rewardId || location.state?.selectedRewardId;
    const voucherCodeFromState = location.state?.selectedVouchCode;

    const [selectedMethod, setSelectedMethod] = useState("vnpay");
    const paymentMethod = selectedMethod === "paypal" ? "paypal" : "bank_transfer";

    const [promotionId, setPromotionId] = useState(
        String(promotionFromState || "")
    );
    const [rewardId, setRewardId] = useState(
        String(rewardFromState || "")
    );
    const [voucherCode, setVoucherCode] = useState(
        voucherCodeFromState || ""
    );
    
    const [paymentVouchers, setPaymentVouchers] = useState([]);
    const [paymentPromotions, setPaymentPromotions] = useState([]);
    
    const [paymentResult, setPaymentResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [bookingDetail, setBookingDetail] = useState(null);
    const [qrImageUrl, setQrImageUrl] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [timeLeft, setTimeLeft] = useState(VNPAY_EXPIRE_SECONDS);

    const autoTriggeredRef = useRef(false);
    const qrObjectUrlRef = useRef(null);
    const debounceTimerRef = useRef(null);



    // Fetch vouchers khả dụng của khách và danh sách promotions hoạt động
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

    // API lấy thông tin chi tiết đặt lịch
    async function handleGetBookingDetail(id) {
        try {
            const response = await axiosClient.get(`/bookings/${id}`);
            const result = response.data?.data || response.data;
            setBookingDetail(result);
        } catch (error) {
            console.log("Cannot get booking detail", error);
        }
    }

    // Auto-redirect nếu booking đã được thanh toán hoặc đã bị hủy
    useEffect(() => {
        if (!bookingDetail) return;
        if (bookingDetail.paymentStatus?.toLowerCase() !== "paid") {
            if (bookingDetail.status === "cancelled" || bookingDetail.status === "no_show") {
                setErrorMessage(`Lịch hẹn này đã bị hủy hoặc ở trạng thái không thể thanh toán (${bookingDetail.status}).`);
            }
            return;
        }
        // Đã thanh toán -> redirect với paymentId để PaymentSuccessPage fetch real data
        const pid = bookingDetail.paymentId;
        if (pid) {
            navigate("/customer/payment/success?paymentId=" + pid, { replace: true });
        } else {
            navigate("/customer/home", { replace: true });
        }
    }, [bookingDetail, navigate]);

    // Load booking detail từ bookingId
    useEffect(() => {
        if (bookingId) {
            handleGetBookingDetail(bookingId).then(() => {});
        }
    }, [bookingId]);

    // Fetch VNPAY QR Code Image
    async function fetchVnpayQrImage(id) {
        setQrLoading(true);
        setErrorMessage("");
        try {
            const response = await axiosClient.get(`/payments/${id}/vnpay-qr`, {
                responseType: "blob",
            });
            const blob = response.data;
            if (qrObjectUrlRef.current) {
                URL.revokeObjectURL(qrObjectUrlRef.current);
            }
            const objectUrl = URL.createObjectURL(blob);
            qrObjectUrlRef.current = objectUrl;
            setQrImageUrl(objectUrl);
        } catch (error) {
            if (error.response?.data instanceof Blob) {
                error.response.data.text().then(t => {
                    try { 
                        const j = JSON.parse(t); 
                        setErrorMessage(j.message || j.error || t); 
                    } catch { 
                        setErrorMessage(t); 
                    }
                });
            } else {
                setErrorMessage(error.response?.data?.message || error.message || "Không tạo được mã QR VNPAY");
            }
        } finally {
            setQrLoading(false);
        }
    }

    // Tạo hoặc Cập nhật Payment record
    async function handleCreatePayment(silent = false) {
        if (!bookingId) return;

        const isUnpayable = bookingDetail && (bookingDetail.status === "cancelled" || bookingDetail.status === "no_show");
        if (isUnpayable) return;

        const data = {
            bookingId: Number(bookingId),
            paymentMethod: paymentMethod,
            promotionId: promotionId ? Number(promotionId) : null,
            rewardId: rewardId ? Number(rewardId) : null,
            voucherCode: voucherCode || null,
        };

        try {
            if (!silent) setIsLoading(true);
            setErrorMessage(""); // clear previous error
            const response = await axiosClient.post("/payments", data);
            const result = response.data?.data || response.data;

            setPaymentResult(result);
            setPaymentId(result.paymentId);
            
            if (selectedMethod === "vnpay") {
                await fetchVnpayQrImage(result.paymentId);
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || "Lỗi tạo thông tin thanh toán");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }

    // PayPal Order Flow
    async function handlePayPalPay() {
        setErrorMessage("");
        if (!bookingId) {
            setErrorMessage("Vui lòng cung cấp Booking ID");
            return;
        }

        const isUnpayable = bookingDetail && (bookingDetail.status === "cancelled" || bookingDetail.status === "no_show");
        if (isUnpayable) {
            setErrorMessage(`Không thể thanh toán cho booking đã ở trạng thái "${bookingDetail.status}".`);
            return;
        }

        setIsLoading(true);
        try {
            // Luôn gọi cập nhật/tạo payment record trước để sync voucher/method sang PayPal
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
            const currentPaymentId = result.paymentId;
            setPaymentId(currentPaymentId);

            const orderResponse = await axiosClient.post(`/payments/${currentPaymentId}/paypal-order`);
            const orderResult = orderResponse.data?.data || orderResponse.data;

            window.location.href = orderResult.approvalUrl;
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || "Lỗi kết nối PayPal");
        } finally {
            setIsLoading(false);
        }
    }

    // Lấy trạng thái Payment hiện tại (polling/manual check)
    async function handleGetPayment(silent = false) {
        if (!paymentId) return;
        try {
            const response = await axiosClient.get(`/payments/${paymentId}`);
            const result = response.data?.data || response.data;
            setPaymentResult(result);
            if (!silent) setErrorMessage("");
        } catch (error) {
            if (!silent) setErrorMessage(error.response?.data?.message || error.message || "Lỗi lấy trạng thái giao dịch");
            console.log("Cannot get payment", error);
        }
    }

    // Redirect xử lý query string từ VNPay/PayPal callback
    useEffect(() => {
        if (paymentIdFromQuery && !autoTriggeredRef.current) {
            autoTriggeredRef.current = true;
            setPaymentId(paymentIdFromQuery);
        } else if (paymentFailedFromQuery === "1") {
            const reasonMessages = {
                invalid_signature: "Chữ ký giao dịch không hợp lệ. Vui lòng thử lại.",
                invalid_order: "Không xác định được đơn hàng thanh toán.",
                order_not_found: "Không tìm thấy đơn hàng tương ứng.",
                payment_failed: "Giao dịch bị từ chối hoặc thất bại. Vui lòng thử lại.",
                paypal_cancelled: "Bạn đã hủy thanh toán PayPal. Vui lòng thử lại nếu muốn tiếp tục.",
                paypal_not_completed: "PayPal chưa xác nhận hoàn tất giao dịch. Vui lòng thử lại.",
                paypal_capture_failed: "Không xác nhận được thanh toán PayPal. Vui lòng thử lại.",
            };
            setErrorMessage(
                reasonMessages[failReasonFromQuery] || "Thanh toán không thành công. Vui lòng thử lại."
            );
        }
    }, [paymentIdFromQuery, paymentFailedFromQuery, failReasonFromQuery]);

    // Load lại trạng thái payment khi có ID
    useEffect(() => {
        if (paymentId && !qrImageUrl) {
            handleGetPayment(false).then(() => {});
        }
    }, [paymentId]);

    // Lấy booking detail dựa vào paymentResult nếu vào từ link redirect trực tiếp
    useEffect(() => {
        if (!bookingDetail && paymentResult?.bookingId) {
            handleGetBookingDetail(paymentResult.bookingId).then(() => {});
        }
    }, [paymentResult?.bookingId]);

    // Debounce Live-Sync call khi đổi voucher/method (định cấu hình 400ms)
    useEffect(() => {
        if (!bookingId || !bookingDetail) return;
        
        const isUnpayable = bookingDetail.status === "cancelled" || bookingDetail.status === "no_show";
        const isPaid = paymentResult?.paymentStatus === "paid" || bookingDetail.paymentStatus?.toLowerCase() === "paid";
        
        if (isUnpayable || isPaid) return;

        if (selectedMethod === "vnpay") {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                handleCreatePayment(true).then(() => {});
            }, 400);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [bookingId, bookingDetail?.status, selectedMethod, voucherCode, promotionId, paymentResult?.paymentStatus]);

    // Countdown Timer đếm ngược QR code VNPAY
    useEffect(() => {
        if (!qrImageUrl || paymentResult?.paymentStatus === "paid") return;
        setTimeLeft(VNPAY_EXPIRE_SECONDS);
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [qrImageUrl, paymentResult?.paymentStatus]);

    // Polling tự động mỗi 5s để cập nhật trạng thái đã thanh toán từ VNPAY IPN callback
    useEffect(() => {
        const isPaid = paymentResult?.paymentStatus === "paid" || bookingDetail?.paymentStatus?.toLowerCase() === "paid";
        if (!paymentId || !qrImageUrl || isPaid || timeLeft <= 0) {
            return;
        }
        const poller = setInterval(() => {
            handleGetPayment(true).then(() => {});
        }, 5000);
        return () => clearInterval(poller);
    }, [paymentId, qrImageUrl, paymentResult?.paymentStatus, bookingDetail?.paymentStatus, timeLeft]);

    // Dịch chuyển đến trang success khi payment đổi trạng thái sang paid
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
    }, [paymentResult?.paymentStatus, bookingDetail]);

    // Revoke object URL tránh rò rỉ bộ nhớ
    useEffect(() => {
        return () => {
            if (qrObjectUrlRef.current) {
                URL.revokeObjectURL(qrObjectUrlRef.current);
            }
        };
    }, []);

    const timerMinutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const timerSeconds = String(timeLeft % 60).padStart(2, "0");

    const orderCode = paymentId ? `PAY${paymentId}` : "—";
    const isPaid = paymentResult?.paymentStatus === "paid" || bookingDetail?.paymentStatus?.toLowerCase() === "paid";
    
    // Price breakdown
    const serviceTotal = Number(bookingDetail?.totalAmount || 0);
    const isSuvOrTruck = bookingDetail?.vehicleType?.toLowerCase() === "suv" || bookingDetail?.vehicleType?.toLowerCase() === "truck";
    const surcharge = isSuvOrTruck ? 50000 : 0;
    const subtotal = serviceTotal + surcharge;
    const tax = Math.round(subtotal * 0.08);

    const originalAmount = Number(paymentResult?.originalAmount || (subtotal + tax));
    
    // Giảm giá online 5% nếu chọn VNPAY/PayPal
    const isOnline = selectedMethod === "vnpay" || selectedMethod === "paypal";
    const tempOnlineDiscount = isOnline ? Math.round(subtotal * 0.05) : 0;

    const onlineDiscount = paymentResult ? Number(paymentResult.onlineDiscount || 0) : tempOnlineDiscount;
    const voucherDiscount = Number(paymentResult?.voucherDiscount || 0);
    const promoDiscount = Number(paymentResult?.promoDiscount || 0);
    const tierDiscount = Number(paymentResult?.tierDiscount || 0);

    const finalAmountToShow = paymentResult 
        ? Number(paymentResult.finalAmount || 0) 
        : Math.max(0, originalAmount - onlineDiscount - voucherDiscount - promoDiscount - tierDiscount);

    const effectiveMethod = paymentResult?.paymentMethod === "paypal" || selectedMethod === "paypal" ? "paypal" : "vnpay";
    const firstService = bookingDetail?.details?.[0] || bookingDetail?.bookingDetail?.[0] || null;
    const isBookingUnpayable = bookingDetail && (bookingDetail.status === "cancelled" || bookingDetail.status === "no_show");

    return (
        <div className="payment-page">
            <div className="payment-page-inner">
                {/* Thanh tiến trình 3 bước Stripe-style */}
                <div className="payment-progress-steps">
                    <div className="step-item completed">
                        <span className="step-num">✓</span>
                        <span className="step-label">Đặt lịch</span>
                    </div>
                    <div className="step-line completed"></div>
                    <div className="step-item active">
                        <span className="step-num">2</span>
                        <span className="step-label">Thanh toán</span>
                    </div>
                    <div className="step-line"></div>
                    <div className="step-item">
                        <span className="step-num">3</span>
                        <span className="step-label">Hoàn tất</span>
                    </div>
                </div>

                <div className="payment-page-header">
                    <h1>Xác nhận &amp; Thanh toán</h1>
                    <p className="payment-page-subtitle">
                        Mã đặt lịch: <strong>{bookingDetail?.bookingCode || `#${bookingId}`}</strong>
                    </p>
                </div>

                <div className="payment-layout">
                    {/* Cột trái: Phương thức thanh toán & QR Code */}
                    <div className="payment-left">
                        <div className="payment-method-card">
                            <div className="method-card-header">
                                <h3 className="section-subtitle">
                                    <span className="material-symbols-outlined">account_balance_wallet</span>
                                    Chọn phương thức thanh toán
                                </h3>
                            </div>

                            <div className="payment-method-grid">
                                <div
                                    className={`method-card ${selectedMethod === "vnpay" ? "active" : ""} ${isPaid ? "disabled" : ""}`}
                                    onClick={() => { if (!isPaid) setSelectedMethod("vnpay"); }}
                                >
                                    <span className="method-icon-img vnpay-logo" />
                                    <span>VNPAY QR</span>
                                </div>
                                <div
                                    className={`method-card ${selectedMethod === "paypal" ? "active" : ""} ${isPaid ? "disabled" : ""}`}
                                    onClick={() => { if (!isPaid) setSelectedMethod("paypal"); }}
                                >
                                    <span className="method-icon-img paypal-logo" />
                                    <span>PayPal</span>
                                </div>
                                <div className="method-card disabled" title="Sắp ra mắt">
                                    <span className="material-symbols-outlined method-icon">payments</span>
                                    <span>Ví điện tử</span>
                                </div>
                            </div>

                            {selectedMethod === "paypal" ? (
                                <div className="method-summary-box">
                                    <span className="method-summary-icon">🅿️</span>
                                    <div>
                                        <strong>Thanh toán qua cổng PayPal quốc tế</strong>
                                        <p>Hỗ trợ tất cả thẻ tín dụng Visa/Mastercard và số dư PayPal. Số tiền được quy đổi sang USD tự động.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="method-summary-box">
                                    <span className="method-summary-icon">🏦</span>
                                    <div>
                                        <strong>Thanh toán qua cổng VNPAY nội địa</strong>
                                        <p>Quét mã nhanh bằng ứng dụng Mobile Banking ngân hàng hoặc ví điện tử cực kỳ tiện lợi.</p>
                                    </div>
                                </div>
                            )}

                            {isBookingUnpayable && (
                                <div className="method-alert error">
                                    Lịch hẹn này đã bị hủy hoặc đánh dấu vắng mặt. Không thể thực hiện thanh toán.
                                </div>
                            )}

                            {selectedMethod === "vnpay" && bookingDetail && !isBookingUnpayable && !paymentId && !qrLoading && !errorMessage && (
                                <div className="qr-skeleton-loader">
                                    <div className="spinner" />
                                    <p>Đang chuẩn bị mã QR thanh toán...</p>
                                </div>
                            )}
                            
                            {selectedMethod === "vnpay" && qrLoading && (
                                <div className="qr-skeleton-loader">
                                    <div className="spinner" />
                                    <p>Đang tạo mã QR bảo mật...</p>
                                </div>
                            )}

                            {selectedMethod === "paypal" && !isBookingUnpayable && (
                                <div className="paypal-cta-box">
                                    <p className="paypal-hint">
                                        Vui lòng nhấn nút <strong>"Thanh toán qua PayPal"</strong> ở cột tóm tắt bên phải. Hệ thống sẽ mở cổng PayPal chính thức để hoàn tất giao dịch an toàn.
                                    </p>
                                </div>
                            )}

                            {selectedMethod === "vnpay" && paymentId && qrImageUrl && (
                                <div className="qr-panel">
                                    <div className="qr-panel-header">
                                        <span className="qr-guide-text">Quét mã QR để hoàn tất</span>
                                        {!isPaid && timeLeft > 0 && (
                                            <span className="qr-countdown">
                                                Hết hiệu lực sau: <strong>{timerMinutes}:{timerSeconds}</strong>
                                            </span>
                                        )}
                                        {!isPaid && timeLeft <= 0 && (
                                            <span className="qr-countdown expired">Mã QR đã hết hạn</span>
                                        )}
                                    </div>

                                    <div className="qr-panel-body">
                                        <div className="qr-frame">
                                            <img src={qrImageUrl} alt="Mã QR thanh toán VNPAY" />
                                            {isPaid && (
                                                <div className="qr-overlay paid">
                                                    <span className="material-symbols-outlined check-icon">check_circle</span>
                                                    <span>ĐÃ THANH TOÁN</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="qr-info">
                                            <div className="qr-info-row">
                                                <span>Số tiền cần trả</span>
                                                <strong className="qr-amount-text">{finalAmountToShow.toLocaleString()}đ</strong>
                                            </div>
                                            <div className="qr-info-row">
                                                <span>Nội dung (TxnRef)</span>
                                                <strong>{orderCode}</strong>
                                            </div>
                                            <div className="qr-info-row">
                                                <span>Đối tác</span>
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
                                                        {isCheckingStatus ? (
                                                            <>
                                                                <span className="spinner-inline" />
                                                                Đang xác minh...
                                                            </>
                                                        ) : (
                                                            "Tôi đã chuyển khoản - Kiểm tra ngay"
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="qr-confirm-btn expired"
                                                        onClick={() => handleCreatePayment()}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? "Đang tạo lại..." : "Tạo mã QR mới"}
                                                    </button>
                                                )
                                            ) : (
                                                <p className="status-paid-badge">
                                                    <span className="material-symbols-outlined">verified</span>
                                                    VNPAY đã ghi nhận thanh toán.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {!isPaid && (
                                        <p className="qr-caution">
                                            ⚠️ Hệ thống sẽ tự động cập nhật trạng thái sau mỗi 5 giây sau khi nhận được tín hiệu từ ngân hàng. Vui lòng không đóng trang này.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {errorMessage && (
                            <div className="method-alert error">{errorMessage}</div>
                        )}
                        
                        {/* Trust Signals & Security badging */}
                        <div className="payment-trust-signals">
                            <span className="material-symbols-outlined trust-icon">lock</span>
                            <span>Mọi kết nối đều được bảo mật SSL 256-bit &amp; Tuân thủ tiêu chuẩn PCI-DSS của VNPAY/PayPal</span>
                        </div>
                    </div>

                    {/* Cột phải: Tóm tắt dịch vụ & Voucher Selection */}
                    <div className="payment-right">
                        <div className="summary-card">
                            <div className="summary-header">
                                <h2>Tóm tắt đơn hàng</h2>
                                <span className="material-symbols-outlined header-icon">receipt_long</span>
                            </div>

                            <div className="summary-booking-details">
                                <div className="summary-detail-row">
                                    <span className="detail-label">Dịch vụ</span>
                                    <strong className="detail-value">{firstService?.serviceName || "—"}</strong>
                                </div>
                                <div className="summary-detail-row">
                                    <span className="detail-label">Lịch hẹn</span>
                                    <span className="detail-value">
                                        📅 {bookingDetail?.slotDate || bookingDetail?.bookingDate || "—"}{" "}
                                        {bookingDetail?.startTime && (
                                            <>
                                                · ⏰ {new Date(bookingDetail.startTime).toLocaleTimeString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </>
                                        )}
                                    </span>
                                </div>
                                <div className="summary-detail-row">
                                    <span className="detail-label">Xe của bạn</span>
                                    <span className="vehicle-badge-pill">
                                        <span className="material-symbols-outlined">directions_car</span>
                                        {bookingDetail?.vehicleNickname 
                                            ? `${bookingDetail.vehicleNickname} (${bookingDetail.licensePlate})`
                                            : bookingDetail?.licensePlate || "—"}
                                    </span>
                                </div>
                                <div className="summary-detail-row">
                                    <span className="detail-label">Chi nhánh</span>
                                    <span className="detail-value">{bookingDetail?.branchName || "AutoWash Pro"}</span>
                                </div>
                            </div>

                            {/* Voucher & Rewards list dạng card radio Shadcn-ui */}
                            <div className="payment-voucher-section">
                                <div className="voucher-section-title">
                                    <span className="material-symbols-outlined">confirmation_number</span>
                                    Voucher &amp; Ưu đãi
                                    <span className="badge-optional">Không bắt buộc</span>
                                </div>

                                {paymentVouchers.length === 0 ? (
                                    <p className="voucher-empty-text">Bạn hiện chưa có voucher nào khả dụng.</p>
                                ) : (
                                    <div className="payment-voucher-list">
                                        {paymentVouchers.map(v => {
                                            const isSelected = voucherCode === v.voucherCode;
                                            return (
                                                <label 
                                                    key={v.customerRewardId} 
                                                    className={`payment-voucher-card ${isSelected ? "selected" : ""} ${isPaid ? "disabled" : ""}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment-voucher-option"
                                                        checked={isSelected}
                                                        disabled={isPaid}
                                                        onChange={() => {
                                                            setVoucherCode(v.voucherCode);
                                                            setRewardId(String(v.rewardId));
                                                        }}
                                                    />
                                                    <div className="voucher-radio-circle" />
                                                    <div className="voucher-card-info">
                                                        <div className="voucher-card-title-row">
                                                            <span className="voucher-name">{v.rewardName || "Ưu đãi thăng hạng"}</span>
                                                            <span className="voucher-discount-badge">
                                                                -{Number(v.discountValue || 0).toLocaleString()}đ
                                                            </span>
                                                        </div>
                                                        <span className="voucher-code-text">{v.voucherCode}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {voucherCode && !isPaid && (
                                    <button 
                                        type="button"
                                        className="voucher-clear-btn" 
                                        onClick={() => {
                                            setVoucherCode("");
                                            setRewardId("");
                                        }}
                                    >
                                        ✕ Hủy áp dụng voucher
                                    </button>
                                )}

                                <p className="points-status-text">
                                    <span className="material-symbols-outlined">stars</span>
                                    Bạn có <strong>{bookingDetail?.customerPoints || 0} điểm</strong> tích lũy khả dụng
                                </p>
                            </div>

                            {/* Stripe-like Price Breakdown chi tiết */}
                            <div className="payment-price-breakdown">
                                <div className="breakdown-row">
                                    <span>Tạm tính dịch vụ</span>
                                    <span>{serviceTotal.toLocaleString()}đ</span>
                                </div>
                                {surcharge > 0 && (
                                    <div className="breakdown-row surcharge">
                                        <span>Phụ phí xe cỡ lớn (SUV/Truck)</span>
                                        <span>+{surcharge.toLocaleString()}đ</span>
                                    </div>
                                )}
                                <div className="breakdown-row tax">
                                    <span>Thuế GTGT (VAT 8%)</span>
                                    <span>{tax.toLocaleString()}đ</span>
                                </div>

                                <div className="breakdown-divider" />

                                {onlineDiscount > 0 && (
                                    <div className="breakdown-row discount-applied">
                                        <span>Giảm giá thanh toán online (5%)</span>
                                        <span className="discount-minus">-{onlineDiscount.toLocaleString()}đ</span>
                                    </div>
                                )}
                                
                                {promoDiscount > 0 && (
                                    <div className="breakdown-row discount-applied">
                                        <span>Khuyến mãi hệ thống ({paymentResult?.promotionName || "Ưu đãi"})</span>
                                        <span className="discount-minus">-{promoDiscount.toLocaleString()}đ</span>
                                    </div>
                                )}

                                {voucherDiscount > 0 && (
                                    <div className="breakdown-row discount-applied">
                                        <span>Chiết khấu Voucher ({voucherCode})</span>
                                        <span className="discount-minus">-{voucherDiscount.toLocaleString()}đ</span>
                                    </div>
                                )}

                                {tierDiscount > 0 && (
                                    <div className="breakdown-row discount-applied">
                                        <span>Chiết khấu hạng thành viên</span>
                                        <span className="discount-minus">-{tierDiscount.toLocaleString()}đ</span>
                                    </div>
                                )}

                                <div className="breakdown-divider" />

                                <div className="breakdown-final-row">
                                    <span>Tổng thanh toán</span>
                                    <span className="final-price">{finalAmountToShow.toLocaleString()}đ</span>
                                </div>
                            </div>

                            {/* PayPal Action Button nếu chọn PayPal */}
                            {selectedMethod === "paypal" && (
                                <button
                                    type="button"
                                    className="paypal-pay-btn"
                                    onClick={handlePayPalPay}
                                    disabled={isLoading || isBookingUnpayable || isPaid}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-inline" />
                                            Đang chuyển hướng PayPal...
                                        </>
                                    ) : (
                                        <>
                                            <span>Thanh toán bằng PayPal</span>
                                            <span className="pay-arrow">→</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentPage;