import { useState } from "react";
import "./RefundRequestModal.css";

/**
 * Popup xác nhận "Yêu cầu hoàn tiền" — dùng chung cho khách hàng, áp dụng như nhau
 * cho cả booking thanh toán online (VNPAY/PayPal) và tại quầy (tiền mặt/POS).
 * Khách chỉ cần nhập lý do; backend tự xác định phương thức hoàn tiền.
 *
 * Props:
 *  - open: boolean
 *  - booking: { bookingCode, finalAmount, paymentMethod }
 *  - loading: boolean
 *  - errorMessage: string
 *  - onCancel: () => void
 *  - onConfirm: (reason: string) => void
 */
export default function RefundRequestModal({
                                               open,
                                               booking,
                                               loading = false,
                                               errorMessage = "",
                                               onCancel,
                                               onConfirm,
                                           }) {
    const [reason, setReason] = useState("");

    if (!open) return null;

    const isOnline =
        booking?.paymentMethod === "bank_transfer" || booking?.paymentMethod === "paypal";

    function handleConfirm() {
        if (!reason.trim()) return;
        onConfirm(reason.trim());
    }

    function handleClose() {
        setReason("");
        onCancel();
    }

    return (
        <div className="refund-request-overlay" role="presentation" onClick={handleClose}>
            <div
                className="refund-request-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="refund-request-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="refund-request-icon">
                    <span className="material-symbols-outlined">currency_exchange</span>
                </div>

                <h3 id="refund-request-title">Yêu cầu hoàn tiền</h3>
                <p className="refund-request-subtitle">
                    Mã đặt lịch: <strong>{booking?.bookingCode || "—"}</strong>
                </p>

                <div className="refund-request-summary">
                    <div className="refund-request-summary-row">
                        <span>Số tiền đã thanh toán</span>
                        <strong>{Number(booking?.finalAmount || 0).toLocaleString()}đ</strong>
                    </div>
                    <div className="refund-request-summary-row">
                        <span>Phương thức hoàn tiền</span>
                        <strong>
                            {isOnline
                                ? "Hoàn về phương thức thanh toán gốc"
                                : "Hoàn tiền mặt / chuyển khoản (nhân viên liên hệ xác nhận)"}
                        </strong>
                    </div>
                </div>

                <label className="refund-request-field">
<span>
Lý do yêu cầu hoàn tiền <span className="required">*</span>
</span>
                    <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="VD: Tôi muốn hủy lịch vì bận việc đột xuất, không đến rửa xe được..."
                        autoFocus
                    />
                </label>

                {errorMessage && (
                    <div className="refund-request-error">{errorMessage}</div>
                )}

                <p className="refund-request-note">
                    Sau khi gửi, yêu cầu sẽ được quản trị viên xem xét và duyệt. Bạn có thể
                    theo dõi trạng thái xử lý trong lịch sử đặt lịch của mình.
                </p>

                <div className="refund-request-actions">
                    <button
                        type="button"
                        className="refund-request-btn secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="refund-request-btn primary"
                        onClick={handleConfirm}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? "Đang gửi..." : "Xác nhận gửi yêu cầu"}
                    </button>
                </div>
            </div>
        </div>
    );
}