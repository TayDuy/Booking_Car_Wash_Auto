package com.autowash.backend.support.dto;

/**
 * Response trả về cho frontend sau khi Claude trả lời câu hỏi trợ giúp.
 */
public class SupportChatResponseDTO {

    private String reply;

    public SupportChatResponseDTO() {}

    public SupportChatResponseDTO(String reply) {
        this.reply = reply;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
}