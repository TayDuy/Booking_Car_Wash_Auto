import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import { askSupportChat } from "../api/supportChatService";
import { useAppDialog } from "../contexts/DialogContext";
import "./Supportchatwidget.css";

export default function SupportChatWidget({ open, onClose, initialMessage }) {
    const navigate = useNavigate();
    const { showConfirm } = useAppDialog();
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Xin chào! Mình là trợ lý ảo của WashFlow Pro. Bạn cần hỗ trợ gì hôm nay?" },
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const sentInitialRef = useRef(null);

    // Tự cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    // Nếu có câu hỏi gửi sẵn từ ô tìm kiếm (initialMessage), tự gửi ngay khi mở
    useEffect(() => {
        if (open && initialMessage && sentInitialRef.current !== initialMessage) {
            sentInitialRef.current = initialMessage;
            sendMessage(initialMessage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialMessage]);

    async function sendMessage(text) {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        if (!token) {
            if (onClose) onClose();
            const confirmed = await showConfirm({
                title: "Yêu cầu đăng nhập",
                message: "Bạn cần đăng nhập để trò chuyện và nhận tư vấn từ Trợ lý AI WashFlow Pro. Bạn có muốn chuyển tới trang Đăng nhập ngay không?",
                confirmText: "Đăng nhập ngay",
                cancelText: "Để sau",
                variant: "warning",
            });
            if (confirmed) {
                navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            }
            return;
        }

        const content = (text ?? input).trim();
        if (!content || sending) return;

        const userTurn = { role: "user", content };
        const nextMessages = [...messages, userTurn];
        setMessages(nextMessages);
        setInput("");
        setError(null);
        setSending(true);

        try {
            // Gửi kèm lịch sử hội thoại (trừ câu chào mở đầu) để AI có ngữ cảnh
            const history = nextMessages
                .slice(1, -1)
                .map(m => ({ role: m.role, content: m.content }));

            const reply = await askSupportChat(content, history);
            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
        } catch (err) {
            console.error("Lỗi gửi câu hỏi tới trợ lý AI:", err);
            setError("Không thể nhận câu trả lời ngay lúc này. Vui lòng thử lại hoặc liên hệ support@washflowpro.vn.");
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    if (!open) return null;

    return (
        <div className="scw-overlay" onClick={onClose}>
            <div className="scw-panel" onClick={(e) => e.stopPropagation()}>
                <div className="scw-header">
                    <div className="scw-header__title">
                        <Bot size={18} />
                        <span>Trợ lý AI WashFlow Pro</span>
                    </div>
                    <button className="scw-close-btn" onClick={onClose} aria-label="Đóng">
                        <X size={18} />
                    </button>
                </div>

                <div className="scw-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`scw-msg scw-msg--${m.role}`}>
              <span className="scw-msg__avatar">
                {m.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
              </span>
                            <p className="scw-msg__bubble">{m.content}</p>
                        </div>
                    ))}

                    {sending && (
                        <div className="scw-msg scw-msg--assistant">
                            <span className="scw-msg__avatar"><Bot size={14} /></span>
                            <p className="scw-msg__bubble scw-msg__bubble--loading">
                                <Loader2 size={14} className="scw-spin" /> Đang trả lời…
                            </p>
                        </div>
                    )}

                    {error && <div className="scw-error">{error}</div>}

                    <div ref={bottomRef} />
                </div>

                <div className="scw-input-row">
                    <input
                        className="scw-input"
                        type="text"
                        placeholder="Nhập câu hỏi của bạn..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                    />
                    <button
                        className="scw-send-btn"
                        onClick={() => sendMessage()}
                        disabled={sending || !input.trim()}
                        aria-label="Gửi"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}