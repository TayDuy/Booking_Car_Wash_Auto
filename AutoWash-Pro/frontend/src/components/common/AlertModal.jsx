import React from "react";
import "./AlertModal.css";
import {
  FaCircleExclamation,
  FaCircleXmark,
  FaCircleCheck,
  FaCircleInfo
} from "react-icons/fa6";

/**
 * Reusable Alert Popup Modal component replacing native browser alert()
 *
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message: string
 *  - type: 'warning' | 'error' | 'info' | 'success'
 *  - onClose: () => void
 */
export default function AlertModal({ open, title, message, type = "warning", onClose }) {
  if (!open) return null;

  const renderIcon = () => {
    switch (type) {
      case "error":
        return <FaCircleXmark className="alert-modal-icon error" />;
      case "success":
        return <FaCircleCheck className="alert-modal-icon success" />;
      case "info":
        return <FaCircleInfo className="alert-modal-icon info" />;
      case "warning":
      default:
        return <FaCircleExclamation className="alert-modal-icon warning" />;
    }
  };

  const defaultTitle = () => {
    switch (type) {
      case "error":
        return "Có lỗi xảy ra";
      case "success":
        return "Thành công";
      case "info":
        return "Thông báo";
      case "warning":
      default:
        return "Chú ý";
    }
  };

  return (
    <div className="alert-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={`alert-modal-container ${type}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`alert-modal-icon-wrapper ${type}`}>
          {renderIcon()}
        </div>

        <h3 className="alert-modal-title">{title || defaultTitle()}</h3>
        <p className="alert-modal-message">{message}</p>

        <div className="alert-modal-actions">
          <button
            type="button"
            className={`alert-modal-btn ${type}`}
            onClick={onClose}
            autoFocus
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
