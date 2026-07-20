// frontend/src/features/admin/pages/RefundsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    Hourglass,
    RefreshCw,
    Search,
    Undo2,
    X,
    XCircle,
} from "lucide-react";

import refundApi from "../../../api/refundApi";

import "./RefundsPage.css";

function unwrapList(response) {
    const root = response?.data;
    const result = root?.data ?? root;

    if (Array.isArray(result)) {
        return result;
    }

    return [];
}

function normalizeValue(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN");
}

function parseDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function formatDateTime(value) {
    const date = parseDate(value);

    if (!date) {
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

function getMethodLabel(method) {
    switch (normalizeValue(method)) {
        case "cash":
            return "Tiền mặt";

        case "bank_transfer":
            return "Chuyển khoản";

        case "original_payment_method":
            return "Hoàn về phương thức gốc";

        default:
            return method || "N/A";
    }
}

export default function RefundsPage() {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);

    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [selectedRefund, setSelectedRefund] = useState(null);
    const [adminNote, setAdminNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadRefunds();
    }, []);

    async function loadRefunds() {
        setLoading(true);

        try {
            const response = await refundApi.list();
            const list = unwrapList(response).sort((first, second) => {
                return (
                    new Date(second.createdAt || 0).getTime() -
                    new Date(first.createdAt || 0).getTime()
                );
            });

            setRefunds(list);
        } catch (error) {
            console.error("Load refunds failed:", error);

            setRefunds([]);

            alert(
                error.response?.data?.message ||
                "Không tải được danh sách yêu cầu hoàn tiền."
            );
        } finally {
            setLoading(false);
        }
    }

    const statistics = useMemo(() => {
        return refunds.reduce(
            (result, refund) => {
                const status = normalizeValue(refund.status);

                result.total += 1;

                if (status === "pending") {
                    result.pending += 1;
                }

                if (status === "processing") {
                    result.processing += 1;
                }

                if (status === "approved") {
                    result.approved += 1;
                }

                if (status === "completed") {
                    result.completed += 1;
                    result.completedAmount += Number(refund.amount || 0);
                }

                if (status === "rejected") {
                    result.rejected += 1;
                }

                return result;
            },
            {
                total: 0,
                pending: 0,
                processing: 0,
                approved: 0,
                completed: 0,
                completedAmount: 0,
                rejected: 0,
            }
        );
    }, [refunds]);

    const filteredRefunds = useMemo(() => {
        const normalizedKeyword = normalizeValue(keyword);

        return refunds.filter((refund) => {
            const searchableText = [
                refund.refundId,
                refund.bookingCode,
                refund.customerName,
                refund.customerPhone,
                refund.requestedByName,
                refund.reason,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesKeyword =
                !normalizedKeyword || searchableText.includes(normalizedKeyword);

            const matchesStatus =
                statusFilter === "all" ||
                normalizeValue(refund.status) === statusFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [refunds, keyword, statusFilter]);

    function openDetail(refund) {
        setSelectedRefund(refund);
        setAdminNote(refund.adminNote || "");
    }

    function closeDetail() {
        if (actionLoading) {
            return;
        }

        setSelectedRefund(null);
        setAdminNote("");
    }

    async function handleMarkProcessing(refund) {
        setActionLoading(true);

        try {
            await refundApi.markProcessing(refund.refundId);
            await loadRefunds();
            closeDetail();
        } catch (error) {
            console.error("Mark processing failed:", error);

            alert(
                error.response?.data?.message ||
                "Không thể chuyển sang trạng thái đang xử lý."
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleApprove(refund) {
        if (!window.confirm(
            `Xác nhận duyệt hoàn tiền ${formatMoney(refund.amount)} đ cho yêu cầu #${refund.refundId}?`
        )) {
            return;
        }

        setActionLoading(true);

        try {
            await refundApi.approve(refund.refundId, adminNote);
            await loadRefunds();
            closeDetail();
        } catch (error) {
            console.error("Approve refund failed:", error);

            alert(
                error.response?.data?.message ||
                "Không thể duyệt yêu cầu hoàn tiền."
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReject(refund) {
        if (!adminNote.trim()) {
            alert("Vui lòng nhập lý do từ chối.");
            return;
        }

        if (!window.confirm(`Xác nhận từ chối yêu cầu hoàn tiền #${refund.refundId}?`)) {
            return;
        }

        setActionLoading(true);

        try {
            await refundApi.reject(refund.refundId, adminNote);
            await loadRefunds();
            closeDetail();
        } catch (error) {
            console.error("Reject refund failed:", error);

            alert(
                error.response?.data?.message ||
                "Không thể từ chối yêu cầu hoàn tiền."
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleComplete(refund) {
        if (!window.confirm(
            `Xác nhận đã chuyển ${formatMoney(refund.amount)} đ cho yêu cầu #${refund.refundId}? Thao tác này sẽ đánh dấu "Đã hoàn tiền".`
        )) {
            return;
        }

        setActionLoading(true);

        try {
            await refundApi.complete(refund.refundId, adminNote);
            await loadRefunds();
            closeDetail();
        } catch (error) {
            console.error("Complete refund failed:", error);

            alert(
                error.response?.data?.message ||
                "Không thể xác nhận hoàn tất chuyển tiền."
            );
        } finally {
            setActionLoading(false);
        }
    }

    function clearFilters() {
        setKeyword("");
        setStatusFilter("all");
    }

    return (
        <div className="refunds-page">
            <div className="refunds-header">
                <div>
                    <h1>Quản lý hoàn tiền</h1>
                    <p>Xem xét, duyệt hoặc từ chối các yêu cầu hoàn tiền từ nhân viên.</p>
                </div>

                <button
                    type="button"
                    className="refunds-refresh-btn"
                    onClick={loadRefunds}
                    disabled={loading}
                >
                    <RefreshCw size={18} className={loading ? "refunds-spinning" : ""} />
                    {loading ? "Đang tải..." : "Làm mới"}
                </button>
            </div>

            <div className="refunds-stat-grid">
                <div className="refunds-stat-card pending">
                    <div className="refunds-stat-icon">
                        <Hourglass size={22} />
                    </div>
                    <div>
                        <span>Chờ xử lý</span>
                        <strong>{statistics.pending}</strong>
                    </div>
                </div>

                <div className="refunds-stat-card processing">
                    <div className="refunds-stat-icon">
                        <Clock3 size={22} />
                    </div>
                    <div>
                        <span>Đang xử lý</span>
                        <strong>{statistics.processing}</strong>
                    </div>
                </div>

                <div className="refunds-stat-card approved">
                    <div className="refunds-stat-icon">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <span>Đã duyệt (chờ chuyển tiền)</span>
                        <strong>{statistics.approved}</strong>
                    </div>
                </div>

                <div className="refunds-stat-card completed">
                    <div className="refunds-stat-icon">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <span>Đã hoàn tiền</span>
                        <strong>{statistics.completed}</strong>
                        <small>{formatMoney(statistics.completedAmount)} đ đã hoàn</small>
                    </div>
                </div>

                <div className="refunds-stat-card rejected">
                    <div className="refunds-stat-icon">
                        <XCircle size={22} />
                    </div>
                    <div>
                        <span>Đã từ chối</span>
                        <strong>{statistics.rejected}</strong>
                    </div>
                </div>

                <div className="refunds-stat-card total">
                    <div className="refunds-stat-icon">
                        <Undo2 size={22} />
                    </div>
                    <div>
                        <span>Tổng yêu cầu</span>
                        <strong>{statistics.total}</strong>
                    </div>
                </div>
            </div>

            <div className="refunds-filter-card">
                <div className="refunds-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Tìm mã hoàn tiền, booking, khách hàng, nhân viên..."
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                    />
                </div>

                <select
                    className="refunds-filter-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="approved">Đã duyệt (chờ chuyển tiền)</option>
                    <option value="completed">Đã hoàn tiền</option>
                    <option value="rejected">Đã từ chối</option>
                </select>

                <button type="button" className="refunds-clear-btn" onClick={clearFilters}>
                    Xóa bộ lọc
                </button>

                <div className="refunds-filter-result">
                    Hiển thị <strong>{filteredRefunds.length}</strong> / {refunds.length} yêu cầu
                </div>
            </div>

            <div className="refunds-table-card">
                {loading ? (
                    <div className="refunds-empty-state">Đang tải danh sách...</div>
                ) : filteredRefunds.length === 0 ? (
                    <div className="refunds-empty-state">Không có yêu cầu hoàn tiền phù hợp.</div>
                ) : (
                    <div className="refunds-table-wrap">
                        <table className="refunds-table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Mã hoàn tiền</th>
                                <th>Booking</th>
                                <th>Khách hàng</th>
                                <th>Người yêu cầu</th>
                                <th>Số tiền</th>
                                <th>Phương thức</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filteredRefunds.map((refund, index) => (
                                <tr key={refund.refundId}>
                                    <td>{index + 1}</td>

                                    <td>
                                        <strong className="refunds-id">RF-{refund.refundId}</strong>
                                    </td>

                                    <td>{refund.bookingCode || "N/A"}</td>

                                    <td>
                                        <div className="refunds-customer-cell">
                                            <strong>{refund.customerName || "N/A"}</strong>
                                            <small>{refund.customerPhone || ""}</small>
                                        </div>
                                    </td>

                                    <td>{refund.requestedByName || "N/A"}</td>

                                    <td>
                                        <strong className="refunds-amount">
                                            {formatMoney(refund.amount)} đ
                                        </strong>
                                    </td>

                                    <td>{getMethodLabel(refund.refundMethod)}</td>

                                    <td>
                                        <span className={`refunds-status ${getStatusClass(refund.status)}`}>
                                            {getStatusLabel(refund.status)}
                                        </span>
                                    </td>

                                    <td>{formatDateTime(refund.createdAt)}</td>

                                    <td>
                                        <button
                                            type="button"
                                            className="refunds-view-btn"
                                            onClick={() => openDetail(refund)}
                                        >
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedRefund && (
                <div
                    className="refunds-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeDetail();
                        }
                    }}
                >
                    <div className="refunds-detail-modal">
                        <div className="refunds-modal-header">
                            <div>
                                <span>Chi tiết yêu cầu hoàn tiền</span>
                                <h2>RF-{selectedRefund.refundId}</h2>
                            </div>

                            <button type="button" onClick={closeDetail} aria-label="Đóng">
                                <X size={21} />
                            </button>
                        </div>

                        <div className="refunds-detail-content">
                            <section className="refunds-summary-section">
                                <div>
                                    <span>Số tiền yêu cầu hoàn</span>
                                    <strong>{formatMoney(selectedRefund.amount)} đ</strong>
                                </div>

                                <span className={`refunds-status large ${getStatusClass(selectedRefund.status)}`}>
                                    {getStatusLabel(selectedRefund.status)}
                                </span>
                            </section>

                            <section className="refunds-detail-section">
                                <h3>Thông tin giao dịch</h3>

                                <div className="refunds-detail-grid">
                                    <div>
                                        <span>Mã booking</span>
                                        <strong>{selectedRefund.bookingCode || "N/A"}</strong>
                                    </div>

                                    <div>
                                        <span>Mã thanh toán gốc</span>
                                        <strong>PAY-{selectedRefund.paymentId}</strong>
                                    </div>

                                    <div>
                                        <span>Số tiền đã thanh toán</span>
                                        <strong>{formatMoney(selectedRefund.originalFinalAmount)} đ</strong>
                                    </div>

                                    <div>
                                        <span>Phương thức hoàn tiền</span>
                                        <strong>{getMethodLabel(selectedRefund.refundMethod)}</strong>
                                    </div>
                                </div>
                            </section>

                            {selectedRefund.refundMethod === "bank_transfer" && (
                                <section className="refunds-detail-section">
                                    <h3>Thông tin ngân hàng</h3>

                                    <div className="refunds-detail-grid">
                                        <div>
                                            <span>Ngân hàng</span>
                                            <strong>{selectedRefund.bankName || "N/A"}</strong>
                                        </div>

                                        <div>
                                            <span>Số tài khoản</span>
                                            <strong>{selectedRefund.bankAccountNumber || "N/A"}</strong>
                                        </div>

                                        <div className="full">
                                            <span>Chủ tài khoản</span>
                                            <strong>{selectedRefund.bankAccountName || "N/A"}</strong>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <section className="refunds-detail-section">
                                <h3>Khách hàng &amp; người yêu cầu</h3>

                                <div className="refunds-detail-grid">
                                    <div>
                                        <span>Khách hàng</span>
                                        <strong>{selectedRefund.customerName || "N/A"}</strong>
                                    </div>

                                    <div>
                                        <span>Số điện thoại</span>
                                        <strong>{selectedRefund.customerPhone || "N/A"}</strong>
                                    </div>

                                    <div>
                                        <span>Nhân viên yêu cầu</span>
                                        <strong>{selectedRefund.requestedByName || "N/A"}</strong>
                                    </div>

                                    <div>
                                        <span>Ngày tạo</span>
                                        <strong>{formatDateTime(selectedRefund.createdAt)}</strong>
                                    </div>
                                </div>
                            </section>

                            <section className="refunds-detail-section">
                                <h3>Lý do hoàn tiền</h3>
                                <p className="refunds-reason-text">{selectedRefund.reason || "Không có"}</p>
                            </section>

                            {(selectedRefund.status === "approved" ||
                                selectedRefund.status === "completed" ||
                                selectedRefund.status === "rejected") && (
                                <section className="refunds-detail-section">
                                    <h3>Kết quả xử lý</h3>

                                    <div className="refunds-detail-grid">
                                        <div>
                                            <span>Người xử lý (duyệt/từ chối)</span>
                                            <strong>{selectedRefund.processedByName || "N/A"}</strong>
                                        </div>

                                        <div>
                                            <span>Thời gian xử lý</span>
                                            <strong>{formatDateTime(selectedRefund.processedAt)}</strong>
                                        </div>

                                        <div className="full">
                                            <span>Ghi chú của admin</span>
                                            <strong>{selectedRefund.adminNote || "Không có"}</strong>
                                        </div>

                                        {selectedRefund.status === "completed" && (
                                            <>
                                                <div>
                                                    <span>Người xác nhận chuyển tiền</span>
                                                    <strong>{selectedRefund.completedByName || "N/A"}</strong>
                                                </div>

                                                <div>
                                                    <span>Thời gian hoàn tất</span>
                                                    <strong>{formatDateTime(selectedRefund.completedAt)}</strong>
                                                </div>

                                                <div className="full">
                                                    <span>Ghi chú hoàn tất</span>
                                                    <strong>{selectedRefund.completionNote || "Không có"}</strong>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </section>
                            )}

                            {selectedRefund.status === "approved" &&
                                selectedRefund.refundMethod !== "original_payment_method" && (
                                    <section className="refunds-detail-section">
                                        <h3>Xác nhận chuyển tiền</h3>
                                        <p className="refunds-reason-text">
                                            Yêu cầu đã được duyệt. Sau khi thực hiện chuyển khoản/trả tiền mặt
                                            cho khách, hãy xác nhận bên dưới để đánh dấu "Đã hoàn tiền".
                                        </p>

                                        <label className="refunds-note-field">
                                            <span>Ghi chú hoàn tất (không bắt buộc)</span>
                                            <textarea
                                                rows={3}
                                                value={adminNote}
                                                onChange={(event) => setAdminNote(event.target.value)}
                                                placeholder="VD: Đã chuyển khoản lúc 10:30, mã giao dịch NH #..."
                                            />
                                        </label>

                                        <div className="refunds-action-row">
                                            <button
                                                type="button"
                                                className="refunds-action-btn approve"
                                                disabled={actionLoading}
                                                onClick={() => handleComplete(selectedRefund)}
                                            >
                                                <CheckCircle2 size={16} />
                                                Xác nhận đã hoàn tiền
                                            </button>
                                        </div>
                                    </section>
                                )}

                            {(selectedRefund.status === "pending" ||
                                selectedRefund.status === "processing") && (
                                <section className="refunds-detail-section">
                                    <h3>Xử lý yêu cầu</h3>

                                    <label className="refunds-note-field">
                                        <span>Ghi chú (bắt buộc khi từ chối)</span>
                                        <textarea
                                            rows={3}
                                            value={adminNote}
                                            onChange={(event) => setAdminNote(event.target.value)}
                                            placeholder="Nhập ghi chú xử lý..."
                                        />
                                    </label>

                                    <div className="refunds-action-row">
                                        {selectedRefund.status === "pending" && (
                                            <button
                                                type="button"
                                                className="refunds-action-btn processing"
                                                disabled={actionLoading}
                                                onClick={() => handleMarkProcessing(selectedRefund)}
                                            >
                                                Tiếp nhận xử lý
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="refunds-action-btn approve"
                                            disabled={actionLoading}
                                            onClick={() => handleApprove(selectedRefund)}
                                        >
                                            <CheckCircle2 size={16} />
                                            Duyệt hoàn tiền
                                        </button>

                                        <button
                                            type="button"
                                            className="refunds-action-btn reject"
                                            disabled={actionLoading}
                                            onClick={() => handleReject(selectedRefund)}
                                        >
                                            <XCircle size={16} />
                                            Từ chối
                                        </button>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}