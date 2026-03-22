package com.NammaSociety.auth.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Service for sending SMS notifications via Twilio
 */
@Service
public class SMSService {

    private static final Logger logger = LoggerFactory.getLogger(SMSService.class);

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String fromPhoneNumber;

    @Value("${notification.sms.enabled:true}")
    private boolean smsEnabled;

    @PostConstruct
    public void init() {
        if (smsEnabled && !accountSid.startsWith("your-")) {
            try {
                Twilio.init(accountSid, authToken);
                logger.info("âœ… Twilio SMS service initialized successfully");
            } catch (Exception e) {
                logger.error("âŒ Failed to initialize Twilio: {}", e.getMessage());
                smsEnabled = false;
            }
        } else {
            logger.warn("âš ï¸ SMS service is disabled or not configured. Set TWILIO credentials to enable.");
            smsEnabled = false;
        }
    }

    /**
     * Send OTP via SMS
     * Phone number should be 10 digits without country code (e.g., 9176787766)
     */
    public void sendOTP(String phoneNumber, String otp) {
        if (!smsEnabled) {
            logger.error("âŒ SMS service is not enabled or failed to initialize");
            throw new RuntimeException("SMS service is not available. Please check Twilio configuration.");
        }

        try {
            // Clean phone number (remove any non-digits)
            String cleanedNumber = phoneNumber.replaceAll("[^0-9]", "");
            
            if (!isValidPhoneNumber(cleanedNumber)) {
                logger.error("âŒ Invalid phone number format: {}", phoneNumber);
                throw new RuntimeException("Invalid phone number: Must be 10 digits");
            }

            // Add +91 only for Twilio API call (not stored anywhere)
            String twilioNumber = "+91" + cleanedNumber;
            
            String messageText = String.format("Your NammaSociety OTP is: %s\n\nValid for 5 minutes.\nDo not share this code.", otp);

            Message message = Message.creator(
                    new PhoneNumber(twilioNumber),
                    new PhoneNumber(fromPhoneNumber),
                    messageText
            ).create();

            logger.info("âœ… SMS sent successfully to {}: {}", cleanedNumber, message.getSid());

        } catch (Exception e) {
            logger.error("âŒ Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send OTP SMS: " + e.getMessage(), e);
        }
    }

    /**
     * Validate phone number format (10 digits only)
     */
    private boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return false;
        }
        
        // Must be exactly 10 digits
        return phoneNumber.matches("\\d{10}");
    }

    /**
     * Generic SMS sending method
     * Phone number should be 10 digits without country code
     */
    public void sendSMS(String phoneNumber, String messageText) {
        if (!smsEnabled) {
            logger.warn("SMS service is not enabled");
            return;
        }

        try {
            // Clean phone number
            String cleanedNumber = phoneNumber.replaceAll("[^0-9]", "");
            
            if (!isValidPhoneNumber(cleanedNumber)) {
                logger.warn("Invalid phone number format: {}", phoneNumber);
                return;
            }

            // Add +91 only for Twilio API call
            String twilioNumber = "+91" + cleanedNumber;

            // Truncate if too long (SMS limit is 160 characters)
            if (messageText.length() > 160) {
                messageText = messageText.substring(0, 157) + "...";
            }

            Message message = Message.creator(
                    new PhoneNumber(twilioNumber),
                    new PhoneNumber(fromPhoneNumber),
                    messageText
            ).create();

            logger.info("âœ… SMS sent successfully to {}: {}", cleanedNumber, message.getSid());

        } catch (Exception e) {
            logger.error("âŒ Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
        }
    }
}

