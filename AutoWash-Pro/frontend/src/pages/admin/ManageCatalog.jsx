import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Car, LayoutGrid, BarChart2, Calendar, Archive, Megaphone, Bell,
    HelpCircle, Settings, Plus, Edit, Trash2, RefreshCw
} from "lucide-react";
import "./ManageCatalog.css";
import "./AdminNotificationPage.css";

// Import các API service ta đã cấu hình ở Bước 1
import { getBranches, createBranch, updateBranch, deleteBranch } from "../../api/branchService";
import { getBaysByBranch, createBay, updateBayStatus, deleteBay } from "../../api/washBayService";
import { getAllServices, createService, updateService, deactivateService } from "../../api/servicePackageService";
import { isLoggedIn, logout as clearAuth } from "../../api/authService";

// Khai báo menu điều hướng bên trái (Sidebar)
const SIDEBAR_NAV = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutGrid },
    { id: "analytics", label: "Phân tích", icon: BarChart2 },
    { id: "booking", label: "Đặt lịch", icon: Calendar },
    { id: "inventory", label: "Kho hàng", icon: Archive },
    { id: "marketing", label: "Tiếp thị", icon: Megaphone },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "catalog", label: "Chi nhánh & Dịch vụ", icon: Settings, active: true }, // Trang hiện tại được đánh dấu Active
];

