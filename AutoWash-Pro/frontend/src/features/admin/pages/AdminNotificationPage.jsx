import React from "react";
import { Bell, CheckCheck, Search } from "lucide-react";
import "./AdminNotificationPage.css";

export default function AdminNotificationPage() {
  return (
    <div className="manage-page">
      <div className="manage-header">
        <div>
          <h1>Thông báo</h1>
          <p>Theo dõi các thông báo trong hệ thống.</p>
        </div>

        <button className="refresh-btn">
          <CheckCheck size={18} />
          Đánh dấu đã đọc
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input placeholder="Tìm kiếm thông báo..." />
        </div>
      </div>

      <div className="manage-card">
        <div className="empty-state">
          <Bell size={32} />
          <p>Chức năng thông báo sẽ được hoàn thiện sau.</p>
        </div>
      </div>
    </div>
  );
}