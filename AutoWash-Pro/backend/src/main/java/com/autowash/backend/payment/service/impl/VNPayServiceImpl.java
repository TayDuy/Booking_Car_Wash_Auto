package com.autowash.backend.payment.service.impl;

import com.autowash.backend.payment.config.VNPayConfig;
import com.autowash.backend.payment.service.VNPayService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Iterator;
import java.util.Map;
import java.util.TimeZone;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class VNPayServiceImpl implements VNPayService {

    private final VNPayConfig vnPayConfig;

    @Override
    public String createPaymentUrl(HttpServletRequest request, long amount, String orderInfo, String txnRef)
            throws UnsupportedEncodingException {

        long vnp_Amount = amount * 100; // VNPAY yêu cầu nhân 100
        String vnp_IpAddr = getIpAddress(request);
        String cleanOrderInfo = orderInfo != null ? orderInfo.replaceAll("[^a-zA-Z0-9 _-]", "").trim() : "Thanh toan";

        Map<String, String> vnp_Params = new TreeMap<>();
        vnp_Params.put("vnp_Version", VNPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", VNPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(vnp_Amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", txnRef);
        vnp_Params.put("vnp_OrderInfo", cleanOrderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", resolveReturnUrl(request));
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        TimeZone vietnamTz = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(vietnamTz);
        Calendar cld = Calendar.getInstance(vietnamTz);
        vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));
        cld.add(Calendar.MINUTE, 15);
        vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = vnp_Params.keySet().iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                hashData.append(fieldName).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8.toString())).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String vnp_SecureHash = hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);

        return vnPayConfig.getVnp_PayUrl() + "?" + query;
    }

    @Override
    public byte[] generateQRCode(String text, int width, int height) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        java.util.Map<com.google.zxing.EncodeHintType, Object> hints = new java.util.HashMap<>();
        hints.put(com.google.zxing.EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(com.google.zxing.EncodeHintType.ERROR_CORRECTION, com.google.zxing.qrcode.decoder.ErrorCorrectionLevel.M);
        hints.put(com.google.zxing.EncodeHintType.MARGIN, 2); // Bắt buộc thêm lề trắng (Quiet Zone) để camera scanner đọc được góc định vị QR

        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height, hints);
        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        return pngOutputStream.toByteArray();
    }

    @Override
    public boolean validateSignature(Map<String, String> fields, String receivedHash)
            throws UnsupportedEncodingException {

        Map<String, String> sortedFields = new TreeMap<>(fields);
        sortedFields.remove("vnp_SecureHashType");
        sortedFields.remove("vnp_SecureHash");

        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = sortedFields.keySet().iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = sortedFields.get(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                hashData.append(fieldName).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        String calculatedHash = hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());
        return calculatedHash.equalsIgnoreCase(receivedHash);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : result) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new RuntimeException("Lỗi tạo chữ ký HMAC-SHA512", ex);
        }
    }

    private String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        if (ip == null || ip.isEmpty() || "0:0:0:0:0:0:0:1".equals(ip) || ip.contains(":")) {
            ip = "127.0.0.1";
        }
        return ip;
    }

    private String resolveReturnUrl(HttpServletRequest request) {
        String configuredUrl = vnPayConfig.getVnp_ReturnUrl();
        String productionHost = extractHostFromUrl(configuredUrl);
        if (productionHost != null && !isLocalhost(productionHost)) {
            return configuredUrl;
        }

        String proto = request.getHeader("X-Forwarded-Proto") != null ? request.getHeader("X-Forwarded-Proto") : request.getScheme();
        String hostHeader = request.getHeader("X-Forwarded-Host") != null ? request.getHeader("X-Forwarded-Host") : request.getHeader("Host");

        if (hostHeader != null && !hostHeader.isBlank()) {
            String hostOnly = extractHost(hostHeader);
            if (hostOnly != null && !isLocalhost(hostOnly)) {
                return proto + "://" + hostHeader + "/api/v1/payments/vnpay-return";
            }
        }

        return configuredUrl;
    }

    private String extractHost(String hostHeader) {
        if (hostHeader == null) return null;
        String trimmed = hostHeader.trim().toLowerCase();
        int colonIdx = trimmed.lastIndexOf(':');
        if (colonIdx > 0) {
            trimmed = trimmed.substring(0, colonIdx);
        }
        return trimmed;
    }

    private String extractHostFromUrl(String url) {
        if (url == null) return null;
        try {
            return java.net.URI.create(url).getHost();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isLocalhost(String host) {
        return "localhost".equals(host) || "127.0.0.1".equals(host) || "::1".equals(host);
    }

    private boolean isTrustedDevHost(String host) {
        if (host == null) return false;
        if (isLocalhost(host)) return true;
        if (host.equals("booking-car-wash-auto.vercel.app")) return true;
        if (host.endsWith(".trycloudflare.com") || host.endsWith(".ngrok-free.app")) return true;
        return false;
    }
}