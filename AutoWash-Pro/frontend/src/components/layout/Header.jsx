import React from "react";
import useAuth from "../../hooks/useAuth";
import { Bell, Moon, Search, Menu, ChevronDown } from "lucide-react";
import "./Header.css";

export default function Header() {
  const auth = useAuth();

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="icon-btn">
          <Menu size={20} />
        </button>

        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Tìm kiếm nhanh..." />
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn notification-btn">
          <Bell size={19} />
          <span className="notification-dot">3</span>
        </button>

        <button className="icon-btn">
          <Moon size={19} />
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">
            {auth?.user?.name?.charAt(0) || "A"}
          </div>

          <div>
            <strong>{auth?.user?.name || "Admin"}</strong>
            <p>{auth?.user?.role || "Super Administrator"}</p>
          </div>

          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}