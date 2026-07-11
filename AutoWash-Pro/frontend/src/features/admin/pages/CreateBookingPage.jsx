import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapPin,
    CalendarDays,
    Clock,
    Plus,
    Settings2,
    CalendarPlus,
    CheckCircle2,
    RefreshCw,
    Loader2,
} from "lucide-react";
import { getBranches } from "../../../api/branchService";
import { getBaysByBranch } from "../../../api/washBayService";
import { getSlotsByBranchAndDate, createTimeSlot } from "../../../api/timeSlotService";
import "./CreateBookingPage.css";

const WEEKDAY_LABELS = ["CN", "T.HAI", "T.BA", "T.TƯ", "T.NĂM", "T.SÁU", "T.BẢY"];

/** Format ngày theo giờ ĐỊA PHƯƠNG (yyyy-MM-dd) — không dùng toISOString() để tránh lệch múi giờ. */
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function buildQuickDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
    });
}

const EMPTY_NEW_SLOT = {
    bayId: "",
    startTime: "08:00",
    endTime: "09:00",
    maxCapacity: 2,
};

export default function CreateBookingPage() {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [branchId, setBranchId] = useState("");
    const [note, setNote] = useState("");

    const quickDates = useMemo(() => buildQuickDates(), []);
    const [customDate, setCustomDate] = useState(null);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(quickDates[0]);

    const [bays, setBays] = useState([]);
    const [slotGroups, setSlotGroups] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState(null);

    const [newSlot, setNewSlot] = useState(EMPTY_NEW_SLOT);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const startTimeRef = useRef(null);

    // ---------- Load chi nhánh ----------
    async function loadBranches() {
        setLoadingBranches(true);
        try {
            const res = await getBranches();
            const list = res.data?.data || res.data || [];
            setBranches(Array.isArray(list) ? list : []);
            if (Array.isArray(list) && list.length > 0) {
                setBranchId((prev) => prev || list[0].branchId);
            }
        } catch (error) {
            console.error("Load branches failed:", error);
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadBranches();
    }, []);

    // ---------- Load bay theo chi nhánh (cần cho việc tạo slot mới) ----------
    useEffect(() => {
        if (!branchId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBays([]);
            return;
        }
        (async () => {
            try {
                const res = await getBaysByBranch(branchId);
                const list = res.data?.data || res.data || [];
                setBays(Array.isArray(list) ? list : []);
                setNewSlot((prev) => ({ ...prev, bayId: list[0]?.bayId || "" }));
            } catch (error) {
                console.error("Load bays failed:", error);
                setBays([]);
            }
        })();
    }, [branchId]);

    // ---------- Load khung giờ hiện có theo chi nhánh + ngày ----------
    async function loadSlots() {
        if (!branchId || !selectedDate) {
            setSlotGroups([]);
            return;
        }
        setLoadingSlots(true);
        setSlotsError(null);
        try {
            const dateStr = formatDateLocal(selectedDate);
            const res = await getSlotsByBranchAndDate(branchId, dateStr);
            const rawSlots = res.data || [];
            const visibleSlots = rawSlots.filter((slot) => slot.status !== "closed");

            // Gom các slot cùng giờ bắt đầu (mỗi bay 1 dòng riêng ở DB) thành 1 khung
            // giờ duy nhất để hiển thị, cộng dồn số chỗ còn trống — giống trang
            // BookingPage.jsx phía khách hàng.
            const groupMap = new Map();
            visibleSlots.forEach((slot) => {
                const key = slot.startTime;
                const max = slot.maxCapacity ?? 1;
                const current = slot.currentBookings ?? 0;
                const remaining = Math.max(max - current, 0);

                if (!groupMap.has(key)) {
                    groupMap.set(key, {
                        startTime: key,
                        endTime: slot.endTime,
                        totalRemaining: 0,
                        totalMax: 0,
                    });
                }
                const group = groupMap.get(key);
                group.totalRemaining += remaining;
                group.totalMax += max;
            });

            const formatted = Array.from(groupMap.values())
                .map((g) => ({
                    ...g,
                    full: g.totalRemaining <= 0,
                }))
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

            setSlotGroups(formatted);
            if (formatted.length === 0) {
                setSlotsError("Chi nhánh chưa có khung giờ nào cho ngày này. Thêm khung giờ mới bên dưới.");
            }
        } catch (error) {
            console.error("Load slots failed:", error);
            setSlotGroups([]);
            setSlotsError("Không tải được khung giờ. Vui lòng thử lại.");
        } finally {
            setLoadingSlots(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSlots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId, selectedDate]);

    // ---------- Handlers ----------
    function handlePickQuickDate(date) {
        setSelectedDate(date);
        setShowCustomDatePicker(false);
    }

    function handlePickCustomDate(value) {
        if (!value) return;
        const [y, m, d] = value.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        setCustomDate(date);
        setSelectedDate(date);
    }

    function handlePrefillFromChip(group) {
        setNewSlot((prev) => ({
            ...prev,
            startTime: group.startTime?.slice(0, 5) || prev.startTime,
        }));
        startTimeRef.current?.focus();
    }

    function handleReset() {
        setNote("");
        setNewSlot((prev) => ({ ...EMPTY_NEW_SLOT, bayId: prev.bayId }));
        setSelectedDate(quickDates[0]);
        setShowCustomDatePicker(false);
        setFeedback(null);
        loadSlots();
    }

    async function handleSubmit() {
        setFeedback(null);

        if (!branchId) {
            setFeedback({ type: "error", text: "Vui lòng chọn chi nhánh." });
            return;
        }
        if (!selectedDate) {
            setFeedback({ type: "error", text: "Vui lòng chọn ngày." });
            return;
        }
        if (!newSlot.bayId) {
            setFeedback({ type: "error", text: "Chi nhánh này chưa có bay nào — vui lòng tạo bay trước." });
            return;
        }
        if (!newSlot.startTime || !newSlot.endTime) {
            setFeedback({ type: "error", text: "Vui lòng nhập đủ giờ bắt đầu và giờ kết thúc." });
            return;
        }
        if (newSlot.startTime >= newSlot.endTime) {
            setFeedback({ type: "error", text: "Giờ kết thúc phải sau giờ bắt đầu." });
            return;
        }
        if (!newSlot.maxCapacity || Number(newSlot.maxCapacity) < 1) {
            setFeedback({ type: "error", text: "Sức chứa tối thiểu là 1." });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                branchId: Number(branchId),
                bayId: Number(newSlot.bayId),
                slotDate: formatDateLocal(selectedDate),
                startTime: `${newSlot.startTime}:00`,
                endTime: `${newSlot.endTime}:00`,
                maxCapacity: Number(newSlot.maxCapacity),
            };

            await createTimeSlot(payload);

            setFeedback({ type: "success", text: "Đã tạo khung giờ đặt lịch mới thành công." });
            setNewSlot((prev) => ({ ...EMPTY_NEW_SLOT, bayId: prev.bayId }));
            loadSlots();
        } catch (error) {
            console.error("Create time slot failed:", error);
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Tạo đặt lịch thất bại. Vui lòng kiểm tra lại thông tin.";
            setFeedback({ type: "error", text: message });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="cbp-page">
            <div className="cbp-header">
                <div>
                    <h1>Tạo đặt lịch mới (Admin)</h1>
                    <p>Chọn chi nhánh và khung giờ để tạo lịch hẹn mới trên hệ thống.</p>
                </div>

                <div className="cbp-header-actions">
                    <button className="cbp-btn-ghost" onClick={handleReset} type="button">
                        <RefreshCw size={18} />
                        Làm mới
                    </button>
                    <button
                        className="cbp-btn-primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                        type="button"
                    >
                        {submitting ? <Loader2 size={18} className="cbp-spin" /> : <CheckCircle2 size={18} />}
                        {submitting ? "Đang xử lý..." : "Xác nhận tạo đặt lịch"}
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`cbp-alert cbp-alert-${feedback.type}`}>{feedback.text}</div>
            )}

            <div className="cbp-card">
                {/* ---------- Chi nhánh & Ghi chú ---------- */}
                <section className="cbp-section">
                    <div className="cbp-section-title">
            <span className="cbp-icon-badge">
              <MapPin size={18} />
            </span>
                        <h2>
                            Chi nhánh &amp; Ghi chú <span className="cbp-required">*</span>
                        </h2>
                    </div>

                    <div className="cbp-field-grid">
                        <div className="cbp-field">
                            <label>
                                Chọn chi nhánh <span className="cbp-required">*</span>
                            </label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                disabled={loadingBranches}
                            >
                                {loadingBranches && <option>Đang tải chi nhánh...</option>}
                                {!loadingBranches && branches.length === 0 && (
                                    <option value="">Chưa có chi nhánh nào</option>
                                )}
                                {branches.map((b) => (
                                    <option key={b.branchId} value={b.branchId}>
                                        {b.branchName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="cbp-field">
                            <label>Ghi chú nội bộ</label>
                            <input
                                type="text"
                                placeholder="Yêu cầu đặc biệt hoặc lưu ý..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <hr className="cbp-divider" />

                {/* ---------- Thiết lập ngày ---------- */}
                <section className="cbp-section">
                    <div className="cbp-section-title">
            <span className="cbp-icon-badge">
              <CalendarDays size={18} />
            </span>
                        <h2>
                            Thiết lập ngày <span className="cbp-required">*</span>
                        </h2>
                    </div>

                    <div className="cbp-date-grid">
                        {quickDates.map((date, idx) => {
                            const isSelected =
                                !showCustomDatePicker && formatDateLocal(date) === formatDateLocal(selectedDate);
                            return (
                                <button
                                    type="button"
                                    key={formatDateLocal(date)}
                                    className={`cbp-date-card ${isSelected ? "selected" : ""}`}
                                    onClick={() => handlePickQuickDate(date)}
                                >
                  <span className="cbp-date-label">
                    {idx === 0 ? "HÔM NAY" : WEEKDAY_LABELS[date.getDay()]}
                  </span>
                                    <span className="cbp-date-day">{date.getDate()}</span>
                                    <span className="cbp-date-month">Tháng {date.getMonth() + 1}</span>
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            className={`cbp-date-card cbp-date-custom ${showCustomDatePicker ? "selected" : ""}`}
                            onClick={() => setShowCustomDatePicker(true)}
                        >
                            {showCustomDatePicker ? (
                                <input
                                    type="date"
                                    autoFocus
                                    className="cbp-date-input"
                                    min={formatDateLocal(new Date())}
                                    value={customDate ? formatDateLocal(customDate) : ""}
                                    onChange={(e) => handlePickCustomDate(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <>
                                    <CalendarPlus size={20} />
                                    <span className="cbp-date-custom-label">Chọn ngày</span>
                                </>
                            )}
                        </button>
                    </div>
                </section>

                <hr className="cbp-divider" />

                {/* ---------- Khung giờ làm việc ---------- */}
                <section className="cbp-section">
                    <div className="cbp-section-title cbp-section-title-row">
                        <div className="cbp-section-title-left">
              <span className="cbp-icon-badge">
                <Clock size={18} />
              </span>
                            <h2>
                                Khung giờ làm việc <span className="cbp-required">*</span>
                            </h2>
                        </div>
                        <div className="cbp-section-title-actions">
                            <button
                                type="button"
                                className="cbp-link-btn"
                                onClick={() => navigate("/admin/time-slots")}
                            >
                                <Settings2 size={14} />
                                Quản lý
                            </button>
                            <button
                                type="button"
                                className="cbp-chip-btn"
                                onClick={() => startTimeRef.current?.focus()}
                            >
                                <Plus size={14} />
                                Thêm khung giờ mới
                            </button>
                        </div>
                    </div>

                    <div className="cbp-slots-grid">
                        {loadingSlots ? (
                            <div className="cbp-slots-empty">Đang tải khung giờ...</div>
                        ) : slotGroups.length === 0 ? (
                            <div className="cbp-slots-empty">{slotsError || "Chưa có khung giờ."}</div>
                        ) : (
                            slotGroups.map((g) => (
                                <button
                                    type="button"
                                    key={g.startTime}
                                    className={`cbp-slot-chip ${g.full ? "full" : ""}`}
                                    onClick={() => handlePrefillFromChip(g)}
                                    title="Dùng giờ này làm gợi ý cho khung giờ mới bên dưới"
                                >
                                    <span className="cbp-slot-time">{g.startTime?.slice(0, 5)}</span>
                                    <span className="cbp-slot-remaining">
                    {g.full ? "Đã đầy" : `Còn ${g.totalRemaining} chỗ`}
                  </span>
                                </button>
                            ))
                        )}
                    </div>

                    {slotGroups.length > 0 && slotsError && (
                        <p className="cbp-hint">{slotsError}</p>
                    )}

                    {/* Form tạo khung giờ mới — nộp cùng lúc với nút "Xác nhận tạo đặt lịch" ở trên */}
                    <div className="cbp-new-slot-form">
                        <p className="cbp-new-slot-title">Khung giờ mới</p>
                        <div className="cbp-new-slot-grid">
                            <div className="cbp-field">
                                <label>Bay áp dụng *</label>
                                <select
                                    value={newSlot.bayId}
                                    onChange={(e) => setNewSlot((prev) => ({ ...prev, bayId: e.target.value }))}
                                >
                                    {bays.length === 0 && <option value="">Chưa có bay</option>}
                                    {bays.map((bay) => (
                                        <option key={bay.bayId} value={bay.bayId}>
                                            {bay.bayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="cbp-field">
                                <label>Giờ bắt đầu *</label>
                                <input
                                    ref={startTimeRef}
                                    type="time"
                                    value={newSlot.startTime}
                                    onChange={(e) => setNewSlot((prev) => ({ ...prev, startTime: e.target.value }))}
                                />
                            </div>
                            <div className="cbp-field">
                                <label>Giờ kết thúc *</label>
                                <input
                                    type="time"
                                    value={newSlot.endTime}
                                    onChange={(e) => setNewSlot((prev) => ({ ...prev, endTime: e.target.value }))}
                                />
                            </div>
                            <div className="cbp-field">
                                <label>Sức chứa *</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={newSlot.maxCapacity}
                                    onChange={(e) =>
                                        setNewSlot((prev) => ({ ...prev, maxCapacity: e.target.value }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}