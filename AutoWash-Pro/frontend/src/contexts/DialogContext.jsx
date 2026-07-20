import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import "./DialogContext.css";

const DialogContext = createContext(null);

function getDialogIcon(variant) {
  switch (variant) {
    case "success":
      return <CheckCircle2 size={28} />;

    case "danger":
    case "error":
      return <XCircle size={28} />;

    case "warning":
      return <AlertTriangle size={28} />;

    default:
      return <Info size={28} />;
  }
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  function resolveDialog(result) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }

  function openDialog(config) {
    if (resolverRef.current) {
      resolverRef.current(false);
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog(config);
    });
  }

  function confirmAction({
    title = "Xác nhận thao tác",
    message = "",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "primary",
  } = {}) {
    return openDialog({
      type: "confirm",
      title,
      message,
      confirmText,
      cancelText,
      variant,
    });
  }

  function showMessage({
    title = "Thông báo",
    message = "",
    buttonText = "Đóng",
    variant = "info",
  } = {}) {
    return openDialog({
      type: "message",
      title,
      message,
      buttonText,
      variant,
    });
  }

  useEffect(() => {
    if (!dialog) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        resolveDialog(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [dialog]);

  return (
    <DialogContext.Provider
      value={{
        confirmAction,
        showMessage,
      }}
    >
      {children}

      {dialog && (
        <div
          className="app-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              resolveDialog(false);
            }
          }}
        >
          <div
            className={`app-dialog app-dialog-${dialog.variant}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
          >
            <button
              type="button"
              className="app-dialog-close"
              aria-label="Đóng hộp thoại"
              onClick={() => resolveDialog(false)}
            >
              <X size={20} />
            </button>

            <div
              className={`app-dialog-icon app-dialog-icon-${dialog.variant}`}
            >
              {getDialogIcon(dialog.variant)}
            </div>

            <div className="app-dialog-content">
              <h2 id="app-dialog-title">
                {dialog.title}
              </h2>

              <p>{dialog.message}</p>
            </div>

            <div className="app-dialog-actions">
              {dialog.type === "confirm" && (
                <button
                  type="button"
                  className="app-dialog-secondary"
                  onClick={() => resolveDialog(false)}
                >
                  {dialog.cancelText}
                </button>
              )}

              <button
                type="button"
                className={`app-dialog-primary app-dialog-primary-${dialog.variant}`}
                onClick={() => resolveDialog(true)}
              >
                {dialog.type === "confirm"
                  ? dialog.confirmText
                  : dialog.buttonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error(
      "useAppDialog phải được sử dụng bên trong DialogProvider."
    );
  }

  return context;
}