package com.autowash.backend.common.exception;

import com.autowash.backend.common.dto.ApiResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Xử lý tập trung tất cả exception trong toàn bộ ứng dụng.
 *
 * <p>Thay vì để mỗi controller tự try-catch, Spring sẽ tự động
 * chuyển mọi exception chưa được xử lý đến đây, giúp response
 * lỗi nhất quán theo chuẩn {@link ApiResponse}.</p>
 *
 * <p>Thứ tự ưu tiên: Spring chọn handler khớp type cụ thể nhất,
 * {@code Exception.class} là fallback cuối cùng.</p>
 */
@Slf4j                    // Lombok tạo: private static final Logger log = LoggerFactory.getLogger(...)
@RestControllerAdvice     // Kết hợp @ControllerAdvice + @ResponseBody — áp dụng toàn bộ @RestController
public class GlobalExceptionHandler {

    /**
     * Xử lý lỗi nghiệp vụ do service ném ra (VD: không đủ điểm, reward inactive).
     *
     * <p>{@link BusinessException} cho phép service tự định nghĩa HTTP status
     * phù hợp (409 Conflict, 400 Bad Request, ...) thay vì cứng 1 status.</p>
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        // log.warn vì đây là lỗi do nghiệp vụ, không phải lỗi hệ thống
        log.warn("BusinessException: {}", ex.getMessage());
        return ResponseEntity
                .status(ex.getHttpStatus())                                        // HTTP status lấy từ exception
                .body(ApiResponse.error(ex.getHttpStatus().value(), ex.getMessage()));
    }

    /**
     * Xử lý lỗi không tìm thấy entity trong DB.
     *
     * <p>{@link EntityNotFoundException} được dùng ở nhiều service (BranchServiceImpl,
     * PromotionServiceImpl, LoyaltyTierEvaluationServiceImpl, ...) để thông báo
     * không tìm thấy entity cần xử lý. Nếu không có handler riêng, exception này
     * sẽ rơi vào catch-all → trả HTTP 500 thay vì 404 hợp lý.</p>
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFoundException(EntityNotFoundException ex) {
        log.warn("EntityNotFoundException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, ex.getMessage()));
    }

    /**
     * Xử lý lỗi không tìm thấy resource (VD: reward/customer/payment không tồn tại).
     *
     * <p>Luôn trả HTTP 404 Not Found.</p>
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("ResourceNotFoundException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, ex.getMessage()));
    }

    /**
     * Xử lý lỗi sai email/mật khẩu khi đăng nhập.
     *
     * <p>Spring Security ném {@link BadCredentialsException} khi
     * {@code AuthenticationManager.authenticate()} thất bại.
     * Trả HTTP 401 với message tiếng Việt thay vì expose message gốc.</p>
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("BadCredentialsException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                // Dùng message cố định, không expose chi tiết lý do thất bại để tránh user enumeration
                .body(ApiResponse.error(401, "Email hoặc mật khẩu không đúng"));
    }

    /**
     * Xử lý lỗi tài khoản bị vô hiệu hóa.
     *
     * <p>Spring Security ném {@link DisabledException} khi
     * {@code UserDetails.isEnabled()} trả về {@code false}.
     * Trả HTTP 403 Forbidden.</p>
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<Void>> handleDisabledException(DisabledException ex) {
        log.warn("DisabledException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "Tài khoản đã bị vô hiệu hóa"));
    }

    /**
     * Xử lý lỗi không có quyền truy cập resource.
     *
     * <p>Spring Security ném {@link AccessDeniedException} khi
     * {@code @PreAuthorize} hoặc filter phân quyền thất bại.
     * Nếu không có handler này, Spring Security tự xử lý và trả
     * response không theo chuẩn {@link ApiResponse}.</p>
     *
     * <p>Trả HTTP 403 Forbidden.</p>
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("AccessDeniedException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "Bạn không có quyền thực hiện thao tác này"));
    }

    /**
     * Xử lý lỗi validation từ {@code @Valid} trên request body/param.
     *
     * <p>Spring ném {@link MethodArgumentNotValidException} khi một hoặc nhiều
     * field trong request body vi phạm constraint (VD: {@code @NotNull}, {@code @Size}).
     * Handler này gom tất cả lỗi field vào một Map và trả HTTP 400.</p>
     *
     * <p>Response body example:
     * <pre>{@code
     * {
     *   "code": 400,
     *   "message": "Dữ liệu đầu vào không hợp lệ",
     *   "data": {
     *     "customerId": "customerId không được null",
     *     "rewardId":   "rewardId không được null"
     *   }
     * }
     * }</pre>
     * </p>
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        // Gom tất cả lỗi field → Map<tên field, message lỗi>
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("ValidationException: {}", errors);
        return ResponseEntity.badRequest().body(
                ApiResponse.error(400, "Dữ liệu đầu vào không hợp lệ", errors)
        );
    }

    /**
     * Fallback — xử lý mọi exception chưa được catch ở các handler trên.
     *
     * <p>Dùng {@code log.error()} thay vì {@code printStackTrace()} để:
     * <ul>
     *   <li>Ghi log có cấu trúc (timestamp, thread, level) theo log framework</li>
     *   <li>Có thể ship log lên hệ thống tập trung (ELK, Datadog, ...)</li>
     * </ul>
     * </p>
     *
     * <p>Không trả {@code ex.getMessage()} ra client để tránh lộ
     * thông tin nội bộ (tên class, SQL, đường dẫn file, ...).</p>
     */

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLock(
            org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
        log.warn("OptimisticLock: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, "Dữ liệu đã thay đổi, vui lòng thử lại"));
    }

    /**
     * Xử lý lỗi vi phạm ràng buộc dữ liệu (ví dụ: unique constraint, duplicate payment race).
     * Trả HTTP 409 Conflict.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolationException(
            org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("DataIntegrityViolationException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, "Dữ liệu bị trùng lặp hoặc vi phạm ràng buộc cơ sở dữ liệu"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        // log.error với stacktrace đầy đủ để debug
        log.error("Unhandled exception", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                // Message generic, không expose chi tiết lỗi hệ thống ra ngoài
                .body(ApiResponse.error(500, "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau"));
    }
}