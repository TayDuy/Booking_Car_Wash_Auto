import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  CreditCard,
  ExternalLink,
  Info,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  getAll,
  markAsRead,
  markAllRead,
  subscribeSSE,
} from "../../../api/notificationService";

import "./AdminNotificationPage.css";

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeNotification(notification) {
  const rawRead =
    notification.isRead ??
    notification.read ??
    notification.readStatus ??
    notification.status;

  const isRead =
    typeof rawRead === "boolean"
      ? rawRead
      : ["read", "true", "1"].includes(
        normalizeValue(rawRead)
      );

  return {
    ...notification,

    id:
      notification.notificationId ??
      notification.id,

    title:
      notification.title ||
      notification.subject ||
      "Thông báo hệ thống",

    message:
      notification.message ||
      notification.content ||
      notification.body ||
      notification.description ||
      "Không có nội dung.",

    type:
      notification.type ||
      notification.notificationType ||
      notification.category ||
      "system",

    isRead,

    createdAt:
      notification.createdAt ||
      notification.sentAt ||
      notification.timestamp ||
      notification.updatedAt,

    actionUrl:
      notification.actionUrl ||
      notification.redirectUrl ||
      notification.link ||
      notification.url ||
      null,
  };
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatNotificationTime(value) {
  const date = parseDate(value);

  if (!date) return "Không rõ thời gian";

  const now = new Date();
  const difference = now.getTime() - date.getTime();
  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) {
    return "Vừa xong";
  }

  if (minutes < 60) {
    return `${minutes} phút trước`;
  }

  if (hours < 24) {
    return `${hours} giờ trước`;
  }

  if (days < 7) {
    return `${days} ngày trước`;
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getNotificationStyle(type) {
  const normalizedType = normalizeValue(type);

  if (
    normalizedType.includes("booking") ||
    normalizedType.includes("appointment")
  ) {
    return {
      className: "booking",
      Icon: CalendarCheck,
    };
  }

  if (
    normalizedType.includes("payment") ||
    normalizedType.includes("transaction")
  ) {
    return {
      className: "payment",
      Icon: CreditCard,
    };
  }

  if (
    normalizedType.includes("warning") ||
    normalizedType.includes("alert") ||
    normalizedType.includes("error")
  ) {
    return {
      className: "warning",
      Icon: AlertTriangle,
    };
  }

  return {
    className: "system",
    Icon: Info,
  };
}

export default function AdminNotificationPage() {
  const { showMessage } = useAppDialog();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();

    const subscription = subscribeSSE(
      (newNotification) => {
        const normalized =
          normalizeNotification(newNotification);

        setNotifications((previousNotifications) => {
          const existingIndex =
            previousNotifications.findIndex(
              (item) => item.id === normalized.id
            );

          if (existingIndex >= 0) {
            const nextNotifications = [
              ...previousNotifications,
            ];

            nextNotifications[existingIndex] = {
              ...nextNotifications[existingIndex],
              ...normalized,
            };

            return nextNotifications;
          }

          return [
            normalized,
            ...previousNotifications,
          ];
        });

        window.dispatchEvent(
          new CustomEvent(
            "admin-notification-count-changed"
          )
        );
      }
    );

    return () => {
      subscription?.close?.();
    };
  }, []);

  async function loadNotifications() {
    setLoading(true);

    try {
      const result = await getAll();

      const notificationList = Array.isArray(result)
        ? result
        : [];

      const normalizedList = notificationList
        .map(normalizeNotification)
        .sort((first, second) => {
          const firstTime =
            parseDate(first.createdAt)?.getTime() || 0;

          const secondTime =
            parseDate(second.createdAt)?.getTime() || 0;

          return secondTime - firstTime;
        });

      setNotifications(normalizedList);
    } catch (error) {
      console.error(
        "Load notifications failed:",
        error
      );

      setNotifications([]);

      await showMessage({
        title: "Tải thông báo thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được danh sách thông báo.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const normalizedKeyword =
      normalizeValue(keyword);

    return notifications.filter((notification) => {
      const matchesSearch =
        !normalizedKeyword ||
        [
          notification.title,
          notification.message,
          notification.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword);

      const matchesFilter =
        filter === "all" ||
        (filter === "unread" &&
          !notification.isRead) ||
        (filter === "read" &&
          notification.isRead);

      return matchesSearch && matchesFilter;
    });
  }, [notifications, keyword, filter]);

  async function handleMarkAsRead(notification) {
    if (
      notification.isRead ||
      !notification.id
    ) {
      return;
    }

    try {
      await markAsRead(notification.id);

      setNotifications((previousNotifications) =>
        previousNotifications.map((item) =>
          item.id === notification.id
            ? {
              ...item,
              isRead: true,
            }
            : item
        )
      );

      window.dispatchEvent(
        new CustomEvent(
          "admin-notification-count-changed"
        )
      );
    } catch (error) {
      console.error(
        "Mark notification as read failed:",
        error
      );

      await showMessage({
        title: "Cập nhật thông báo thất bại",
        message:
          error.response?.data?.message ||
          "Không thể đánh dấu thông báo đã đọc.",
        variant: "error",
      });
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) {
      return;
    }

    setMarkingAll(true);

    try {
      await markAllRead();

      setNotifications((previousNotifications) =>
        previousNotifications.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      window.dispatchEvent(
        new CustomEvent(
          "admin-notification-count-changed"
        )
      );
    } catch (error) {
      console.error(
        "Mark all notifications as read failed:",
        error
      );

      await showMessage({
        title: "Cập nhật thông báo thất bại",
        message:
          error.response?.data?.message ||
          "Không thể đánh dấu tất cả đã đọc.",
        variant: "error",
      });
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleOpenNotification(
    notification
  ) {
    await handleMarkAsRead(notification);

    if (notification.actionUrl) {
      if (
        notification.actionUrl.startsWith("/")
      ) {
        navigate(notification.actionUrl);
      } else {
        window.open(
          notification.actionUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }
    }
  }

  return (
    <div className="admin-notification-page">
      <div className="notification-page-header">
        <div>
          <h1>Thông báo</h1>

          <p>
            Theo dõi các cập nhật và sự kiện trong
            hệ thống.
          </p>
        </div>

        <div className="notification-header-actions">
          <button
            type="button"
            className="notification-refresh-btn"
            onClick={loadNotifications}
            disabled={loading}
          >
            <RefreshCw
              size={18}
              className={
                loading ? "notification-spinning" : ""
              }
            />

            Làm mới
          </button>

          <button
            type="button"
            className="notification-read-all-btn"
            onClick={handleMarkAllRead}
            disabled={
              markingAll || unreadCount === 0
            }
          >
            <CheckCheck size={18} />

            {markingAll
              ? "Đang xử lý..."
              : `Đánh dấu đã đọc${unreadCount > 0
                ? ` (${unreadCount})`
                : ""
              }`}
          </button>
        </div>
      </div>

      <div className="notification-toolbar">
        <div className="notification-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
          />
        </div>

        <div className="notification-tabs">
          <button
            type="button"
            className={
              filter === "all" ? "active" : ""
            }
            onClick={() => setFilter("all")}
          >
            Tất cả
            <span>{notifications.length}</span>
          </button>

          <button
            type="button"
            className={
              filter === "unread" ? "active" : ""
            }
            onClick={() => setFilter("unread")}
          >
            Chưa đọc
            <span>{unreadCount}</span>
          </button>

          <button
            type="button"
            className={
              filter === "read" ? "active" : ""
            }
            onClick={() => setFilter("read")}
          >
            Đã đọc
            <span>
              {notifications.length - unreadCount}
            </span>
          </button>
        </div>
      </div>

      <div className="notification-card">
        {loading ? (
          <div className="notification-empty-state">
            <Bell size={48} />
            <p>Đang tải danh sách thông báo...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notification-empty-state">
            <Bell size={48} />

            <h3>Không có thông báo</h3>

            <p>
              Không tìm thấy thông báo phù hợp với
              bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="notification-list">
            {filteredNotifications.map(
              (notification, index) => {
                const style =
                  getNotificationStyle(
                    notification.type
                  );

                const Icon = style.Icon;

                return (
                  <article
                    key={
                      notification.id ||
                      `${notification.createdAt}-${index}`
                    }
                    className={`notification-item ${notification.isRead
                      ? "read"
                      : "unread"
                      }`}
                    onClick={() =>
                      handleOpenNotification(
                        notification
                      )
                    }
                  >
                    <div
                      className={`notification-type-icon ${style.className}`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="notification-content">
                      <div className="notification-title-row">
                        <h3>
                          {notification.title}
                        </h3>

                        {!notification.isRead && (
                          <span className="notification-unread-dot" />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <div className="notification-meta">
                        <span>
                          {formatNotificationTime(
                            notification.createdAt
                          )}
                        </span>

                        {notification.type && (
                          <span className="notification-type-label">
                            {notification.type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="notification-actions">
                      {!notification.isRead && (
                        <button
                          type="button"
                          title="Đánh dấu đã đọc"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleMarkAsRead(
                              notification
                            );
                          }}
                        >
                          <Check size={18} />
                        </button>
                      )}

                      {notification.actionUrl && (
                        <ExternalLink size={17} />
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}