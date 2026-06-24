import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import App from "./App";
import Register from "./pages/auth/Register";
import BookingPage from "./pages/auth/Booking";
import NotificationPage from "./pages/auth/NotificationPage";
import ProfilePage from "./pages/auth/ProfilePage";
import SupportPage from "./pages/auth/SupportPage";
import HomePage from "./pages/auth/HomePage";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Đổi đường dẫn gốc sang hiển thị HomePage */}
        <Route path="/" element={<HomePage />} />
        
        {/* Tạo thêm một đường dẫn riêng cho trang Login (Component App) */}
        <Route path="/login" element={<App />} /> 

        <Route path="/home" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);