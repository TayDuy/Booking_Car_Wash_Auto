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
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import BookingPage from "./pages/auth/Booking";
import NotificationPage from "./pages/auth/NotificationPage";
import ProfilePage from "./pages/auth/ProfilePage";
import SubscriptionPage from "./subscriptionpage/SubscriptionPage";
import SupportPage from "./pages/auth/SupportPage";
import HelpCenter from "./pages/helpcenter/Helpcenter";
import CustomerNotificationPage from "./pages/customer/CustomerNotificationPage";
import AdminNotificationPage from "./pages/admin/AdminNotificationPage";
import BookingHistory from "./pages/auth/BookingHistory";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<App />} />

          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />

          <Route path="/booking"       element={<BookingPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/bookings"      element={<BookingHistory />} />
          <Route path="/support"       element={<HelpCenter />} />
          <Route path="/support-old"   element={<SupportPage />} />
          
          <Route path="/customer/notifications" element={<CustomerNotificationPage />} />
          <Route path="/admin/notifications"    element={<AdminNotificationPage />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
);