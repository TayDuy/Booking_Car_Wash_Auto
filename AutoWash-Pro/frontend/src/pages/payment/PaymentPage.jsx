import "./PaymentPage.css";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function PaymentPage() {
    const [bookingId, setBookingId] = useState(100);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [promotionId, setPromotionId] = useState("");
    const [rewardId, setRewardId] = useState("");
    const [paymentResult, setPaymentResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [bankName, setBankName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
    const bookingIdFromBookingPage = location.state?.bookingId;
    const [bookingDetail, setBookingDetail] = useState(null);
    useEffect(() => {
        if (bookingIdFromBookingPage) {
            setBookingId(String(bookingIdFromBookingPage));
        }
    }, [bookingIdFromBookingPage]);
    async function handleCreatePayment() {

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

        if (!paymentMethod) {
            setErrorMessage("Please select payment method");
            return;
        }

        const data = {
            bookingId: Number(bookingId),
            paymentMethod: paymentMethod,
            promotionId: promotionId ? Number(promotionId) : null,
            rewardId: rewardId ? Number(rewardId) : null,
        };

        console.log("Token: ", localStorage.getItem("token"));
        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:8080/api/v1/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                setPaymentResult(result);
                setPaymentId(result.paymentId);
                setErrorMessage("");
            } else {
                setPaymentResult(null);
                setErrorMessage(result.message);
            }
        } catch (error) {
            setErrorMessage("Network Error");
        } finally {
            setIsLoading(false);
        }
    }
    async function handleMarkAsPaid() {
        if (!paymentId) {
            setErrorMessage("Please enter Payment ID");
            return;
        }
        const data = {
            paymentStatus: "paid",
        };

        console.log("Update payment status:", data);
        console.log("Payment ID: ", paymentId);
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:8080/api/v1/payments/${paymentId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            console.log(result);

            if (response.ok) {
                setPaymentResult(result);
                setErrorMessage("");
            } else {
                setErrorMessage(result.message);
            }

            console.log("Payment updated successfully");
        } catch (error) {
            setErrorMessage("Network Error");
        } finally {
            setIsLoading(false);
        }

    }

    async function handleGetPayment() {

        console.log("Get payment ID:", paymentId);

        const response = await fetch(`http://localhost:8080/api/v1/payments/${paymentId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
        });

        const result = await response.json();
        console.log(result);

        if (response.ok) {
            setPaymentResult(result);
            setErrorMessage("");
        } else {
            setPaymentResult(null);
            setErrorMessage(result.message);
        }
    }

    async function handleGetBookingDetail(id) {
        try {
            const response = await fetch(`http://localhost:8080/api/v1/bookings/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                console.log("Booking Detail:", result);
                setBookingDetail(result);
            } else {
                console.log(result.message);
            }
        } catch (error) {
            console.log("Cannot get booking detail", error);
        }
    }

    useEffect(() => {
        console.log("bookingId =", bookingId);
        if (bookingId) {
            handleGetBookingDetail(bookingId);
        }
    }, [bookingId]);

    const firstService = bookingDetail?.details?.[0] ||
        bookingDetail?.bookingDetail?.[0] ||
        null;
    return (
        <div className="payment-page">
            <h1>Thanh Toán</h1>
            <p>Vui lòng hoàn tất thông tin thanh toán cho dịch vụ của bạn.</p>

            <div className="payment-layout">
                <div className="payment-left">
                    <h2 className="payment-section-title">
                        Thông Tin Thanh Toán
                    </h2>
                    <div className="booking-card">
                        <h3 className="section-subtitle">
                            Thông tin đặt lịch
                        </h3>
                        <label>Booking ID</label>
                        <input
                            value={bookingId}
                            readOnly />
                    </div>

                    {/* <div>
                        <label>Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}>

                            <option value="">
                                Choose Method
                            </option>

                            <option value="cash">
                                Cash
                            </option>

                            <option value="bank_transfer">
                                Bank Transfer
                            </option>

                            <option value="momo">
                                MoMo
                            </option>

                            <option value="zalopay">
                                ZaloPay
                            </option>
                        </select>
                    </div> */}
                    <div className="payment-method-card">
                        <h3 className="section-subtitle">Chọn phương thức thanh toán</h3>

                        <div className="wallet-bank-layout">
                            <button
                                type="button"
                                className={paymentMethod === "cash" ? "method-card active" : "method-card"}
                                onClick={() => setPaymentMethod("cash")}
                            >
                                💵 Cash
                            </button>

                            <button
                                type="button"
                                className={paymentMethod === "bank_transfer" ? "method-card active" : "method-card"}
                                onClick={() => setPaymentMethod("bank_transfer")}
                            >
                                🏦 Bank Transfer
                            </button>

                            <button
                                type="button"
                                className={paymentMethod === "momo" ? "method-card active" : "method-card"}
                                onClick={() => setPaymentMethod("momo")}
                            >
                                📱 MoMo
                            </button>

                            <button
                                type="button"
                                className={paymentMethod === "zalopay" ? "method-card active" : "method-card"}
                                onClick={() => setPaymentMethod("zalopay")}
                            >
                                💳 ZaloPay
                            </button>
                        </div>
                        {paymentMethod && (
                            <p className="selected-method">
                                Phương thức đã chọn:
                                <strong> {paymentMethod || "None"} </strong>
                            </p>
                        )}
                    </div>

                    {paymentMethod === "bank_transfer" && (
                        <div className="method-detail-card">
                            <h3>🏦 Chuyển Khoản Ngân Hàng</h3>

                            <p className="method-description">
                                Vui lòng chuyển khoản tới tài khoản cửa hàng bên dưới.
                            </p>

                            <div className="bank-info-box">
                                <div>
                                    <span>Ngân hàng</span>
                                    <strong>Vietcombank</strong>
                                </div>

                                <div>
                                    <span>Số tài khoản</span>
                                    <strong>123456789</strong>
                                </div>

                                <div>
                                    <span>Chủ tài khoản</span>
                                    <strong>WASHFLOW PRO</strong>
                                </div>

                                <div>
                                    <span>Nội dung</span>
                                    <strong>BOOKING-{bookingId || "..."}</strong>
                                </div>
                            </div>

                            <div className="fake-qr">QR</div>
                        </div>
                    )}
                    {paymentMethod === "momo" && (
                        <div className="method-detail-card">
                            <h3>Momo Payment</h3>
                            <div className="fake-qr">QR</div>
                            <p>Scan QR or confirm payment via MoMo app</p>
                        </div>
                    )}

                    {paymentMethod === "zalopay" && (
                        <div className="method-detail-card">
                            <h3>ZaloPay Payment</h3>
                            <div className="fake-qr">QR</div>
                            <p>Scan QR or confirm payment via ZaloPay app</p>
                        </div>
                    )}

                    {paymentMethod === "cash" && (
                        <div className="method-detail-card">
                            <h3>Cash Payment</h3>
                            <p>Customer will pay dircetly at the car wash branch</p>
                        </div>
                    )}
                    <div className="promo-card">
                        <h3>Promotion & Reward</h3>

                        <label>Promotion ID</label>
                        <input
                            type="text"
                            value={promotionId}
                            onChange={(e) => setPromotionId(e.target.value)} />

                        <label>Reward ID</label>
                        <input
                            type="text"
                            value={rewardId}
                            onChange={(e) => setRewardId(e.target.value)} />

                    </div>
                    {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                    )}

                </div>

                <div className="payment-right">
                    <h2>Tóm Tắt Đặt Chỗ</h2>

                    <div className="summary-service">
                        <div className="service-image-placeholder">
                            🚗
                        </div>

                        <div>
                            <h4>{firstService?.serviceName || "-"}</h4>
                            <p>{firstService?.description}</p>
                        </div>
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

                        <div className="vehicle-info">
                            <strong>
                                {bookingDetail?.vehicleBrand} {bookingDetail?.vehicleModel}
                            </strong>

                            <div className="vehicle-plate">
                                {bookingDetail?.licensePlate}
                            </div>
                        </div>
                    </div>
                    <div className="summary-item">
                        <span>Booking ID</span>
                        <span>{bookingId || "-"}</span>
                    </div>
                    <div className="summary-item">
                        <span>Payment Method</span>
                        <span>
                            {
                                paymentMethod === "cash"
                                    ? "💵 Cash"
                                    : paymentMethod === "momo"
                                        ? "📱 MoMo"
                                        : paymentMethod === "zalopay"
                                            ? "💳 ZaloPay"
                                            : paymentMethod === "bank_transfer"
                                                ? "🏦 Bank Transfer"
                                                : "-"
                            }
                        </span>
                    </div>
                    <div className="summary-item">
                        <span>Promotion</span>
                        <span>{promotionId || "-"}</span>
                    </div>
                    <div className="summary-item">
                        <span>Reward</span>
                        <span>{rewardId || "-"}</span>
                    </div>
                    <div className="summary-item">
                        <span>Status</span>
                        <span className={paymentResult?.paymentStatus === "paid" ? "status-paid" : "status-pending"}>
                            {paymentResult?.paymentStatus || "Pending"}
                        </span>
                    </div>

                    <div className="reward-box">
                        <label>SỬ DỤNG ĐIỂM TÍCH LUỸ</label>
                        <div className="reward-input-row">
                            <input
                                type="text"
                                placeholder="Nhập mã hoặc số điểm"
                                value={rewardId}
                                onChange={(e) => setRewardId(e.target.value)}
                            />
                            <button type="button">Áp dụng</button>
                        </div>
                        <p className="reward-point-text">
                            Bạn có <strong>{bookingDetail?.customerPoints || 0} điểm</strong> khả dụng.
                        </p>
                    </div>

                    <div className="summary-total-box">
                        <div className="summary-item">
                            <span>Tạm tính</span>
                            <span>{Number(paymentResult?.originalAmount || bookingDetail?.totalAmount || 0).toLocaleString()}đ</span>
                        </div>
                        <div className="summary-item discount">
                            <span>Giảm giá</span>
                            <span>-{Number(paymentResult?.discountAmount || 0).toLocaleString()}đ</span>
                        </div>
                        <div className="summary-final">
                            <span>Tổng cộng</span>
                            <span>{Number(paymentResult?.finalAmount || bookingDetail?.totalAmount || 0).toLocaleString()}đ</span>
                        </div>
                    </div>

                    <button
                        className="pay-now-button"
                        onClick={handleCreatePayment}
                        disabled={!paymentMethod || isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Thanh Toán Ngay"}
                    </button>

                    {paymentResult && (
                        <div className="payment-result-card">
                            <h3>Payment Created</h3>
                            <p>Payment ID: {paymentResult.paymentId}</p>
                            <p>Booking ID: {paymentResult.bookingId}</p>
                            <p>Status: {paymentResult.paymentStatus}</p>
                            <p>Final Amount:{paymentResult.finalAmount}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default PaymentPage;