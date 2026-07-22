import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
    Trash2,
    Zap,
    Save,
    History,
    X,
} from "lucide-react";
import { getBranches } from "../../../api/branchService";
import { getBaysByBranch } from "../../../api/washBayService";
import { getSlotsByBranchAndDate, createTimeSlot } from "../../../api/timeSlotService";
import "./CreateBookingPage.css";

/* ============================================================
 * Ghi chú triển khai
 * ------------------------------------------------------------
 * - "Mẫu thiết lập" (setup templates) hiện được lưu bằng
 *   localStorage theo từng branchId vì dự án chưa có endpoint
 *   riêng cho việc này. Nếu backend đã có (vd:
 *   bookingApi.listSetupTemplates / saveSetupTemplate), chỉ
 *   cần thay 2 hàm loadTemplatesFromStorage / saveTemplateToStorage
 *   bên dưới bằng lời gọi API tương ứng.
 * - Chế độ "Nhập hàng loạt" áp dụng khung giờ cho TẤT CẢ các bay
 *   đang hoạt động của chi nhánh đã chọn. Chế độ "Nhập lẻ" cho
 *   phép chọn một bay cụ thể.
 * ============================================================ */

const WEEKDAY_LABELS = ["CN", "T.HAI", "T.BA", "T.TƯ", "T.NĂM", "T.SÁU", "T.BẢY"];
const INTERVAL_OPTIONS = [15, 30, 45, 60, 90, 120];

const EMPTY_SINGLE_SLOT = {
    bayId: "",
    startTime: "08:00",
    endTime: "09:00",
    maxCapacity: 2,
};

const EMPTY_BULK_FORM = {
    startTime: "08:00",
    endTime: "18:00",
    interval: 60,
    capacity: 3,
};

/** Format ngày theo giờ ĐỊA PHƯƠNG (yyyy-MM-dd) — tránh lệch múi giờ do toISOString(). */
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
}

function startOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // đưa về thứ Hai
    d.setDate(d.getDate() + diff);
    return d;
}

function buildRange(startDate, count) {
    return Array.from({ length: count }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
    });
}

function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

