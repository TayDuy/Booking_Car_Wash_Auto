package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.service.SseTicketService;
import com.autowash.backend.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseTicketServiceImpl implements SseTicketService {

    private static final long TICKET_TTL_MS = 60L * 1000; // 60 seconds

    private final Map<String, TicketInfo> ticketMap = new ConcurrentHashMap<>();

    private static class TicketInfo {
        private final Integer userId;
        private final long expiryTime;

        public TicketInfo(Integer userId, long expiryTime) {
            this.userId = userId;
            this.expiryTime = expiryTime;
        }
    }

    @Override
    public String createTicket(Integer userId) {
        String ticket = UUID.randomUUID().toString();
        long expiry = System.currentTimeMillis() + TICKET_TTL_MS;
        ticketMap.put(ticket, new TicketInfo(userId, expiry));
        return ticket;
    }

    @Override
    public Integer consume(String ticket) {
        if (ticket == null || ticket.trim().isEmpty()) {
            throw new BusinessException("Mã vé kết nối không hợp lệ", HttpStatus.UNAUTHORIZED);
        }

        TicketInfo info = ticketMap.remove(ticket.trim());
        if (info == null) {
            throw new BusinessException("Vé kết nối không tồn tại hoặc đã được sử dụng", HttpStatus.UNAUTHORIZED);
        }

        if (System.currentTimeMillis() > info.expiryTime) {
            throw new BusinessException("Vé kết nối đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        return info.userId;
    }
}
