import React, { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import auditLogApi from "../../../api/auditLogApi";
import "./AuditLogsPage.css";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);

    try {
      const response = await auditLogApi.getAll();
      const result = response.data?.data || response.data || [];

      setLogs(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Load audit logs failed:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const text = [
        log.id,
        log.action,
        log.performedBy,
        log.targetUserId,
        log.details,
        log.timestamp,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [logs, keyword]);

  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("vi-VN");
  }

  function getActionClass(action) {
    const value = String(action || "").toUpperCase();

    if (value.includes("CREATE")) return "success";
    if (value.includes("UPDATE")) return "warning";
    if (value.includes("DELETE") || value.includes("CANCEL")) return "danger";
    if (value.includes("CONFIRM") || value.includes("COMPLETE")) return "info";

    return "default";
  }

  return (
    <div className="audit-page">
      <div className="manage-header">
        <div>
          <h1>Nhật ký hệ thống</h1>
          <p>Theo dõi các thao tác quản trị đã xảy ra trong hệ thống.</p>
        </div>

        <button className="refresh-btn" onClick={loadLogs}>
          <RefreshCcw size={18} />
          Làm mới
        </button>
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input
            placeholder="Tìm theo hành động, người thực hiện, chi tiết..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="manage-card">
        {loading && <div className="empty-state">Đang tải nhật ký hệ thống...</div>}
        {!loading && filteredLogs.length === 0 && <div className="empty-state">Chưa có nhật ký phù hợp.</div>}
        {!loading && filteredLogs.length > 0 && (
          <div className="booking-table-wrap">
            <table className="booking-table audit-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                  <th>Người thực hiện</th>
                  <th>Target User</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={log.id || index}>
                    <td>{index + 1}</td>
                    <td>{formatDate(log.timestamp)}</td>
                    <td>
                      <span className={`audit-badge ${getActionClass(log.action)}`}>
                        {log.action || "N/A"}
                      </span>
                    </td>
                    <td>{log.performedBy || "N/A"}</td>
                    <td>{log.targetUserId || "-"}</td>
                    <td>{log.details || "Không có chi tiết"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}