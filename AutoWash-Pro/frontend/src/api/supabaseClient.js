import { createClient } from '@supabase/supabase-js';

// TODO: Điền URL và Anon Key của bạn vào đây nhé!
const supabaseUrl = 'https://dqkwefcxezdgddobgffv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxa3dlZmN4ZXpkZ2Rkb2JnZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzM1MTUsImV4cCI6MjA5NjQwOTUxNX0.rmJJzJ9GysBrFfvQ-pNtZKaajSC-pjtWR6b7HYGsm90';

// ============================================================
// 🔧 FIX: Bug deadlock của navigator.locks trong @supabase/auth-js
// ============================================================
// Supabase mặc định dùng Web Locks API (navigator.locks) để đảm bảo
// chỉ 1 auth operation (signIn, getSession, refreshToken...) chạy tại
// 1 thời điểm. Lock này có tên "lock:sb-<project-ref>-auth-token".
//
// VẤN ĐỀ: navigator.locks scope theo BROWSER PROFILE, KHÔNG phải theo
// từng tab. Nếu 1 lần gọi trước đó bị bỏ dở (React StrictMode mount/
// unmount 2 lần, tab bị đóng giữa chừng, request bị abort...) mà
// không release lock đúng cách, lock đó bị KẸT VĨNH VIỄN. Từ đó, MỌI
// tab khác cùng origin (kể cả tab mới mở) gọi bất kỳ hàm auth nào
// (signInWithOAuth, getSession, onAuthStateChange...) đều bị treo vô
// thời hạn vì phải xếp hàng chờ lock không bao giờ được giải phóng.
//
// Đây chính là lý do đăng nhập Google bị treo ở tab thường nhưng chạy
// bình thường ở tab ẩn danh: tab ẩn danh dùng storage partition/
// browser profile riêng biệt, không hề dính lock cũ bị kẹt.
//
// GIẢI PHÁP: thay navigator.locks bằng 1 lock nội bộ (in-memory,
// dạng hàng đợi Promise) — vẫn đảm bảo các auth call trong CÙNG TAB
// chạy tuần tự (tránh race condition), nhưng không còn phụ thuộc vào
// navigator.locks của trình duyệt nên KHÔNG THỂ bị kẹt cross-tab nữa.
let lockQueue = Promise.resolve();

const memoryLock = async (_name, _acquireTimeout, fn) => {
    const previous = lockQueue;
    let release;

    lockQueue = new Promise((resolve) => {
        release = resolve;
    });

    try {
        // Chờ operation trước đó (nếu có) hoàn tất trước khi chạy operation này
        await previous;
        return await fn();
    } finally {
        // Luôn giải phóng "lock" cho operation kế tiếp, kể cả khi fn() throw lỗi
        release();
    }
};
// ============================================================
// 🔧 KẾT THÚC PHẦN FIX
// ============================================================

// 🔧 FIX: Tắt detectSessionInUrl vì LoginPage.jsx tự xử lý callback thủ công
// (exchangeCodeForSession / setSession). Để true sẽ khiến supabase-js tự
// parse VÀ XÓA hash khỏi URL ngay khi client khởi tạo, đua (race) với
// useEffect trong LoginPage.jsx đọc window.location.hash - dẫn tới
// LoginPage đọc hash rỗng, im lặng return, không gọi backend /auth/google,
// trang "treo" ở màn hình login mà không có lỗi hay log gì cả.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: memoryLock,
    },
});