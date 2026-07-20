// frontend/src/features/employee/pages/Employeerefundspage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    RefreshCw,
    Search,
    Undo2,
} from "lucide-react";

import refundApi from "../../../api/refundApi";

import "./EmployeeRefundsPage.css";

const INITIAL_FORM = {
    amount: "",
    reason: "",
    refundMethod: "cash",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
};

function unwrapObject(response) {
    return response?.data?.data ?? response?.data ?? null;
}

function unwrapList(response) {
    const root = response?.data;
    const result = root?.data ?? root;

    return Array.isArray(result) ? result : [];
}

function normalizeValue(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN");
}

function formatDateTime(value) {
    if (!value) {
        return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getStatusLabel(status) {
    switch (normalizeValue(status)) {
        case "pending":
            return "Chờ xử lý";

        case "processing":
            return "Đang xử lý";

        case "approved":
            return "Đã duyệt (chờ chuyển tiền)";

        case "completed":
            return "Đã hoàn tiền";

        case "rejected":
            return "Đã từ chối";

        default:
            return status || "N/A";
    }
}

function getStatusClass(status) {
    switch (normalizeValue(status)) {
        case "pending":
            return "pending";

        case "processing":
            return "processing";

        case "approved":
            return "approved";

        case "completed":
            return "completed";

        case "rejected":
            return "rejected";

        default:
            return "default";
    }
}

export default function EmployeeRefundsPage() {
    const [bookingCode, setBookingCode] = useState("");
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const [form, setForm] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);

    const [myRefunds, setMyRefunds] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [completingId, setCompletingId] = useState(null);

    useEffect(() => {
        loadMyRefunds();
    }, []);

    async function loadMyRefunds() {
        setListLoading(true);

        try {
            const response = await refundApi.mine();
            const list = unwrapList(response).sort((first, second) => {
                return (
                    new Date(second.createdAt || 0).getTime() -
                    new Date(first.createdAt || 0).getTime()
                );
            });

            setMyRefunds(list);
        } catch (error) {
            console.error("Load my refunds failed:", error);
            setMyRefunds([]);
        } finally {
            setListLoading(false);
        }
    }

    async function handleLookup(event) {
        event.preventDefault();

        if (!bookingCode.trim()) {
            alert("Vui lòng nhập mã booking.");
            return;
        }

        setLookupLoading(true);
        setLookupResult(null);
        setForm(INITIAL_FORM);

        try {
            const response = await refundApi.lookupByBookingCode(bookingCode.trim());
            const result = unwrapObject(response);

            setLookupResult(result);

            if (result?.eligible) {
                setForm((previous) => ({
                    ...previous,
                    amount: result.finalAmount != null ? String(result.finalAmount) : "",
                }));
            }
        } catch (error) {
            console.error("Lookup refund failed:", error);

            alert(
                error.response?.data?.message ||
                "Không tìm thấy giao dịch với mã booking này."
            );
        } finally {
            setLookupLoading(false);
        }
    }

    function updateForm(field, value) {
        setForm((previous) => ({ ...previous, [field]: value }));
    }

    const maxAmount = Number(lookupResult?.finalAmount || 0);

    const amountError = useMemo(() => {
        if (!form.amount) {
            return null;
        }

        const value = Number(form.amount);

        if (Number.isNaN(value) || value <= 0) {
            return "Số tiền phải lớn hơn 0.";
        }

        if (maxAmount && value > maxAmount) {
            return `Số tiền không được vượt quá ${formatMoney(maxAmount)} đ.`;
        }

        return null;
    }, [form.amount, maxAmount]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!lookupResult?.eligible) {
            alert("Giao dịch chưa đủ điều kiện để tạo yêu cầu hoàn tiền.");
            return;
        }

        if (amountError) {
            alert(amountError);
            return;
        }

        if (!form.reason.trim()) {
            alert("Vui lòng nhập lý do hoàn tiền.");
            return;
        }

        if (
            form.refundMethod === "bank_transfer" &&
            (!form.bankName.trim() ||
                !form.bankAccountNumber.trim() ||
                !form.bankAccountName.trim())
        ) {
            alert("Vui lòng nhập đầy đủ thông tin ngân hàng.");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                paymentId: lookupResult.paymentId,
                amount: Number(form.amount),
                reason: form.reason.trim(),
                refundMethod: form.refundMethod,
                bankName: form.refundMethod === "bank_transfer" ? form.bankName.trim() : null,
                bankAccountNumber:
                    form.refundMethod === "bank_transfer" ? form.bankAccountNumber.trim() : null,
                bankAccountName:
                    form.refundMethod === "bank_transfer" ? form.bankAccountName.trim() : null,
            };

            await refundApi.create(payload);

            alert("Đã tạo yêu cầu hoàn tiền thành công. Vui lòng chờ admin duyệt.");

            setBookingCode("");
            setLookupResult(null);
            setForm(INITIAL_FORM);

            await loadMyRefunds();
        } catch (error) {
            console.error("Create refund failed:", error);

            alert(
                error.response?.data?.message ||
                "Không thể tạo yêu cầu hoàn tiền."
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCompleteTransfer(refund) {
        if (!window.confirm(
            `Xác nhận đã chuyển ${formatMoney(refund.amount)} đ cho yêu cầu #${refund.refundId}? Thao tác này sẽ đánh dấu "Đã hoàn tiền".`
        )) {
            return;
        }

        setCompletingId(refund.refundId);

        try {
            await refundApi.complete(refund.refundId, "");
            await loadMyRefunds();
        } catch (error) {
            console.error("Complete refund transfer failed:", error);

            alert(
                error.response?.data?.message ||
                "Không thể xác nhận hoàn tất chuyển tiền."
            );
        } finally {
            setCompletingId(null);
        }
    }

    return (
        <div className="employee-refunds-page">
            <div className="employee-refunds-header">
                <div>
                    <h1>Yêu cầu hoàn tiền</h1>
                    <p>Tra cứu giao dịch theo mã booking và tạo yêu cầu hoàn tiền cho khách hàng.</p>
                </div>
            </div>

            <div className="employee-refunds-grid">
                <div className="employee-refunds-form-card">
                    <h2>
                        <Search size={18} />
                        Tra cứu giao dịch
                    </h2>

                    <form className="employee-refunds-lookup-form" onSubmit={handleLookup}>
                        <input
                            type="text"
                            placeholder="Nhập mã booking (VD: BK-2026001)"
                            value={bookingCode}
                            onChange={(event) => setBookingCode(event.target.value)}
                        />

                        <button type="submit" disabled={lookupLoading}>
                            {lookupLoading ? "Đang tra cứu..." : "Tra cứu"}
                        </button>
                    </form>

                    {lookupResult && (
                        <div
                            className={`employee-refunds-lookup-result ${
                                lookupResult.eligible ? "eligible" : "ineligible"
                            }`}
                        >
                            <div className="employee-refunds-lookup-row">
                                <span>Khách hàng</span>
                                <strong>{lookupResult.customerName || "N/A"}</strong>
                            </div>

                            <div className="employee-refunds-lookup-row">
                                <span>Số điện thoại</span>
                                <strong>{lookupResult.customerPhone || "N/A"}</strong>
                            </div>

                            <div className="employee-refunds-lookup-row">
                                <span>Số tiền đã thanh toán</span>
                                <strong>{formatMoney(lookupResult.finalAmount)} đ</strong>
                            </div>

                            <div className="employee-refunds-lookup-row">
                                <span>Trạng thái thanh toán</span>
                                <strong>{lookupResult.paymentStatus}</strong>
                            </div>

                            {!lookupResult.eligible && (
                                <div className="employee-refunds-ineligible-note">
                                    <AlertTriangle size={16} />
                                    {lookupResult.ineligibleReason}
                                </div>
                            )}
                        </div>
                    )}

                    {lookupResult?.eligible && (
                        <form className="employee-refunds-create-form" onSubmit={handleSubmit}>
                            <label>
                                <span>Số tiền hoàn (đ)</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={maxAmount || undefined}
                                    value={form.amount}
                                    onChange={(event) => updateForm("amount", event.target.value)}
                                />
                                {amountError && (
                                    <small className="employee-refunds-field-error">{amountError}</small>
                                )}
                            </label>

                            <label>
                                <span>Lý do hoàn tiền</span>
                                <textarea
                                    rows={3}
                                    maxLength={500}
                                    value={form.reason}
                                    onChange={(event) => updateForm("reason", event.target.value)}
                                    placeholder="VD: Khách hủy dịch vụ do phát sinh sự cố..."
                                />
                            </label>

                            <label>
                                <span>Phương thức hoàn tiền</span>
                                <select
                                    value={form.refundMethod}
                                    onChange={(event) => updateForm("refundMethod", event.target.value)}
                                >
                                    <option value="cash">Tiền mặt</option>
                                    <option value="bank_transfer">Chuyển khoản</option>
                                </select>
                            </label>

                            {form.refundMethod === "bank_transfer" && (
                                <div className="employee-refunds-bank-fields">
                                    <label>
                                        <span>Tên ngân hàng</span>
                                        <input
                                            type="text"
                                            value={form.bankName}
                                            onChange={(event) => updateForm("bankName", event.target.value)}
                                        />
                                    </label>

                                    <label>
                                        <span>Số tài khoản</span>
                                        <input
                                            type="text"
                                            value={form.bankAccountNumber}
                                            onChange={(event) =>
                                                updateForm("bankAccountNumber", event.target.value)
                                            }
                                        />
                                    </label>

                                    <label>
                                        <span>Chủ tài khoản</span>
                                        <input
                                            type="text"
                                            value={form.bankAccountName}
                                            onChange={(event) =>
                                                updateForm("bankAccountName", event.target.value)
                                            }
                                        />
                                    </label>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="employee-refunds-submit-btn"
                                disabled={submitting}
                            >
                                <Undo2 size={17} />
                                {submitting ? "Đang gửi..." : "Tạo yêu cầu hoàn tiền"}
                            </button>
                        </form>
                    )}
                </div>

                <div className="employee-refunds-list-card">
                    <div className="employee-refunds-list-header">
                        <h2>Yêu cầu của tôi</h2>

                        <button
                            type="button"
                            className="employee-refunds-refresh-btn"
                            onClick={loadMyRefunds}
                            disabled={listLoading}
                        >
                            <RefreshCw
                                size={16}
                                className={listLoading ? "employee-refunds-spinning" : ""}
                            />
                        </button>
                    </div>

                    {listLoading ? (
                        <div className="employee-refunds-empty-state">Đang tải...</div>
                    ) : myRefunds.length === 0 ? (
                        <div className="employee-refunds-empty-state">
                            Bạn chưa tạo yêu cầu hoàn tiền nào.
                        </div>
                    ) : (
                        <ul className="employee-refunds-list">
                            {myRefunds.map((refund) => (
                                <li key={refund.refundId} className="employee-refunds-list-item">
                                    <div className="employee-refunds-list-item-top">
                                        <strong>RF-{refund.refundId}</strong>
                                        <span className={`employee-refunds-status ${getStatusClass(refund.status)}`}>
                      {getStatusLabel(refund.status)}
                    </span>
                                    </div>

                                    <div className="employee-refunds-list-item-body">
                                        <span>Booking {refund.bookingCode || "N/A"}</span>
                                        <strong>{formatMoney(refund.amount)} đ</strong>
                                    </div>

                                    <p className="employee-refunds-list-item-reason">{refund.reason}</p>

                                    {refund.status === "rejected" && refund.adminNote && (
                                        <div className="employee-refunds-list-item-note">
                                            <AlertTriangle size={14} />
                                            {refund.adminNote}
                                        </div>
                                    )}

                                    {refund.status === "completed" && (
                                        <div className="employee-refunds-list-item-note success">
                                            <CheckCircle2 size={14} />
                                            Đã hoàn tiền lúc {formatDateTime(refund.completedAt)}
                                        </div>
                                    )}

                                    {refund.status === "approved" && (
                                        <div className="employee-refunds-list-item-note pending">
                                            <Clock3 size={14} />
                                            Đã duyệt lúc {formatDateTime(refund.processedAt)} — đang chờ chuyển tiền
                                        </div>
                                    )}

                                    {(refund.status === "pending" || refund.status === "processing") && (
                                        <div className="employee-refunds-list-item-note pending">
                                            <Clock3 size={14} />
                                            Tạo lúc {formatDateTime(refund.createdAt)}
                                        </div>
                                    )}

                                    {refund.status === "approved" && (
                                            <button
                                                type="button"
                                                className="employee-refunds-complete-btn"
                                                disabled={completingId === refund.refundId}
                                                onClick={() => handleCompleteTransfer(refund)}
                                            >
                                                <CheckCircle2 size={14} />
                                                {completingId === refund.refundId
                                                    ? "Đang xác nhận..."
                                                    : "Xác nhận đã chuyển tiền"}
                                            </button>
                                        )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}