import React, { useEffect, useState } from "react";
import "./ManagerTimeSlotsPage.css";
import { getBranches } from "../../../api/branchService";
import { getBaysByBranch } from "../../../api/washBayService";
import { generateMonthlySlots } from "../../../api/timeSlotService";

const DAY_OPTIONS = [
    { label: "CN", value: "SUNDAY" },
    { label: "T2", value: "MONDAY" },
    { label: "T3", value: "TUESDAY" },
    { label: "T4", value: "WEDNESDAY" },
    { label: "T5", value: "THURSDAY" },
    { label: "T6", value: "FRIDAY" },
    { label: "T7", value: "SATURDAY" },
];

const now = new Date();

export default function ManagerTimeSlotsPage() {
    const [branches, setBranches] = useState([]);
    const [bays, setBays] = useState([]);

    const [branchId, setBranchId] = useState("");
    const [selectedBayIds, setSelectedBayIds] = useState([]);
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [openTime, setOpenTime] = useState("08:00");
    const [closeTime, setCloseTime] = useState("18:00");
    const [breakStart, setBreakStart] = useState("12:00");
    const [breakEnd, setBreakEnd] = useState("13:00");
    const [hasBreak, setHasBreak] = useState(true);
    const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
    const [maxCapacity, setMaxCapacity] = useState(2);
    const [selectedDays, setSelectedDays] = useState(DAY_OPTIONS.map(d => d.value));
    const [skipExisting, setSkipExisting] = useState(true);

    const [loadingBays, setLoadingBays] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const res = await getBranches();
                const list = res.data || [];
                setBranches(list);
                if (list.length > 0) setBranchId(list[0].branchId);
            } catch (err) {
                setErrorMsg("Không tải được danh sách chi nhánh.");
            }
        };
        loadBranches();
    }, []);

    useEffect(() => {
        if (!branchId) {
            setBays([]);
            setSelectedBayIds([]);
            return;
        }
        const loadBays = async () => {
            setLoadingBays(true);
            try {
                const res = await getBaysByBranch(branchId);
                const list = res.data || [];
                setBays(list);
                setSelectedBayIds(list.map(b => b.bayId));
            } catch (err) {
                setBays([]);
                setSelectedBayIds([]);
                setErrorMsg("Không tải được danh sách bay của chi nhánh này.");
            } finally {
                setLoadingBays(false);
            }
        };
        loadBays();
    }, [branchId]);

    const toggleBay = (bayId) => {
        setSelectedBayIds(prev =>
            prev.includes(bayId) ? prev.filter(id => id !== bayId) : [...prev, bayId]
        );
    };

    const toggleDay = (value) => {
        setSelectedDays(prev =>
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setResult(null);

        if (!branchId) { setErrorMsg("Vui lòng chọn chi nhánh."); return; }
        if (selectedBayIds.length === 0) { setErrorMsg("Vui lòng chọn ít nhất 1 bay."); return; }
        if (selectedDays.length === 0) { setErrorMsg("Vui lòng chọn ít nhất 1 ngày trong tuần."); return; }
        if (openTime >= closeTime) { setErrorMsg("Giờ đóng cửa phải sau giờ mở cửa."); return; }
        if (hasBreak && breakStart >= breakEnd) { setErrorMsg("Giờ kết thúc nghỉ trưa phải sau giờ bắt đầu nghỉ trưa."); return; }

        const payload = {
            branchId: Number(branchId),
            bayIds: selectedBayIds,
            year: Number(year),
            month: Number(month),
            openTime,
            closeTime,
            breakStart: hasBreak ? breakStart : null,
            breakEnd: hasBreak ? breakEnd : null,
            slotDurationMinutes: Number(slotDurationMinutes),
            maxCapacity: Number(maxCapacity),
            daysOfWeek: selectedDays,
            skipExisting,
        };

        setSubmitting(true);
        try {
            const res = await generateMonthlySlots(payload);
            setResult(res.data);
        } catch (err) {
            setErrorMsg(
                err.response?.data?.message ||
                "Tạo khung giờ thất bại. Vui lòng kiểm tra lại thông tin."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="manager-timeslots-page">
            <div className="page-title-area">
                <h1>Tạo khung giờ rửa xe hàng loạt</h1>
                <p>
                    Sinh khung giờ (time slot) cho cả tháng theo chi nhánh và bay.
                    <strong> Nếu chi nhánh chưa từng được tạo khung giờ, trang đặt lịch của khách
                        sẽ luôn báo "chưa có khung giờ trống" bất kể chọn ngày nào</strong> — hãy tạo
                    khung giờ ở đây trước.
                </p>
            </div>

            {errorMsg && <div className="ts-alert ts-alert-error">{errorMsg}</div>}

            <form className="ts-form-card" onSubmit={handleSubmit}>
                <div className="ts-row">
                    <div className="ts-field">
                        <label>Chi nhánh *</label>
                        <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                            {branches.length === 0 && <option value="">Đang tải chi nhánh...</option>}
                            {branches.map((b) => (
                                <option key={b.branchId} value={b.branchId}>
                                    {b.branchName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="ts-field">
                        <label>Năm *</label>
                        <input type="number" min="2000" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div className="ts-field">
                        <label>Tháng *</label>
                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>Tháng {m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="ts-field">
                    <label>Bay áp dụng *</label>
                    {loadingBays ? (
                        <p className="ts-hint">Đang tải danh sách bay...</p>
                    ) : bays.length === 0 ? (
                        <p className="ts-hint">Chi nhánh này chưa có bay nào. Vui lòng tạo bay trước.</p>
                    ) : (
                        <div className="ts-checkbox-grid">
                            {bays.map((bay) => (
                                <label key={bay.bayId} className="ts-checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedBayIds.includes(bay.bayId)}
                                        onChange={() => toggleBay(bay.bayId)}
                                    />
                                    {bay.bayName}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="ts-row">
                    <div className="ts-field">
                        <label>Giờ mở cửa *</label>
                        <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                    </div>
                    <div className="ts-field">
                        <label>Giờ đóng cửa *</label>
                        <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                    </div>
                    <div className="ts-field">
                        <label>Thời lượng mỗi slot (phút) *</label>
                        <input
                            type="number" min="5" max="480"
                            value={slotDurationMinutes}
                            onChange={(e) => setSlotDurationMinutes(e.target.value)}
                        />
                    </div>
                    <div className="ts-field">
                        <label>Sức chứa mỗi slot *</label>
                        <input
                            type="number" min="1" max="50"
                            value={maxCapacity}
                            onChange={(e) => setMaxCapacity(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ts-field">
                    <label className="ts-checkbox-item">
                        <input type="checkbox" checked={hasBreak} onChange={(e) => setHasBreak(e.target.checked)} />
                        Có giờ nghỉ trưa (không tạo slot trong khoảng này)
                    </label>
                    {hasBreak && (
                        <div className="ts-row" style={{ marginTop: 8 }}>
                            <div className="ts-field">
                                <label>Bắt đầu nghỉ trưa</label>
                                <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} />
                            </div>
                            <div className="ts-field">
                                <label>Kết thúc nghỉ trưa</label>
                                <input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="ts-field">
                    <label>Áp dụng cho các ngày trong tuần *</label>
                    <div className="ts-checkbox-grid">
                        {DAY_OPTIONS.map((d) => (
                            <label key={d.value} className="ts-checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={selectedDays.includes(d.value)}
                                    onChange={() => toggleDay(d.value)}
                                />
                                {d.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="ts-field">
                    <label className="ts-checkbox-item">
                        <input type="checkbox" checked={skipExisting} onChange={(e) => setSkipExisting(e.target.checked)} />
                        Bỏ qua slot đã tồn tại / trùng giờ (khuyến nghị bật)
                    </label>
                </div>

                <button className="ts-submit-btn" type="submit" disabled={submitting}>
                    {submitting ? "Đang tạo..." : "Tạo khung giờ cho cả tháng"}
                </button>
            </form>

            {result && (
                <div className="ts-result-card">
                    <h3>Kết quả</h3>
                    <ul>
                        <li>Tháng: {result.month}/{result.year} ({result.daysInMonth} ngày)</li>
                        <li>Tổng số khung giờ được xét: {result.totalCandidates}</li>
                        <li>Đã tạo mới: <strong>{result.created}</strong></li>
                        <li>Bỏ qua: {result.skipped}</li>
                    </ul>
                    {result.skippedReasons?.length > 0 && (
                        <details>
                            <summary>Xem lý do bỏ qua ({result.skippedReasons.length})</summary>
                            <ul className="ts-skip-list">
                                {result.skippedReasons.map((r, idx) => <li key={idx}>{r}</li>)}
                            </ul>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
}