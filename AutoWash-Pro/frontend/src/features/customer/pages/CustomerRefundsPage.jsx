import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import refundApi from '../../../api/refundApi';

import './CustomerRefundsPage.css';

const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const fmtDateTime = (d) =>
    d
        ? new Date(d).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : '—';

const STATUS_MAP = {
    pending: { label: 'Chờ admin xử lý', className: 'pending' },
    processing: { label: 'Đang xác minh', className: 'processing' },
    approved: { label: 'Đã duyệt · chờ chuyển tiền', className: 'approved' },
    completed: { label: 'Đã hoàn tiền', className: 'completed' },
    rejected: { label: 'Đã bị từ chối', className: 'rejected' },
};

const REFUND_METHOD_MAP = {
    cash: 'Tiền mặt tại chi nhánh',
    bank_transfer: 'Chuyển khoản ngân hàng',
    original_payment_method: 'Phương thức thanh toán gốc',
};

const STEP_ORDER = ['pending', 'processing', 'approved', 'completed'];

function unwrapList(response) {
    const root = response?.data;
    const result = root?.data ?? root;
    return Array.isArray(result) ? result : [];
}

export default function CustomerRefundsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refunds, setRefunds] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRefunds();
    }, []);

    async function loadRefunds() {
        try {
            setLoading(true);
            setError(null);
            const res = await refundApi.myRefunds();
            const list = unwrapList(res).sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            setRefunds(list);
        } catch (err) {
            console.error('Lỗi tải danh sách yêu cầu hoàn tiền:', err);
            setError('Không thể tải danh sách yêu cầu hoàn tiền. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="crp-page">
            <div className="crp-container">
                <div className="crp-header">
                    <button className="crp-back-btn" onClick={() => navigate(-1)}>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="crp-title">Yêu cầu hoàn tiền của tôi</h1>
                        <p className="crp-subtitle">
                            Theo dõi trạng thái các yêu cầu hoàn tiền bạn đã gửi — từ lúc admin tiếp nhận đến khi hoàn tất.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="crp-loading">
                        <div className="crp-spinner" />
                        Đang tải…
                    </div>
                ) : error ? (
                    <div className="crp-empty">
                        <div className="crp-empty-icon">⚠️</div>
                        <div className="crp-empty-title">{error}</div>
                        <button className="crp-retry-btn" onClick={loadRefunds}>Thử lại</button>
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="crp-empty">
                        <div className="crp-empty-icon">💸</div>
                        <div className="crp-empty-title">Bạn chưa gửi yêu cầu hoàn tiền nào</div>
                        <div className="crp-empty-desc">
                            Khi bạn yêu cầu hoàn tiền từ trang Lịch Sử Đặt Lịch, các yêu cầu sẽ hiển thị tại đây.
                        </div>
                        <button className="crp-retry-btn" onClick={() => navigate('/customer/history')}>
                            Về Lịch Sử Đặt Lịch
                        </button>
                    </div>
                ) : (
                    <div className="crp-list">
                        {refunds.map((r) => {
                            const statusCfg = STATUS_MAP[r.status] || STATUS_MAP.pending;
                            const isRejected = r.status === 'rejected';
                            const currentStepIdx = STEP_ORDER.indexOf(r.status);

                            return (
                                <div className="crp-card" key={r.refundId}>
                                    <div className="crp-card-top">
                                        <div>
                                            <div className="crp-card-code">
                                                Yêu cầu #{r.refundId}
                                                {r.bookingCode && <span className="crp-card-booking">· Lịch {r.bookingCode}</span>}
                                            </div>
                                            <div className="crp-card-date">Gửi lúc {fmtDateTime(r.createdAt)}</div>
                                        </div>
                                        <div className={`crp-status-badge ${statusCfg.className}`}>{statusCfg.label}</div>
                                    </div>

                                    {!isRejected ? (
                                        <div className="crp-timeline">
                                            {STEP_ORDER.map((step, idx) => (
                                                <React.Fragment key={step}>
                                                    <div className={`crp-timeline-step ${idx <= currentStepIdx ? 'done' : ''}`}>
                                                        <span className="crp-timeline-dot" />
                                                        <span className="crp-timeline-label">{STATUS_MAP[step].label}</span>
                                                    </div>
                                                    {idx < STEP_ORDER.length - 1 && (
                                                        <div className={`crp-timeline-line ${idx < currentStepIdx ? 'done' : ''}`} />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="crp-rejected-note">
                                            <span className="material-symbols-outlined">cancel</span>
                                            Yêu cầu đã bị admin từ chối.
                                        </div>
                                    )}

                                    <div className="crp-card-details">
                                        <div className="crp-detail-item">
                                            <span className="crp-detail-label">Số tiền hoàn</span>
                                            <span className="crp-detail-value crp-amount">{fmt.format(r.amount || 0)}</span>
                                        </div>
                                        <div className="crp-detail-item">
                                            <span className="crp-detail-label">Phương thức</span>
                                            <span className="crp-detail-value">{REFUND_METHOD_MAP[r.refundMethod] || r.refundMethod}</span>
                                        </div>
                                        <div className="crp-detail-item full-width">
                                            <span className="crp-detail-label">Lý do bạn đã gửi</span>
                                            <span className="crp-detail-value">{r.reason}</span>
                                        </div>
                                        {r.adminNote && (
                                            <div className="crp-detail-item full-width">
                                                <span className="crp-detail-label">Ghi chú từ admin</span>
                                                <span className="crp-detail-value">{r.adminNote}</span>
                                            </div>
                                        )}
                                        {r.status === 'completed' && (
                                            <div className="crp-detail-item full-width">
                                                <span className="crp-detail-label">Hoàn tất lúc</span>
                                                <span className="crp-detail-value">{fmtDateTime(r.completedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}