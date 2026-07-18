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
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.util.HashMap;
import java.util.Map;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

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

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {
        log.warn("HttpMessageNotReadable: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "Dữ liệu đầu vào không hợp lệ hoặc thiếu body"));
    }

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
        Throwable root = org.springframework.core.NestedExceptionUtils.getMostSpecificCause(ex);
        log.warn("DataIntegrityViolationException: {} | rootCause: {}", ex.getMessage(), root.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, "Dữ liệu bị trùng lặp hoặc vi phạm ràng buộc cơ sở dữ liệu"));
    }

    /**
     * FIX: Nhiều service (VD: TimeSlotServiceImpl.create()/update()) ném
     * IllegalArgumentException cho lỗi validate nghiệp vụ — ví dụ
     * "Bay này đã có slot tại khung giờ đó", "Bay không thuộc chi nhánh này",
     * "Giờ kết thúc phải sau giờ bắt đầu". Trước đây KHÔNG có handler riêng
     * cho loại exception này nên nó rơi xuống handleGenericException(),
     * bị log ở mức ERROR kèm full stacktrace (~150 dòng) và trả HTTP 500,
     * dù bản chất đây là lỗi CLIENT gửi request không hợp lệ — đáng lẽ
     * phải là 400 Bad Request và chỉ cần log WARN 1 dòng.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("IllegalArgumentException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, ex.getMessage()));
    }

    /**
     * FIX: TimeSlotServiceImpl.delete() ném IllegalStateException khi slot
     * đã có booking không thể xóa (VD: "Không thể xóa slot đã có 3 booking").
     * Đây là lỗi xung đột trạng thái — request hợp lệ về cú pháp nhưng
     * conflict với trạng thái hiện tại của resource — nên trả 409 Conflict,
     * không phải 500. Cùng nguyên nhân thiếu handler như IllegalArgumentException.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalStateException(IllegalStateException ex) {
        log.warn("IllegalStateException: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, ex.getMessage()));
    }

    /**
     * Xử lý lỗi vi phạm bean validation ở tầng ENTITY khi save()/persist()
     * (khác với MethodArgumentNotValidException — lỗi ở tầng DTO/@Valid
     * trước khi vào service). Xảy ra khi entity có field @NotNull/@Min/@Max
     * bị vi phạm mà không được chặn từ DTO validation — ví dụ mapper tạo
     * entity qua constructor no-args + setter (MapStruct) khiến field có
     * @Builder.Default (status, currentBookings...) bị null vì Lombok chỉ
     * áp dụng default value khi khởi tạo qua builder().build().
     * Không có handler này thì lỗi cũng rơi vào 500 generic và message gốc
     * (rất hữu ích để biết chính xác field nào vi phạm) bị che mất.
     */
    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolationException(
            jakarta.validation.ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation ->
                errors.put(violation.getPropertyPath().toString(), violation.getMessage()));

        log.warn("ConstraintViolationException: {}", errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, "Dữ liệu không hợp lệ", errors));
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
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex
    ) {
        String message;

        Class<?> requiredType = ex.getRequiredType();

        if (requiredType != null && requiredType.isEnum()) {
            String allowedValues = Arrays.stream(requiredType.getEnumConstants())
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));

            message = "Giá trị '" + ex.getValue()
                    + "' không hợp lệ cho tham số '" + ex.getName()
                    + "'. Giá trị hợp lệ: " + allowedValues;
        } else {
            message = "Giá trị '" + ex.getValue()
                    + "' không hợp lệ cho tham số '" + ex.getName() + "'";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        response.put("status", HttpStatus.BAD_REQUEST.value());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
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