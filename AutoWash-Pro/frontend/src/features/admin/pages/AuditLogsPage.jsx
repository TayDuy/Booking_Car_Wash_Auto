import React, { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import auditLogApi from "../../../api/auditLogApi";
import "./AuditLogsPage.css";

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const items = [1];
  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(
    totalPages - 1,
    currentPage + 1
  );

  if (startPage > 2) {
    items.push("ellipsis-start");
  }

  for (
    let page = startPage;
    page <= endPage;
    page += 1
  ) {
    items.push(page);
  }

  if (endPage < totalPages - 1) {
    items.push("ellipsis-end");
  }

  items.push(totalPages);

  return items;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  async function handleRefreshLogs() {
    setCurrentPage(1);
    await loadLogs();
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

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedLogs = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    return filteredLogs.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [filteredLogs, currentPage, pageSize]);

  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const firstVisibleItem =
    filteredLogs.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastVisibleItem = Math.min(
    currentPage * pageSize,
    filteredLogs.length
  );

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

        <button
          type="button"
          className="refresh-btn"
          onClick={handleRefreshLogs}
          disabled={loading}
        >
          <RefreshCcw
            size={18}
            className={loading ? "audit-refresh-spinning" : ""}
          />

          {loading ? "Đang tải..." : "Làm mới"}
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
        {loading ? (
          <div className="empty-state">Đang tải nhật ký hệ thống...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">Chưa có nhật ký phù hợp.</div>
        ) : (
          <>
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
                  {paginatedLogs.map((log, index) => (
                    <tr key={log.id || index}>
                      <td>
                        {(currentPage - 1) * pageSize +
                          index +
                          1}
                      </td>
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
            <div className="audit-pagination">
              <div className="audit-pagination-summary">
                Hiển thị{" "}
                <strong>
                  {firstVisibleItem}–{lastVisibleItem}
                </strong>{" "}
                trong tổng số{" "}
                <strong>{filteredLogs.length}</strong>{" "}
                nhật ký
              </div>

              <div className="audit-pagination-controls">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.max(previousPage - 1, 1)
                    )
                  }
                >
                  Trước
                </button>

                {paginationItems.map((item) =>
                  typeof item === "number" ? (
                    <button
                      type="button"
                      key={item}
                      className={
                        item === currentPage ? "active" : ""
                      }
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      className="audit-pagination-ellipsis"
                      key={item}
                    >
                      …
                    </span>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.min(previousPage + 1, totalPages)
                    )
                  }
                >
                  Sau
                </button>
              </div>

              <label className="audit-page-size-control">
                <span>Mỗi trang</span>

                <select
                  value={pageSize}
                  onChange={(event) =>
                    setPageSize(Number(event.target.value))
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}