function makeId() {
    return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function templatesStorageKey(branchId) {
    return `washflow_booking_templates_${branchId || "default"}`;
}

function loadTemplatesFromStorage(branchId) {
    try {
        const raw = localStorage.getItem(templatesStorageKey(branchId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveTemplateToStorage(branchId, template) {
    const list = loadTemplatesFromStorage(branchId);
    const next = [...list.filter((t) => t.name !== template.name), template];
    localStorage.setItem(templatesStorageKey(branchId), JSON.stringify(next));
    return next;
}

export default function CreateBookingPage() {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [branchId, setBranchId] = useState("");
    const [note, setNote] = useState("");

    // ---------- Mẫu thiết lập ----------
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateName, setSelectedTemplateName] = useState("");

    // ---------- Chọn nhiều ngày ----------
    const [selectedDates, setSelectedDates] = useState([]);
    const [customDateInput, setCustomDateInput] = useState("");

    // ---------- Khung giờ hiện có (đọc từ server để tham khảo) ----------
    const [bays, setBays] = useState([]);
    const [slotGroups, setSlotGroups] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState(null);
    const referenceDate = selectedDates[0] || null;

    // ---------- Khung giờ đang soạn (chưa gửi) ----------
    const [slotInputMode, setSlotInputMode] = useState("bulk"); // 'bulk' | 'single'
    const [bulkForm, setBulkForm] = useState(EMPTY_BULK_FORM);
    const [singleSlot, setSingleSlot] = useState(EMPTY_SINGLE_SLOT);
    const [draftSlots, setDraftSlots] = useState([]);

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

    // ---------- Load bay theo chi nhánh ----------
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
                setSingleSlot((prev) => ({ ...prev, bayId: list[0]?.bayId || "" }));
            } catch (error) {
                console.error("Load bays failed:", error);
                setBays([]);
            }
        })();
    }, [branchId]);

    // ---------- Load mẫu thiết lập theo chi nhánh ----------
    useEffect(() => {
        setTemplates(loadTemplatesFromStorage(branchId));
        setSelectedTemplateName("");
    }, [branchId]);

    // ---------- Load khung giờ hiện có (ngày đầu tiên được chọn, để tham khảo) ----------
    const loadSlots = useCallback(async () => {
        if (!branchId || !referenceDate) {
            setSlotGroups([]);
            return;
        }
        setLoadingSlots(true);
        setSlotsError(null);
        try {
            const dateStr = formatDateLocal(referenceDate);
            const res = await getSlotsByBranchAndDate(branchId, dateStr);
            const rawSlots = res.data || [];
            const visibleSlots = rawSlots.filter((slot) => slot.status !== "closed");

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
                .map((g) => ({ ...g, full: g.totalRemaining <= 0 }))
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
    }, [branchId, referenceDate]);

    useEffect(() => {
        loadSlots();
    }, [loadSlots]);

    // ---------- Chọn ngày ----------
    function addDates(dates) {
        setSelectedDates((prev) => {
            const existing = new Set(prev.map(formatDateLocal));
            const additions = dates.filter((d) => !existing.has(formatDateLocal(d)));
            return [...prev, ...additions].sort((a, b) => a - b);
        });
    }

    function handleQuickWeekdays() {
        const monday = startOfWeek(new Date());
        addDates(buildRange(monday, 5)); // T2 - T6
    }

    function handleQuickFullWeek() {
        const monday = startOfWeek(new Date());
        addDates(buildRange(monday, 7));
    }

    function handleQuickWeekend() {
        const monday = startOfWeek(new Date());
        const saturday = new Date(monday);
        saturday.setDate(saturday.getDate() + 5);
        addDates(buildRange(saturday, 2));
    }

    function handleAddCustomDate() {
        if (!customDateInput) return;
        const [y, m, d] = customDateInput.split("-").map(Number);
        if (!y || !m || !d) return;
        addDates([new Date(y, m - 1, d)]);
        setCustomDateInput("");
    }

    function handleRemoveDate(date) {
        setSelectedDates((prev) => prev.filter((d) => formatDateLocal(d) !== formatDateLocal(date)));
    }

    // ---------- Khung giờ soạn thảo ----------
    function handleGenerateBulkSlots() {
        setFeedback(null);
        const { startTime, endTime, interval, capacity } = bulkForm;
        if (!startTime || !endTime) {
            setFeedback({ type: "error", text: "Vui lòng nhập giờ bắt đầu và giờ kết thúc cho khung giờ hàng loạt." });
            return;
        }
        if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
            setFeedback({ type: "error", text: "Giờ kết thúc phải sau giờ bắt đầu." });
            return;
        }
        const step = Number(interval);
        const cap = Number(capacity);
        if (!step || step < 5) {
            setFeedback({ type: "error", text: "Khoảng cách slot không hợp lệ." });
            return;
        }
        if (!cap || cap < 1) {
            setFeedback({ type: "error", text: "Xe mỗi slot tối thiểu là 1." });
            return;
        }

        const generated = [];
        let cursor = timeToMinutes(startTime);
        const endMin = timeToMinutes(endTime);
        while (cursor + step <= endMin) {
            generated.push({
                id: makeId(),
                bayId: null, // null = áp dụng cho tất cả bay của chi nhánh
                startTime: minutesToTime(cursor),
                endTime: minutesToTime(cursor + step),
                maxCapacity: cap,
            });
            cursor += step;
        }

        if (generated.length === 0) {
            setFeedback({ type: "error", text: "Không tạo được khung giờ nào — hãy kiểm tra lại khoảng thời gian." });
            return;
        }

        setDraftSlots((prev) => {
            const existingKeys = new Set(prev.map((s) => `${s.startTime}-${s.bayId ?? "all"}`));
            const additions = generated.filter((s) => !existingKeys.has(`${s.startTime}-all`));
            return [...prev, ...additions].sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
    }

    function handleAddSingleSlot() {
        setFeedback(null);
        if (!singleSlot.bayId) {
            setFeedback({ type: "error", text: "Chi nhánh này chưa có bay nào — vui lòng tạo bay trước." });
            return;
        }
        if (!singleSlot.startTime || !singleSlot.endTime) {
            setFeedback({ type: "error", text: "Vui lòng nhập đủ giờ bắt đầu và giờ kết thúc." });
            return;
        }
        if (singleSlot.startTime >= singleSlot.endTime) {
            setFeedback({ type: "error", text: "Giờ kết thúc phải sau giờ bắt đầu." });
            return;
        }
        if (!singleSlot.maxCapacity || Number(singleSlot.maxCapacity) < 1) {
            setFeedback({ type: "error", text: "Sức chứa tối thiểu là 1." });
            return;
        }

        setDraftSlots((prev) => [
            ...prev,
            {
                id: makeId(),
                bayId: singleSlot.bayId,
                startTime: singleSlot.startTime,
                endTime: singleSlot.endTime,
                maxCapacity: Number(singleSlot.maxCapacity),
            },
        ].sort((a, b) => a.startTime.localeCompare(b.startTime)));
        setSingleSlot((prev) => ({ ...EMPTY_SINGLE_SLOT, bayId: prev.bayId }));
    }

    function handleRemoveDraftSlot(id) {
        setDraftSlots((prev) => prev.filter((s) => s.id !== id));
    }

    function handleClearDraftSlots() {
        setDraftSlots([]);
    }

    function handlePrefillFromChip(group) {
        setSlotInputMode("single");
        setSingleSlot((prev) => ({
            ...prev,
            startTime: group.startTime?.slice(0, 5) || prev.startTime,
        }));
        startTimeRef.current?.focus();
    }

    // ---------- Mẫu thiết lập ----------
    function handleSaveTemplate() {
        const autoName = `Mẫu thiết lập ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} (${selectedDates.length} ngày)`;
        const template = {
            name: autoName,
            note,
            dates: selectedDates.map(formatDateLocal),
            draftSlots,
        };
        const next = saveTemplateToStorage(branchId, template);
        setTemplates(next);
        setSelectedTemplateName(autoName);
        setFeedback({ type: "success", text: `Đã lưu mẫu "${autoName}".` });
    }

    function handleApplyTemplate(name) {
        setSelectedTemplateName(name);
        if (!name) return;
        const tpl = templates.find((t) => t.name === name);
        if (!tpl) return;
        setNote(tpl.note || "");
        setSelectedDates(
            (tpl.dates || []).map((s) => {
                const [y, m, d] = s.split("-").map(Number);
                return new Date(y, m - 1, d);
            })
        );
        setDraftSlots(tpl.draftSlots || []);
        setFeedback({ type: "success", text: `Đã áp dụng mẫu "${name}".` });
    }

    // ---------- Reset ----------
    function handleReset() {
        setNote("");
        setSelectedDates([]);
        setCustomDateInput("");
        setDraftSlots([]);
        setBulkForm(EMPTY_BULK_FORM);
        setSingleSlot((prev) => ({ ...EMPTY_SINGLE_SLOT, bayId: prev.bayId }));
        setSelectedTemplateName("");
        setFeedback(null);
    }

    // ---------- Submit ----------
    async function handleSubmit() {
        setFeedback(null);

        if (!branchId) {
            setFeedback({ type: "error", text: "Vui lòng chọn chi nhánh." });
            return;
        }
        if (selectedDates.length === 0) {
            setFeedback({ type: "error", text: "Vui lòng chọn ít nhất một ngày." });
            return;
        }
        if (draftSlots.length === 0) {
            setFeedback({ type: "error", text: "Vui lòng thêm ít nhất một khung giờ." });
            return;
        }
        if (bays.length === 0) {
            setFeedback({ type: "error", text: "Chi nhánh này chưa có bay nào — vui lòng tạo bay trước." });
            return;
        }

        setSubmitting(true);
        try {
            const payloads = [];
            selectedDates.forEach((date) => {
                draftSlots.forEach((slot) => {
                    const targetBayIds = slot.bayId ? [slot.bayId] : bays.map((b) => b.bayId);
                    targetBayIds.forEach((bayId) => {
                        payloads.push({
                            branchId: Number(branchId),
                            bayId: Number(bayId),
                            slotDate: formatDateLocal(date),
                            startTime: `${slot.startTime}:00`,
                            endTime: `${slot.endTime}:00`,
                            maxCapacity: Number(slot.maxCapacity),
                        });
                    });
                });
            });

            const results = await Promise.allSettled(payloads.map((p) => createTimeSlot(p)));
            const failed = results.filter((r) => r.status === "rejected");
            const succeeded = results.length - failed.length;

            if (failed.length === 0) {
                setFeedback({
                    type: "success",
                    text: `Đã tạo thành công ${succeeded} khung giờ trên ${selectedDates.length} ngày.`,
                });
                setDraftSlots([]);
            } else if (succeeded > 0) {
                setFeedback({
                    type: "error",
                    text: `Tạo thành công ${succeeded}/${results.length} khung giờ. ${failed.length} khung giờ bị lỗi (có thể trùng lịch).`,
                });
            } else {
                setFeedback({ type: "error", text: "Tạo đặt lịch thất bại. Vui lòng kiểm tra lại thông tin." });
            }
            loadSlots();
        } catch (error) {
            console.error("Create time slots failed:", error);
            setFeedback({ type: "error", text: "Tạo đặt lịch thất bại. Vui lòng kiểm tra lại thông tin." });
        } finally {
            setSubmitting(false);
        }
    }

    const sortedSelectedDates = useMemo(
        () => [...selectedDates].sort((a, b) => a - b),
        [selectedDates]
    );

    return (
        <div className="cbp-page">
            <div className="cbp-header">
                <div>
                    <h1>Tạo đặt lịch mới (Admin)</h1>
                    <p>Nhập thông tin khách hàng và chọn thời gian để tạo lịch hẹn mới trên hệ thống.</p>
                </div>

                <div className="cbp-header-actions">
                    <button className="cbp-btn-outline" onClick={handleSaveTemplate} type="button">
                        <Save size={18} />
                        Lưu thành mẫu thiết lập
                    </button>
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

                    <div className="cbp-field">
                        <label>Sử dụng mẫu thiết lập</label>
                        <div className="cbp-template-row">
                            <select
                                className="cbp-template-select"
                                value={selectedTemplateName}
                                onChange={(e) => handleApplyTemplate(e.target.value)}
                            >
                                <option value="">-- Chọn mẫu đã lưu --</option>
                                {templates.map((t) => (
                                    <option key={t.name} value={t.name}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="cbp-btn-icon"
                                title="Tải lại danh sách mẫu"
                                onClick={() => setTemplates(loadTemplatesFromStorage(branchId))}
                            >
                                <History size={16} />
                            </button>
                        </div>
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

                    <div className="cbp-field">
                        <label>Phím tắt:</label>
                        <div className="cbp-quick-date-btns">
                            <button type="button" className="cbp-quick-date-btn" onClick={handleQuickWeekdays}>
                                Thứ 2 - Thứ 6
                            </button>
                            <button type="button" className="cbp-quick-date-btn" onClick={handleQuickFullWeek}>
                                Cả tuần
                            </button>
                            <button type="button" className="cbp-quick-date-btn" onClick={handleQuickWeekend}>
                                Cuối tuần
                            </button>
                        </div>
                    </div>

                    <div className="cbp-field">
                        <label>Chọn ngày cụ thể</label>
                        <div className="cbp-date-add-row">
                            <input
                                type="date"
                                className="cbp-date-input-inline"
                                min={formatDateLocal(new Date())}
                                value={customDateInput}
                                onChange={(e) => setCustomDateInput(e.target.value)}
                            />
                            <button type="button" className="cbp-btn-primary" onClick={handleAddCustomDate}>
                                <Plus size={16} />
                                Thêm ngày
                            </button>
                        </div>
                    </div>

                    <div className="cbp-date-chips">
                        {sortedSelectedDates.length === 0 ? (
                            <span className="cbp-hint">Chưa có ngày nào được chọn...</span>
                        ) : (
                            sortedSelectedDates.map((date) => (
                                <span className="cbp-date-chip" key={formatDateLocal(date)}>
                                    {formatDateDisplay(date)}
                                    <button
                                        type="button"
                                        className="cbp-date-chip-remove"
                                        onClick={() => handleRemoveDate(date)}
                                        aria-label={`Bỏ chọn ngày ${formatDateDisplay(date)}`}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))
                        )}
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
                        </div>
                    </div>

                    {/* Khung giờ đã tồn tại trên hệ thống — chỉ để tham khảo */}
                    <div className="cbp-slots-grid">
                        {loadingSlots ? (
                            <div className="cbp-slots-empty">Đang tải khung giờ...</div>
                        ) : selectedDates.length === 0 ? (
                            <div className="cbp-slots-empty">Chọn ít nhất một ngày để xem khung giờ hiện có.</div>
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

                    <div className="cbp-tabs">
                        <button
                            type="button"
                            className={`cbp-tab ${slotInputMode === "bulk" ? "cbp-tab-active" : ""}`}
                            onClick={() => setSlotInputMode("bulk")}
                        >
                            Nhập hàng loạt
                        </button>
                        <button
                            type="button"
                            className={`cbp-tab ${slotInputMode === "single" ? "cbp-tab-active" : ""}`}
                            onClick={() => setSlotInputMode("single")}
                        >
                            Nhập lẻ
                        </button>
                    </div>

                    {slotInputMode === "bulk" ? (
                        <div className="cbp-new-slot-form">
                            <div className="cbp-bulk-grid">
                                <div className="cbp-field">
                                    <label>Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        value={bulkForm.startTime}
                                        onChange={(e) =>
                                            setBulkForm((prev) => ({ ...prev, startTime: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="cbp-field">
                                    <label>Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        value={bulkForm.endTime}
                                        onChange={(e) =>
                                            setBulkForm((prev) => ({ ...prev, endTime: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="cbp-field">
                                    <label>Khoảng cách (phút)</label>
                                    <select
                                        value={bulkForm.interval}
                                        onChange={(e) =>
                                            setBulkForm((prev) => ({ ...prev, interval: e.target.value }))
                                        }
                                    >
                                        {INTERVAL_OPTIONS.map((m) => (
                                            <option key={m} value={m}>
                                                {m} phút
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="cbp-field">
                                    <label>Xe mỗi slot</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={bulkForm.capacity}
                                        onChange={(e) =>
                                            setBulkForm((prev) => ({ ...prev, capacity: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="cbp-bulk-actions">
                                <button type="button" className="cbp-btn-danger" onClick={handleClearDraftSlots}>
                                    <Trash2 size={16} />
                                    Xóa hàng loạt
                                </button>
                                <button type="button" className="cbp-btn-primary" onClick={handleGenerateBulkSlots}>
                                    <Zap size={16} />
                                    Tạo khung giờ tự động
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="cbp-new-slot-form">
                            <div className="cbp-new-slot-grid">
                                <div className="cbp-field">
                                    <label>Bay áp dụng *</label>
                                    <select
                                        value={singleSlot.bayId}
                                        onChange={(e) =>
                                            setSingleSlot((prev) => ({ ...prev, bayId: e.target.value }))
                                        }
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
                                        value={singleSlot.startTime}
                                        onChange={(e) =>
                                            setSingleSlot((prev) => ({ ...prev, startTime: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="cbp-field">
                                    <label>Giờ kết thúc *</label>
                                    <input
                                        type="time"
                                        value={singleSlot.endTime}
                                        onChange={(e) =>
                                            setSingleSlot((prev) => ({ ...prev, endTime: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="cbp-field">
                                    <label>Sức chứa *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={singleSlot.maxCapacity}
                                        onChange={(e) =>
                                            setSingleSlot((prev) => ({ ...prev, maxCapacity: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="cbp-bulk-actions">
                                <button type="button" className="cbp-btn-primary" onClick={handleAddSingleSlot}>
                                    <Plus size={16} />
                                    Thêm khung giờ
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Khung giờ đang chờ tạo */}
                    <p className="cbp-new-slot-title">
                        Khung giờ sẽ tạo ({draftSlots.length})
                    </p>
                    <div className="cbp-draft-slots-grid">
                        {draftSlots.length === 0 ? (
                            <div className="cbp-slots-empty">Chưa có khung giờ nào được thêm.</div>
                        ) : (
                            draftSlots.map((slot) => (
                                <div className="cbp-draft-slot-chip" key={slot.id}>
                                    <button
                                        type="button"
                                        className="cbp-draft-slot-remove"
                                        onClick={() => handleRemoveDraftSlot(slot.id)}
                                        aria-label={`Xóa khung giờ ${slot.startTime}`}
                                    >
                                        <X size={12} />
                                    </button>
                                    <span className="cbp-draft-slot-time">{slot.startTime}</span>
                                    <span className="cbp-draft-slot-capacity">
                                        Tối đa: {slot.maxCapacity} xe
                                    </span>
                                    {slot.bayId && (
                                        <span className="cbp-draft-slot-bay">
                                            {bays.find((b) => String(b.bayId) === String(slot.bayId))?.bayName || "Bay"}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}