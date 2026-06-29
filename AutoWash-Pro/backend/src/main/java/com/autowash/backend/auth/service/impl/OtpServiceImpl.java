package com.autowash.backend.auth.service.impl;

import com.autowash.backend.auth.service.OtpService;
import com.autowash.backend.common.exception.BusinessException;
import com.autowash.backend.otp.entity.OtpVerification;
import com.autowash.backend.otp.repository.OtpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpServiceImpl implements OtpService {

    private final OtpRepository optRepository;

    public OtpServiceImpl(OtpRepository optRepository){
        this.optRepository = optRepository;
    }

    @Override
    @Transactional
    public void sendOtp(String phone){
        //1.sinh otp voi 6 so ngau nhien
        String otpCode = String.format("%06d", new Random().nextInt(999999));

        //2.lưu vào DB hết hạn sau 5p
        OtpVerification otp = OtpVerification.builder()
                .phone(phone)
                .otpCode(otpCode)
                .verified(false)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        optRepository.save(otp);

        //3. gửi SMS(MOCK - in ra console, sau thay bằng Twilio/Firebase)

        System.out.println("========================================");
        System.out.println("[MOCK SMS] gửi tới: " + phone);
        System.out.println("Mã OTP của bạn: " + otpCode);
        System.out.println(" Hết hạn sau 5 phút");
        System.out.println("========================================");


    }

    @Override
    @Transactional
    public boolean verifyOtp(String phone, String otp) {
        //1.Tìm OTP mới nhất của phone
        OtpVerification record = optRepository.findTopByPhoneAndVerifiedFalseOrderByCreatedAtDesc(phone).orElseThrow(() -> new BusinessException("Không tìm thấy mã OTP cho số này"));
        //2.kiểm tra hết hạn
        if(record.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new BusinessException("Mã OTP đã hết hạn, vui lòng gửi lại!!!");
        }
            //3.So sánh mã
            if(!record.getOtpCode().equals(otp)){
                throw new BusinessException("Mã otp không đúng!!!");
            }

            //4.đánh dấu đã verify
            record.setVerified(true);
            optRepository.save(record);

        return true;
    }

    @Override
    public boolean isPhoneVerified(String phone) {
        return optRepository.existsByPhoneAndVerifiedTrue(phone);
    }

    @Override
    @Transactional
    public void clearVerification(String phone) {
        optRepository.deleteByPhoneAndVerifiedTrue(phone);
    }

}