export default function ManageCatalog() {
    const navigate = useNavigate();

    // ==========================================
    // 1. STATE MANAGEMENT (Quản lý trạng thái biến)
    // Trong React, khi giá trị của State thay đổi, giao diện sẽ tự động vẽ lại (re-render)
    // ==========================================
    const [activeTab, setActiveTab] = useState("branches"); // Tab đang hiển thị: "branches", "bays", hoặc "packages"
    const [loading, setLoading] = useState(false); // Trạng thái đang tải dữ liệu từ server

    // Dữ liệu danh sách lấy từ Backend
    const [branches, setBranches] = useState([]);
    const [bays, setBays] = useState([]);
    const [packages, setPackages] = useState([]);

    // Bộ lọc hoặc dữ liệu lựa chọn
    const [selectedBranchId, setSelectedBranchId] = useState(""); // Chi nhánh được chọn ở Tab Khoang Rửa

    // Trạng thái điều khiển Modal Popup (Thêm/Sửa)
    const [showModal, setShowModal] = useState(false); // Ẩn/Hiện Modal
    const [modalType, setModalType] = useState(""); // Loại modal đang xử lý: "branch_add", "branch_edit", "bay_add", "package_add", "package_edit"
    const [editingItem, setEditingItem] = useState(null); // Đối tượng dữ liệu đang được chỉnh sửa (khi bấm nút Sửa)

    // Các biến tạm lưu dữ liệu người dùng gõ vào form trong Modal
    const [branchName, setBranchName] = useState("");
    const [branchAddress, setBranchAddress] = useState("");
    const [branchStatus, setBranchStatus] = useState("active");
    const [branchCapacity, setBranchCapacity] = useState(1);

    const [bayName, setBayName] = useState("");
    const [bayStatus, setBayStatus] = useState("available");

    const [packageName, setPackageName] = useState("");
    const [packageDesc, setPackageDesc] = useState("");
    const [packagePrice, setPackagePrice] = useState("");
    const [packageDuration, setPackageDuration] = useState("");
    const [packageActive, setPackageActive] = useState(true);

    // ==========================================
    // 2. LIFECYCLE & INITIAL LOAD (Nạp dữ liệu ban đầu)
    // useEffect chạy tự động khi Component được nạp vào màn hình lần đầu tiên
    // ==========================================
    useEffect(() => {
        // Kiểm tra bảo mật: Nếu chưa đăng nhập, đá về trang login
        if (!isLoggedIn()) {
            navigate("/login");
            return;
        }
        loadData();
    }, [activeTab, selectedBranchId]); // Chạy lại hàm loadData mỗi khi đổi tab hoặc đổi chi nhánh ở bộ lọc

    // Hàm tải dữ liệu tổng hợp tùy theo Tab đang hiển thị
    async function loadData() {
        setLoading(true);
        try {
            if (activeTab === "branches") {
                const response = await getBranches();
                setBranches(response.data || response); // Hỗ trợ cả trường hợp API bọc data hoặc trả mảng trực tiếp
            } else if (activeTab === "bays") {
                // Luôn load danh sách chi nhánh để hiển thị ở ô dropdown chọn chi nhánh
                const branchResponse = await getBranches();
                const branchList = branchResponse.data || branchResponse;
                setBranches(branchList);

                // Nếu đã chọn 1 chi nhánh cụ thể, load khoang rửa của chi nhánh đó
                if (selectedBranchId) {
                    const bayResponse = await getBaysByBranch(selectedBranchId);
                    // Backend trả về bọc trong ApiResponse { success, data, message }
                    setBays(bayResponse.data?.data || bayResponse.data || bayResponse);
                } else if (branchList.length > 0) {
                    // Nếu chưa chọn chi nhánh nào, tự động chọn chi nhánh đầu tiên trong danh sách
                    setSelectedBranchId(branchList[0].branchId);
                }
            } else if (activeTab === "packages") {
                const response = await getAllServices();
                setPackages(response.data || response);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ API:", error);
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // 3. ACTION HANDLERS (Hàm xử lý nghiệp vụ)
    // ==========================================

    // Mở modal thêm mới chi nhánh
    const openAddBranchModal = () => {
        setModalType("branch_add");
        setBranchName("");
        setBranchAddress("");
        setBranchStatus("active");
        setBranchCapacity(1);
        setShowModal(true);
    };

    // Mở modal sửa chi nhánh
    const openEditBranchModal = (branch) => {
        setModalType("branch_edit");
        setEditingItem(branch);
        setBranchName(branch.branchName);
        setBranchAddress(branch.address);
        setBranchStatus(branch.status?.toLowerCase());
        setBranchCapacity(branch.capacity || 1);
        setShowModal(true);
    };

    // Lưu Chi nhánh (Cả thêm mới lẫn sửa đổi)
    const handleSaveBranch = async (e) => {
        e.preventDefault(); // Ngăn trình duyệt load lại trang khi submit form
        try {
            const data = {
                branchName: branchName,
                address: branchAddress,
                status: branchStatus?.toLowerCase(),
                phone: editingItem?.phone || "0901234567",
                capacity: parseInt(branchCapacity) || 1
            };
            if (modalType === "branch_add") {
                await createBranch(data);
            } else {
                await updateBranch(editingItem.branchId, data);
            }
            setShowModal(false);
            loadData(); // Load lại bảng sau khi lưu thành công
        } catch (error) {
            alert("Lỗi khi lưu chi nhánh: " + error.message);
        }
    };

    // Xóa chi nhánh (Soft Delete)
    const handleDeleteBranch = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn đóng cửa (Xóa mềm) chi nhánh này không?")) {
            try {
                await deleteBranch(id);
                loadData();
            } catch (error) {
                alert("Lỗi khi xóa chi nhánh: " + error.message);
            }
        }
    };

    // Mở modal thêm khoang rửa
    const openAddBayModal = () => {
        if (!selectedBranchId) {
            alert("Vui lòng chọn một chi nhánh trước!");
            return;
        }
        setModalType("bay_add");
        setBayName("");
        setBayStatus("available");
        setShowModal(true);
    };

    // Lưu khoang rửa mới
    const handleSaveBay = async (e) => {
        e.preventDefault();
        try {
            const data = {
                bayName: bayName,
                status: bayStatus,
                branchId: parseInt(selectedBranchId)
            };
            await createBay(data);
            setShowModal(false);
            loadData();
        } catch (error) {
            alert("Lỗi khi tạo khoang rửa: " + error.message);
        }
    };

    // Đổi trạng thái vật lý của khoang rửa nhanh
    const handleToggleBayStatus = async (bay, newStatus) => {
        try {
            await updateBayStatus(bay.bayId, newStatus.toLowerCase());
            loadData();
        } catch (error) {
            alert("Lỗi khi đổi trạng thái khoang: " + error.message);
        }
    };

    // Xóa khoang rửa
    const handleDeleteBay = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa khoang rửa này khỏi hệ thống?")) {
            try {
                await deleteBay(id);
                loadData();
            } catch (error) {
                alert("Lỗi khi xóa khoang rửa: " + error.message);
            }
        }
    };

    // Mở modal thêm gói dịch vụ
    const openAddPackageModal = () => {
        setModalType("package_add");
        setPackageName("");
        setPackageDesc("");
        setPackagePrice("");
        setPackageDuration("");
        setPackageActive(true);
        setShowModal(true);
    };

    // Mở modal sửa gói dịch vụ
    const openEditPackageModal = (pkg) => {
        setModalType("package_edit");
        setEditingItem(pkg);
        setPackageName(pkg.serviceName);
        setPackageDesc(pkg.description);
        setPackagePrice(pkg.basePrice);
        setPackageDuration(pkg.durationMinutes);
        setPackageActive(pkg.isActive);
        setShowModal(true);
    };

    // Lưu gói dịch vụ
    const handleSavePackage = async (e) => {
        e.preventDefault();
        try {
            const data = {
                serviceName: packageName,
                description: packageDesc,
                basePrice: parseFloat(packagePrice),
                durationMinutes: parseInt(packageDuration),
                isActive: packageActive
            };
            if (modalType === "package_add") {
                await createService(data);
            } else {
                await updateService(editingItem.serviceId, data);
            }
            setShowModal(false);
            loadData();
        } catch (error) {
            alert("Lỗi khi lưu gói dịch vụ: " + error.message);
        }
    };

    // Vô hiệu hóa gói dịch vụ
    const handleDeactivatePackage = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn ngưng hoạt động gói dịch vụ này?")) {
            try {
                await deactivateService(id);
                loadData();
            } catch (error) {
                alert("Lỗi khi vô hiệu hóa gói: " + error.message);
            }
        }
    };

    // Xử lý chuyển hướng khi bấm nút trên Sidebar
    const handleSidebarClick = (id) => {
        if (id === "notifications") {
            navigate("/admin/notifications");
        } else if (id === "catalog") {
            navigate("/admin/catalog");
        } else {
            alert("Chức năng đang phát triển!");
        }
    };

    return (
        <div className="an-app">
            {/* 4. SIDEBAR NAVIGATION */}
            <aside className="an-sidebar">
                <div className="an-brand">
                    <img src="/logo.png" alt="WashFlow Pro" style={{ height: "36px", width: "auto", alignSelf: "center" }} />
                    <div>
                        <h1>WashFlow Pro</h1>
                        <p>Bảng điều khiển Admin</p>
                    </div>
                </div>

                <nav className="an-sidebar__nav">
                    {SIDEBAR_NAV.map(({ id, label, icon: Icon, active }) => (
                        <button
                            key={id}
                            className={`an-sidebar__item ${active ? "is-active" : ""}`}
                            onClick={() => handleSidebarClick(id)}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <div className="an-sidebar__footer">
                    <button className="an-sidebar__item an-sidebar__item--muted">
                        <HelpCircle size={18} /><span>Trung tâm hỗ trợ</span>
                    </button>
                    <button className="an-sidebar__item an-sidebar__item--muted">
                        <Settings size={18} /><span>Cài đặt</span>
                    </button>
                    <button className="an-sidebar__item an-sidebar__item--muted" onClick={() => { clearAuth(); navigate("/login"); }}>
                        <Megaphone size={18} /><span>Đăng xuất</span>
                    </button>
                    <div className="an-status">
                        <span className="an-status__dot" />
                        TRẠNG THÁI: ĐANG HOẠT ĐỘNG
                    </div>
                </div>
            </aside>

            {/* 5. MAIN CONTENT AREA */}
            <main className="mc-main">
                {/* Topbar */}
                <header className="mc-topbar">
                    <div className="mc-topbar__title">
                        <span className="mc-breadcrumb">Quản lý Hệ thống</span>
                        <h2>Danh mục Chi nhánh & Dịch vụ</h2>
                    </div>
                    <div className="mc-topbar__actions">
                        <button className="mc-icon-btn" onClick={loadData} title="Tải lại dữ liệu">
                            <RefreshCw size={18} className={loading ? "spin" : ""} />
                        </button>
                        <div className="mc-profile">
                            <div className="mc-avatar">AD</div>
                            <span>Quản trị viên</span>
                        </div>
                    </div>
                </header>

                {/* Tab Switcher Headers */}
                <div className="mc-tabs">
                    <button
                        className={`mc-tab ${activeTab === "branches" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("branches")}
                    >
                        Chi nhánh ({branches.length})
                    </button>
                    <button
                        className={`mc-tab ${activeTab === "bays" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("bays")}
                    >
                        Khoang rửa
                    </button>
                    <button
                        className={`mc-tab ${activeTab === "packages" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("packages")}
                    >
                        Gói dịch vụ ({packages.length})
                    </button>
                </div>

                {/* Dynamic Canvas Area based on selected Tab */}
                <div className="mc-content">
                    {loading && <div className="mc-loading">Đang tải dữ liệu...</div>}

                    {/* TAB 1: BRANCHES */}
                    {!loading && activeTab === "branches" && (
                        <div className="mc-section">
                            <div className="mc-section__header">
                                <h3>Danh sách Chi nhánh</h3>
                                <button className="mc-btn mc-btn--primary" onClick={openAddBranchModal}>
                                    <Plus size={16} /> Thêm chi nhánh
                                </button>
                            </div>

                            <div className="mc-table-wrapper">
                                <table className="mc-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên chi nhánh</th>
                                        <th>Địa chỉ</th>
                                        <th>Sức chứa</th>
                                        <th>Trạng thái</th>
                                        <th className="text-right">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {branches.map((b) => (
                                        <tr key={b.branchId}>
                                            <td><strong>#{b.branchId}</strong></td>
                                            <td>{b.branchName}</td>
                                            <td>{b.address}</td>
                                            <td>{b.capacity || 1} xe</td>
                                            <td>
                                                <span className={`mc-badge mc-badge--${b.status?.toLowerCase() === 'active' ? 'open' : b.status?.toLowerCase() === 'inactive' ? 'closed' : b.status?.toLowerCase()}`}>
                                                    {b.status?.toLowerCase() === "open" || b.status?.toLowerCase() === "active" ? "Mở cửa" : b.status?.toLowerCase() === "closed" || b.status?.toLowerCase() === "inactive" ? "Đóng cửa" : "Bảo trì"}
                                                </span>
                                            </td>
                                            <td className="text-right mc-actions">
                                                <button className="mc-action-btn" onClick={() => openEditBranchModal(b)} title="Chỉnh sửa">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="mc-action-btn mc-action-btn--danger" onClick={() => handleDeleteBranch(b.branchId)} title="Đóng cửa">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: WASH BAYS */}
                    {!loading && activeTab === "bays" && (
                        <div className="mc-section">
                            <div className="mc-section__header flex-row justify-between items-center gap-md">
                                <div className="flex items-center gap-sm">
                                    <span className="text-on-surface-variant font-medium">Chọn Chi nhánh:</span>
                                    <select
                                        className="mc-select"
                                        value={selectedBranchId}
                                        onChange={(e) => setSelectedBranchId(e.target.value)}
                                    >
                                        {branches.map(b => (
                                            <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="mc-btn mc-btn--primary" onClick={openAddBayModal} disabled={!selectedBranchId}>
                                    <Plus size={16} /> Thêm khoang rửa
                                </button>
                            </div>

                            <div className="mc-table-wrapper mt-md">
                                <table className="mc-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên khoang</th>
                                        <th>Trạng thái vật lý</th>
                                        <th>Thay đổi trạng thái</th>
                                        <th className="text-right">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bays.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-lg text-on-surface-variant">Chi nhánh này chưa có khoang rửa nào được thiết lập.</td>
                                        </tr>
                                    )}
                                    {bays.map((bay) => (
                                        <tr key={bay.bayId}>
                                            <td><strong>#{bay.bayId}</strong></td>
                                            <td>{bay.bayName}</td>
                                            <td>
                                                <span className={`mc-badge mc-badge--${bay.status?.toLowerCase() === 'available' ? 'empty' : bay.status?.toLowerCase() === 'occupied' ? 'washing' : bay.status?.toLowerCase()}`}>
                                                    {bay.status?.toLowerCase() === "available" ? "Trống" : bay.status?.toLowerCase() === "occupied" ? "Đang rửa" : bay.status?.toLowerCase() === "maintenance" ? "Bảo trì" : "Đã đặt trước"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex gap-xs">
                                                    <button
                                                        className={`mc-mini-btn ${bay.status?.toLowerCase() === "available" ? "active" : ""}`}
                                                        onClick={() => handleToggleBayStatus(bay, "available")}
                                                    >
                                                        Trống
                                                    </button>
                                                    <button
                                                        className={`mc-mini-btn ${bay.status?.toLowerCase() === "occupied" ? "active" : ""}`}
                                                        onClick={() => handleToggleBayStatus(bay, "occupied")}
                                                    >
                                                        Rửa
                                                    </button>
                                                    <button
                                                        className={`mc-mini-btn ${bay.status?.toLowerCase() === "maintenance" ? "active" : ""}`}
                                                        onClick={() => handleToggleBayStatus(bay, "maintenance")}
                                                    >
                                                        Bảo trì
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="text-right mc-actions">
                                                <button className="mc-action-btn mc-action-btn--danger" onClick={() => handleDeleteBay(bay.bayId)} title="Xóa khoang">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SERVICE PACKAGES */}
                    {!loading && activeTab === "packages" && (
                        <div className="mc-section">
                            <div className="mc-section__header">
                                <h3>Bảng giá & Gói dịch vụ rửa xe</h3>
                                <button className="mc-btn mc-btn--primary" onClick={openAddPackageModal}>
                                    <Plus size={16} /> Thêm gói dịch vụ
                                </button>
                            </div>

                            <div className="mc-table-wrapper">
                                <table className="mc-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên gói cước</th>
                                        <th>Mô tả</th>
                                        <th>Giá cước (VND)</th>
                                        <th>Thời gian rửa</th>
                                        <th>Trạng thái</th>
                                        <th className="text-right">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {packages.map((pkg) => (
                                        <tr key={pkg.serviceId}>
                                            <td><strong>#{pkg.serviceId}</strong></td>
                                            <td className="font-semibold">{pkg.serviceName}</td>
                                            <td className="mc-table-desc" title={pkg.description}>{pkg.description}</td>
                                            <td><strong className="text-primary">{pkg.basePrice?.toLocaleString("vi-VN")} ₫</strong></td>
                                            <td>{pkg.durationMinutes} phút</td>
                                            <td>
                                                <span className={`mc-badge mc-badge--${pkg.isActive ? "open" : "closed"}`}>
                                                    {pkg.isActive ? "Đang chạy" : "Ngưng bán"}
                                                </span>
                                            </td>
                                            <td className="text-right mc-actions">
                                                <button className="mc-action-btn" onClick={() => openEditPackageModal(pkg)} title="Chỉnh sửa">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="mc-action-btn mc-action-btn--danger" onClick={() => handleDeactivatePackage(pkg.serviceId)} title="Ngưng bán">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ==========================================
          6. MODAL POPUP DIALOG (Dùng chung cho Form nhập liệu)
          Hiển thị đè lên màn hình khi showModal = true
          ========================================== */}
            {showModal && (
                <div className="mc-modal-overlay">
                    <div className="mc-modal-card">
                        <div className="mc-modal-header">
                            <h4>
                                {modalType === "branch_add" && "Thêm Chi nhánh mới"}
                                {modalType === "branch_edit" && "Chỉnh sửa Chi nhánh"}
                                {modalType === "bay_add" && "Thêm Khoang rửa mới"}
                                {modalType === "package_add" && "Tạo Gói dịch vụ mới"}
                                {modalType === "package_edit" && "Chỉnh sửa Gói dịch vụ"}
                            </h4>
                            <button className="mc-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        {/* FORM XỬ LÝ CHO CHI NHÁNH */}
                        {(modalType === "branch_add" || modalType === "branch_edit") && (
                            <form onSubmit={handleSaveBranch}>
                                <div className="mc-form-group">
                                    <label>Tên chi nhánh</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: WashFlow Quận 7"
                                        value={branchName}
                                        onChange={(e) => setBranchName(e.target.value)}
                                    />
                                </div>
                                <div className="mc-form-group">
                                    <label>Địa chỉ cụ thể</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: 456 Nguyễn Thị Thập, P. Tân Quy"
                                        value={branchAddress}
                                        onChange={(e) => setBranchAddress(e.target.value)}
                                    />
                                </div>
                                <div className="mc-form-group">
                                    <label>Trạng thái</label>
                                    <select value={branchStatus} onChange={(e) => setBranchStatus(e.target.value)}>
                                        <option value="active">Mở cửa hoạt động (ACTIVE)</option>
                                        <option value="inactive">Đóng cửa (INACTIVE)</option>
                                    </select>
                                </div>
                                <div className="mc-form-group">
                                    <label>Sức chứa tối đa (Số xe có thể phục vụ cùng lúc)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        placeholder="Ví dụ: 4"
                                        value={branchCapacity}
                                        onChange={(e) => setBranchCapacity(e.target.value)}
                                    />
                                </div>
                                <div className="mc-modal-footer">
                                    <button type="button" className="mc-btn mc-btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="mc-btn mc-btn--primary">Lưu</button>
                                </div>
                            </form>
                        )}

                        {/* FORM XỬ LÝ CHO KHOANG RỬA */}
                        {modalType === "bay_add" && (
                            <form onSubmit={handleSaveBay}>
                                <div className="mc-form-group">
                                    <label>Tên/Mã khoang rửa</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: KHOANG 03"
                                        value={bayName}
                                        onChange={(e) => setBayName(e.target.value)}
                                    />
                                </div>
                                <div className="mc-form-group">
                                    <label>Trạng thái hoạt động</label>
                                    <select value={bayStatus} onChange={(e) => setBayStatus(e.target.value)}>
                                        <option value="available">Trống - Sẵn sàng nhận xe (AVAILABLE)</option>
                                        <option value="maintenance">Đang bảo dưỡng kỹ thuật (MAINTENANCE)</option>
                                    </select>
                                </div>
                                <div className="mc-modal-footer">
                                    <button type="button" className="mc-btn mc-btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="mc-btn mc-btn--primary">Lưu</button>
                                </div>
                            </form>
                        )}

                        {/* FORM XỬ LÝ CHO GÓI DỊCH VỤ */}
                        {(modalType === "package_add" || modalType === "package_edit") && (
                            <form onSubmit={handleSavePackage}>
                                <div className="mc-form-group">
                                    <label>Tên gói dịch vụ</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Rửa xe Cao cấp phủ Wax"
                                        value={packageName}
                                        onChange={(e) => setPackageName(e.target.value)}
                                    />
                                </div>
                                <div className="mc-form-group">
                                    <label>Mô tả chi tiết</label>
                                    <textarea
                                        rows="3"
                                        required
                                        placeholder="Nhập chi tiết các đặc quyền rửa, sấy khô, lau gầm..."
                                        value={packageDesc}
                                        onChange={(e) => setPackageDesc(e.target.value)}
                                    />
                                </div>
                                <div className="mc-form-row">
                                    <div className="mc-form-group">
                                        <label>Giá cước (VND)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Ví dụ: 150000"
                                            value={packagePrice}
                                            onChange={(e) => setPackagePrice(e.target.value)}
                                        />
                                    </div>
                                    <div className="mc-form-group">
                                        <label>Thời gian rửa (phút)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Ví dụ: 30"
                                            value={packageDuration}
                                            onChange={(e) => setPackageDuration(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mc-form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={packageActive}
                                            onChange={(e) => setPackageActive(e.target.checked)}
                                        />
                                        <span>Đang kinh doanh hoạt động</span>
                                    </label>
                                </div>
                                <div className="mc-modal-footer">
                                    <button type="button" className="mc-btn mc-btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="mc-btn mc-btn--primary">Lưu</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}