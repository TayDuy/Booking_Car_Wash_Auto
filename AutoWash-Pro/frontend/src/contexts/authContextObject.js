import { createContext } from 'react'

// Tách riêng object Context ra file này (không phải component) để file
// AuthContext.jsx chỉ export component -> tránh lỗi ESLint
// react-refresh/only-export-components (Fast Refresh chỉ hoạt động đúng
// khi 1 file chỉ export component).
export const AuthContext = createContext(null)
