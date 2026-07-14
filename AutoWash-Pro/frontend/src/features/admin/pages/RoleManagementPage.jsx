import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import userApi from "../../../api/userApi";
import "./RoleManagementPage.css";

export default function RoleManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [keyword, setKeyword] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setLoading(true);

        try {
            const response = await userApi.list();
            setUsers(response.data?.data || response.data || []);
        } catch (err) {
            console.error(err);
            alert("Không tải được danh sách user.");
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const text = [
                user.id,
                user.username,
                user.email,
                user.phone,
                user.role,
                user.status,
            ]
                .join(" ")
                .toLowerCase();

            const matchKeyword = text.includes(keyword.toLowerCase());

            const matchRole =
                roleFilter === "all" ||
                String(user.role || "").toLowerCase() === roleFilter;

            const matchStatus =
                statusFilter === "all" ||
                String(user.status || "").toLowerCase() === statusFilter;

            return matchKeyword && matchRole && matchStatus;
        });
    }, [users, keyword, roleFilter, statusFilter]);

    async function changeRole(user, role) {
        const oldRole = String(user.role || "").toLowerCase();

        if (oldRole === role) return;

        const ok = window.confirm(
            `Bạn có chắc muốn đổi quyền tài khoản "${user.username}" từ ${oldRole} sang ${role}?`
        );

        if (!ok) return;

        try {
            await userApi.updateRole(user.id, role);
            alert("Đổi quyền thành công.");
            loadUsers();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Đổi quyền thất bại.");
        }
    }

    async function changeStatus(user) {
        const currentStatus = String(user.status || "").toLowerCase();
        const nextStatus = currentStatus === "active" ? "inactive" : "active";

        const ok = window.confirm(
            nextStatus === "inactive"
                ? `Bạn có chắc muốn khóa tài khoản "${user.username}" không?`
                : `Bạn có chắc muốn mở khóa tài khoản "${user.username}" không?`
        );

        if (!ok) return;

        try {
            await userApi.updateStatus(user.id, nextStatus);
            alert("Cập nhật trạng thái thành công.");
            loadUsers();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Cập nhật trạng thái thất bại.");
        }
    }

    function getRoleClass(role) {
        const value = String(role || "").toLowerCase();

        if (value === "admin") return "admin";
        if (value === "staff") return "staff";
        return "customer";
    }

    function getStatusClass(status) {
        return String(status || "").toLowerCase() === "active"
            ? "success"
            : "danger";
    }

    return (
        <div className="manage-page">
            <div className="manage-header">
                <div>
                    <h1>Phân quyền người dùng</h1>
                    <p>Quản lý quyền và trạng thái tài khoản trong hệ thống.</p>
                </div>

                <button className="refresh-btn" onClick={loadUsers}>
                    <RefreshCw size={18} />
                    Làm mới
                </button>
            </div>

            <div className="manage-toolbar">
                <div className="manage-search">
                    <Search size={18} />
                    <input
                        placeholder="Tìm username, email, số điện thoại..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>

                <select
                    className="manage-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">Tất cả quyền</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="customer">Customer</option>
                </select>

                <select
                    className="manage-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div className="manage-card">
                {loading ? (
                    <div className="empty-state">Đang tải danh sách user...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">Không có user phù hợp.</div>
                ) : (
                    <div className="booking-table-wrap">
                        <table className="booking-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role hiện tại</th>
                                    <th>Đổi quyền</th>
                                    <th>Status</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <tr key={user.id}>
                                        <td>{index + 1}</td>
                                        <td>{user.id}</td>
                                        <td>{user.username || "N/A"}</td>
                                        <td>{user.email || "N/A"}</td>
                                        <td>{user.phone || "N/A"}</td>

                                        <td>
                                            <span className={`role-badge ${getRoleClass(user.role)}`}>
                                                {user.role || "N/A"}
                                            </span>
                                        </td>

                                        <td>
                                            <select
                                                className="role-select"
                                                value={String(user.role || "").toLowerCase()}
                                                onChange={(e) => changeRole(user, e.target.value)}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="staff">Staff</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>

                                        <td>
                                            <span className={`status-badge ${getStatusClass(user.status)}`}>
                                                {user.status || "N/A"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                className={`role-action-btn ${String(user.status || "").toLowerCase() === "active"
                                                        ? "lock"
                                                        : "unlock"
                                                    }`}
                                                onClick={() => changeStatus(user)}
                                            >
                                                {String(user.status || "").toLowerCase() === "active"
                                                    ? "Khóa"
                                                    : "Mở khóa"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}