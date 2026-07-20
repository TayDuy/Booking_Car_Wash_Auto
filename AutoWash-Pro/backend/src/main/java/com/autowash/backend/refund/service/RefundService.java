// backend/src/main/java/com/autowash/backend/refund/service/RefundService.java
package com.autowash.backend.refund.service;

import com.autowash.backend.refund.dto.RefundCompleteRequestDTO;
import com.autowash.backend.refund.dto.RefundCreateRequestDTO;
import com.autowash.backend.refund.dto.RefundDecisionDTO;
import com.autowash.backend.refund.dto.RefundLookupResponseDTO;
import com.autowash.backend.refund.dto.RefundResponseDTO;
import com.autowash.backend.refund.dto.RefundCustomerCreateRequestDTO;
import com.autowash.backend.refund.dto.RefundSelfRequestDTO;
import com.autowash.backend.refund.entity.Refund.RefundStatus;

import java.util.List;

public interface RefundService {
    RefundLookupResponseDTO lookupByBookingCode(String bookingCode);
    RefundResponseDTO create(RefundCreateRequestDTO request, Integer requestingUserId);

    RefundResponseDTO createSelfRequest(RefundCustomerCreateRequestDTO request, Integer customerUserId);

    List<RefundResponseDTO> getMyCustomerRefunds(Integer customerUserId);

    RefundResponseDTO getById(Integer refundId);
    List<RefundResponseDTO> getAll(RefundStatus status);
    List<RefundResponseDTO> getMine(Integer requestingUserId);
    RefundResponseDTO markProcessing(Integer refundId, Integer adminUserId);
    RefundResponseDTO approve(Integer refundId, RefundDecisionDTO decision, Integer adminUserId);
    RefundResponseDTO reject(Integer refundId, RefundDecisionDTO decision, Integer adminUserId);

    RefundResponseDTO complete(Integer refundId, RefundCompleteRequestDTO request, Integer staffUserId);
}