package com.NammaSociety.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for generating, storing, and verifying OTPs
 */
@Service
public class OTPService {

    private static final Logger logger = LoggerFactory.getLogger(OTPService.class);
    
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRATION_MINUTES = 5;
    
    private final SecureRandom random = new SecureRandom();
    
    // In-memory storage for OTPs (identifier -> OTPData)
    private final Map<String, OTPData> otpStorage = new ConcurrentHashMap<>();
    
    // Storage for reset tokens (identifier -> ResetToken)
    private final Map<String, ResetTokenData> resetTokenStorage = new ConcurrentHashMap<>();

    /**
     * Generate a 6-digit OTP
     */
    public String generateOTP() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Store OTP with expiration
     */
    public void storeOTP(String identifier, String otp) {
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);
        otpStorage.put(identifier.toLowerCase(), new OTPData(otp, expirationTime));
        logger.info("OTP stored for identifier: {}, expires at: {}", identifier, expirationTime);
    }

    /**
     * Verify OTP and remove if valid
     */
    public boolean verifyOTP(String identifier, String otp) {
        String key = identifier.toLowerCase();
        OTPData otpData = otpStorage.get(key);
        
        if (otpData == null) {
            logger.warn("No OTP found for identifier: {}", identifier);
            return false;
        }
        
        // Check if OTP has expired
        if (LocalDateTime.now().isAfter(otpData.expirationTime)) {
            logger.warn("OTP expired for identifier: {}", identifier);
            otpStorage.remove(key);
            return false;
        }
        
        // Verify OTP
        boolean isValid = otp.equals(otpData.otp);
        
        if (isValid) {
            logger.info("OTP verified successfully for identifier: {}", identifier);
            otpStorage.remove(key); // Remove OTP after successful verification
        } else {
            logger.warn("Invalid OTP provided for identifier: {}", identifier);
        }
        
        return isValid;
    }

    /**
     * Store reset token after OTP verification
     */
    public void storeResetToken(String identifier, String resetToken) {
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(15); // 15 minutes validity
        resetTokenStorage.put(identifier.toLowerCase(), new ResetTokenData(resetToken, expirationTime));
        logger.info("Reset token stored for identifier: {}, expires at: {}", identifier, expirationTime);
    }

    /**
     * Verify reset token
     */
    public boolean verifyResetToken(String identifier, String resetToken) {
        String key = identifier.toLowerCase();
        ResetTokenData tokenData = resetTokenStorage.get(key);
        
        if (tokenData == null) {
            logger.warn("No reset token found for identifier: {}", identifier);
            return false;
        }
        
        // Check if token has expired
        if (LocalDateTime.now().isAfter(tokenData.expirationTime)) {
            logger.warn("Reset token expired for identifier: {}", identifier);
            resetTokenStorage.remove(key);
            return false;
        }
        
        // Verify token
        boolean isValid = resetToken.equals(tokenData.token);
        
        if (isValid) {
            logger.info("Reset token verified successfully for identifier: {}", identifier);
        } else {
            logger.warn("Invalid reset token provided for identifier: {}", identifier);
        }
        
        return isValid;
    }

    /**
     * Invalidate reset token after password reset
     */
    public void invalidateResetToken(String identifier) {
        resetTokenStorage.remove(identifier.toLowerCase());
        logger.info("Reset token invalidated for identifier: {}", identifier);
    }

    /**
     * Clean up expired OTPs and tokens (should be called periodically)
     */
    public void cleanupExpiredData() {
        LocalDateTime now = LocalDateTime.now();
        
        // Clean expired OTPs
        otpStorage.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expirationTime));
        
        // Clean expired reset tokens
        resetTokenStorage.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expirationTime));
        
        logger.info("Cleaned up expired OTPs and reset tokens");
    }

    /**
     * Inner class to store OTP data
     */
    private static class OTPData {
        final String otp;
        final LocalDateTime expirationTime;
        
        OTPData(String otp, LocalDateTime expirationTime) {
            this.otp = otp;
            this.expirationTime = expirationTime;
        }
    }

    /**
     * Inner class to store reset token data
     */
    private static class ResetTokenData {
        final String token;
        final LocalDateTime expirationTime;
        
        ResetTokenData(String token, LocalDateTime expirationTime) {
            this.token = token;
            this.expirationTime = expirationTime;
        }
    }
}

