import React, { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
    getBranches,
    createBranch,
    updateBranch,
    changeBranchStatus,
    deleteBranch,
} from "../../../api/branchService";
import "./ManageBranchesPage.css";

const emptyForm = {
    branchName: "",
    address: "",
    phone: "",
    openTime: "07:00:00",
    closeTime: "21:00:00",
    capacity: 4,
    status: "active",
};

export default function ManageBranchesPage() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        loadBranches();
    }, []);

    async function loadBranches() {
        setLoading(true);

        try {
            const response = await getBranches();



            const result = response.data?.data || response.data || [];

            if (Array.isArray(result)) {
                setBranches(result);
            } else if (Array.isArray(result.content)) {
                setBranches(result.content);
            } else {
                setBranches([]);
            }
        } catch (error) {
            console.error("Load branches failed:", error);
            setBranches([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredBranches = useMemo(() => {
        return branches.filter((branch) => {
            const text = [
                branch.branchName,
                branch.name,
                branch.address,
                branch.phone,
                branch.status,
            ]
                .join(" ")
                .toLowerCase();

            const matchKeyword = text.includes(keyword.toLowerCase());

            const matchStatus =
                statusFilter === "all" ||
                String(branch.status || "").toLowerCase() === statusFilter;

            return matchKeyword && matchStatus;
        });
    }, [branches, keyword, statusFilter]);

    function openCreateForm() {
        setEditingBranch(null);
        setFormData(emptyForm);
        setShowForm(true);
    }

    function openEditForm(branch) {
        setEditingBranch(branch);

        setFormData({
            branchName: branch.branchName || branch.name || "",
            address: branch.address || "",
            phone: branch.phone || "",
            openTime: branch.openTime || branch.open_time || "07:00:00",
            closeTime: branch.closeTime || branch.close_time || "21:00:00",
            capacity: branch.capacity || 4,
            status: branch.status || "active",
        });

        setShowForm(true);
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === "capacity" ? Number(value) : value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.branchName.trim()) {
            alert("Vui lòng nhập tên chi nhánh.");
            return;
        }

        if (!formData.address.trim()) {
            alert("Vui lòng nhập địa chỉ chi nhánh.");
            return;
        }

        try {
            if (editingBranch) {
                const branchId = editingBranch.branchId || editingBranch.id;

                await updateBranch(branchId, formData);
                alert("Cập nhật chi nhánh thành công.");
            } else {
                await createBranch(formData);
                alert("Thêm chi nhánh thành công.");
            }

            setShowForm(false);
            setEditingBranch(null);
            setFormData(emptyForm);
            loadBranches();
        } catch (error) {
            console.error("Save branch failed:", error);
            alert(error.response?.data?.message || "Lưu chi nhánh thất bại.");
        }
    }

    async function handleToggleStatus(branch) {
        const branchId = branch.branchId || branch.id;

        if (!branchId) {
            alert("Không tìm thấy branchId.");
            return;
        }

        const currentStatus = String(branch.status || "").toLowerCase();
        const nextStatus = currentStatus === "active" ? "closed" : "active";

        const ok = window.confirm(
            `Bạn có chắc muốn đổi trạng thái chi nhánh này sang ${nextStatus}?`
        );

        if (!ok) return;

        try {
            await changeBranchStatus(branchId, nextStatus);
            alert("Đổi trạng thái chi nhánh thành công.");
            loadBranches();
        } catch (error) {
            console.error("Change branch status failed:", error);
            alert(error.response?.data?.message || "Đổi trạng thái thất bại.");
        }
    }

    async function handleDelete(branch) {
        const branchId = branch.branchId || branch.id;

        if (!branchId) {
            alert("Không tìm thấy branchId.");
            return;
        }

        const ok = window.confirm("Bạn có chắc muốn xóa mềm chi nhánh này không?");
        if (!ok) return;

        try {
            await deleteBranch(branchId);
            alert("Xóa chi nhánh thành công.");
            loadBranches();
        } catch (error) {
            console.error("Delete branch failed:", error);
            alert(error.response?.data?.message || "Xóa chi nhánh thất bại.");
        }
    }

    function getStatusClass(status) {
        const value = String(status || "").toLowerCase();

        if (value === "active") return "success";
        if (value === "closed" || value === "inactive") return "danger";
        return "warning";
    }

    function getStatusText(status) {
        const value = String(status || "").toLowerCase();

        if (value === "active") return "Hoạt động";
        if (value === "closed") return "Đã đóng";
        if (value === "inactive") return "Tạm dừng";
        return status || "N/A";
    }

    return (
        <div className="manage-page">
            <div className="manage-header">
                <div>
                    <h1>Quản lý chi nhánh</h1>
                    <p>Theo dõi, thêm, sửa và quản lý trạng thái chi nhánh.</p>
                </div>

                <button className="create-btn" onClick={openCreateForm}>
                    <Plus size={18} />
                    Thêm chi nhánh
                </button>
            </div>

            <div className="manage-toolbar">
                <div className="manage-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên chi nhánh, địa chỉ, số điện thoại..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>

                <select
                    className="manage-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="closed">Đã đóng</option>
                    <option value="inactive">Tạm dừng</option>
                </select>

                <button className="refresh-btn" onClick={loadBranches}>
                    Làm mới
                </button>
            </div>

            <div className="manage-card">
                {loading ? (
                    <div className="empty-state">Đang tải danh sách chi nhánh...</div>
                ) : filteredBranches.length === 0 ? (
                    <div className="empty-state">Không có chi nhánh phù hợp.</div>
                ) : (
                    <div className="booking-table-wrap">
                        <table className="booking-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tên chi nhánh</th>
                                    <th>Địa chỉ</th>
                                    <th>Số điện thoại</th>
                                    <th>Giờ mở cửa</th>
                                    <th>Sức chứa</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredBranches.map((branch, index) => (
                                    <tr key={branch.branchId || branch.id || index}>
                                        <td>{index + 1}</td>
                                        <td>{branch.branchName || branch.name || "N/A"}</td>
                                        <td>{branch.address || "N/A"}</td>
                                        <td>{branch.phone || "N/A"}</td>
                                        <td>
                                            {(branch.openTime || branch.open_time || "N/A") +
                                                " - " +
                                                (branch.closeTime || branch.close_time || "N/A")}
                                        </td>
                                        <td>{branch.capacity || 0}</td>
                                        <td>
                                            <span
                                                className={`status-badge ${getStatusClass(
                                                    branch.status
                                                )}`}
                                            >
                                                {getStatusText(branch.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button
                                                    className="action-btn view"
                                                    title="Xem chi tiết"
                                                    onClick={() => setSelectedBranch(branch)}
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    className="action-btn edit"
                                                    title="Sửa chi nhánh"
                                                    onClick={() => openEditForm(branch)}
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    className="action-btn warning"
                                                    title="Đóng/Mở chi nhánh"
                                                    onClick={() => handleToggleStatus(branch)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <button
                                                    className="action-btn cancel"
                                                    title="Xóa mềm"
                                                    onClick={() => handleDelete(branch)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedBranch && (
                <div className="modal-backdrop">
                    <div className="branch-modal">
                        <div className="modal-header">
                            <h2>Chi tiết chi nhánh</h2>
                            <button onClick={() => setSelectedBranch(null)}>×</button>
                        </div>

                        <div className="detail-content">
                            <p>
                                <strong>ID:</strong>{" "}
                                {selectedBranch.branchId || selectedBranch.id || "N/A"}
                            </p>
                            <p>
                                <strong>Tên chi nhánh:</strong>{" "}
                                {selectedBranch.branchName || selectedBranch.name || "N/A"}
                            </p>
                            <p>
                                <strong>Địa chỉ:</strong> {selectedBranch.address || "N/A"}
                            </p>
                            <p>
                                <strong>Số điện thoại:</strong> {selectedBranch.phone || "N/A"}
                            </p>
                            <p>
                                <strong>Giờ mở cửa:</strong>{" "}
                                {selectedBranch.openTime || selectedBranch.open_time || "N/A"}
                            </p>
                            <p>
                                <strong>Giờ đóng cửa:</strong>{" "}
                                {selectedBranch.closeTime || selectedBranch.close_time || "N/A"}
                            </p>
                            <p>
                                <strong>Sức chứa:</strong> {selectedBranch.capacity || 0}
                            </p>
                            <p>
                                <strong>Trạng thái:</strong>{" "}
                                {getStatusText(selectedBranch.status)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="modal-backdrop">
                    <div className="branch-modal">
                        <div className="modal-header">
                            <h2>{editingBranch ? "Cập nhật chi nhánh" : "Thêm chi nhánh"}</h2>
                            <button onClick={() => setShowForm(false)}>×</button>
                        </div>

                        <form className="branch-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Tên chi nhánh</label>
                                    <input
                                        name="branchName"
                                        value={formData.branchName}
                                        onChange={handleChange}
                                        placeholder="VD: Chi nhánh Quận 1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Số điện thoại</label>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="VD: 02812345678"
                                    />
                                </div>

                                <div className="form-group full">
                                    <label>Địa chỉ</label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Giờ mở cửa</label>
                                    <input
                                        type="time"
                                        name="openTime"
                                        value={String(formData.openTime).slice(0, 5)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                openTime: e.target.value + ":00",
                                            }))
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Giờ đóng cửa</label>
                                    <input
                                        type="time"
                                        name="closeTime"
                                        value={String(formData.closeTime).slice(0, 5)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                closeTime: e.target.value + ":00",
                                            }))
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Sức chứa</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="active">Hoạt động</option>
                                        <option value="closed">Đã đóng</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-modal-btn"
                                    onClick={() => setShowForm(false)}
                                >
                                    Hủy
                                </button>

                                <button type="submit" className="save-btn">
                                    {editingBranch ? "Lưu thay đổi" : "Tạo chi nhánh"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}