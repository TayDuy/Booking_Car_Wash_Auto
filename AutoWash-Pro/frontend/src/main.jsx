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

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/booking"
          element={<BookingPage />}
        />
        <Route
          path="/notifications"
          element={<NotificationPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/support"
          element={<SupportPage />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);