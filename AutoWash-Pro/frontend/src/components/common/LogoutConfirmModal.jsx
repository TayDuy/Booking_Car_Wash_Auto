import "./LogoutConfirmModal.css";

/**
 * Modal xác nhận đăng xuất dùng chung cho admin / employee (staff) / customer.
 *
 * Props:
 *  - open: boolean — có hiển thị modal hay không
 *  - onCancel: () => void — bấm "Hủy" hoặc click ra ngoài overlay
 *  - onConfirm: () => void — bấm "Đăng xuất" để xác nhận
 */
export default function LogoutConfirmModal({ open, onCancel, onConfirm }) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="logout-confirm-overlay"
            role="presentation"
            onClick={onCancel}
        >
            <div
                className="logout-confirm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-confirm-title"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 id="logout-confirm-title">Xác nhận đăng xuất</h3>
                <p>Bạn có chắc chắn muốn đăng xuất?</p>

                <div className="logout-confirm-actions">
                    <button
                        type="button"
                        className="logout-confirm-btn secondary"
                        onClick={onCancel}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="logout-confirm-btn danger"
                        onClick={onConfirm}
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}