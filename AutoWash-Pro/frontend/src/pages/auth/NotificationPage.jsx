import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../../api/authService";
import AdminNotificationPage from "../admin/AdminNotificationPage.jsx";
import CustomerNotificationPage from "../customer/CustomerNotificationPage";

export default function NotificationPage() {
    const navigate = useNavigate();
    const [role, setRole] = useState(null);

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate("/login");
            return;
        }
        const storedRole = (localStorage.getItem("role") || "").toLowerCase();
        setRole(storedRole);
    }, []);

    if (role === null) return null;

    if (role === "admin" || role === "staff") {
        return <AdminNotificationPage />;
    }

    return <CustomerNotificationPage />;
}