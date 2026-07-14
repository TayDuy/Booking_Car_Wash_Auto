package com.autowash.backend.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request gửi câu hỏi từ khung chat trợ giúp lên Claude API.
 *
 * <p>{@code history} chứa các lượt hội thoại trước đó trong cùng phiên chat
 * (không bắt buộc) để Claude trả lời có ngữ cảnh, vì API hoàn toàn không lưu
 * trạng thái giữa các lần gọi — client phải tự gửi lại toàn bộ lịch sử mỗi lần.</p>
 */
public class SupportChatRequestDTO {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(max = 4000, message = "Câu hỏi tối đa 4000 ký tự")
    private String message;

    /** Lịch sử hội thoại trước đó trong phiên chat hiện tại (có thể null/rỗng). */
    private List<ChatTurnDTO> history;

    public SupportChatRequestDTO() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<ChatTurnDTO> getHistory() { return history; }
    public void setHistory(List<ChatTurnDTO> history) { this.history = history; }

    /** Một lượt hội thoại: role là "user" hoặc "assistant". */
    public static class ChatTurnDTO {
        private String role;
        private String content;

        public ChatTurnDTO() {}

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}