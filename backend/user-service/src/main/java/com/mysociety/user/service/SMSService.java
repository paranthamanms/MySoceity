package com.mysociety.user.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;

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
                logger.info("Twilio SMS service initialized successfully");
            } catch (Exception e) {
                logger.error("Failed to initialize Twilio: {}", e.getMessage());
                smsEnabled = false;
            }
        } else {
            logger.warn("SMS service is disabled or not configured. Set TWILIO credentials to enable.");
            smsEnabled = false;
        }
    }

    /**
     * Send announcement SMS to multiple recipients
     * Phone numbers should be 10 digits without country code (e.g., 9176787766)
     */
    public void sendAnnouncementSMS(List<String> phoneNumbers, String messageText, String announcementType) {
        if (!smsEnabled) {
            logger.warn("SMS service is not enabled");
            return;
        }

        if (phoneNumbers == null || phoneNumbers.isEmpty()) {
            logger.warn("No phone numbers provided for SMS");
            return;
        }

        // Add branding and type prefix
        String typePrefix = announcementType != null ? "[" + announcementType.toUpperCase() + "] " : "";
        String fullMessage = "NammaSociety - " + typePrefix + messageText;

        // Truncate if message is too long (SMS limit is 160 characters)
        if (fullMessage.length() > 160) {
            fullMessage = fullMessage.substring(0, 157) + "...";
        }

        int successCount = 0;
        int failureCount = 0;

        for (String phoneNumber : phoneNumbers) {
            try {
                // Clean phone number (remove any non-digits)
                String cleanedNumber = phoneNumber.replaceAll("[^0-9]", "");
                
                // Validate phone number format
                if (!isValidPhoneNumber(cleanedNumber)) {
                    logger.warn("Invalid phone number format: {}", phoneNumber);
                    failureCount++;
                    continue;
                }

                // Add +91 only for Twilio API call
                String twilioNumber = "+91" + cleanedNumber;

                Message message = Message.creator(
                        new PhoneNumber(twilioNumber),
                        new PhoneNumber(fromPhoneNumber),
                        fullMessage
                ).create();

                logger.debug("SMS sent successfully to {}: {}", cleanedNumber, message.getSid());
                successCount++;

            } catch (Exception e) {
                logger.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
                failureCount++;
            }
        }

        logger.info("SMS sending completed: {} successful, {} failed", successCount, failureCount);
    }

    /**
     * Send complaint notification SMS
     * Phone number should be 10 digits without country code
     */
    public void sendComplaintNotificationSMS(String phoneNumber, String complaintTitle, String createdBy) {
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

            String messageText = String.format("New Complaint: %s (by %s). Check NammaSociety dashboard for details.", 
                complaintTitle, createdBy);

            // Truncate if too long
            if (messageText.length() > 160) {
                messageText = messageText.substring(0, 157) + "...";
            }

            Message message = Message.creator(
                    new PhoneNumber(twilioNumber),
                    new PhoneNumber(fromPhoneNumber),
                    messageText
            ).create();

            logger.info("Complaint notification SMS sent successfully to {}: {}", cleanedNumber, message.getSid());

        } catch (Exception e) {
            logger.error("Failed to send complaint SMS to {}: {}", phoneNumber, e.getMessage());
        }
    }

    /**
     * Send payment reminder SMS
     */
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

            // Truncate if too long
            if (messageText.length() > 160) {
                messageText = messageText.substring(0, 157) + "...";
            }

            Message message = Message.creator(
                    new PhoneNumber(twilioNumber),
                    new PhoneNumber(fromPhoneNumber),
                    messageText
            ).create();

            logger.info("SMS sent successfully to {}: {}", cleanedNumber, message.getSid());

        } catch (Exception e) {
            logger.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
        }
    }

    /**
     * Send payment reminder SMS
     * Phone number should be 10 digits without country code
     */
    public void sendPaymentReminderSMS(String phoneNumber, String userName, double amount, String dueDate) {
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

            String messageText = String.format("Payment Reminder: %s, your payment of Rs.%.2f is due on %s. Pay via NammaSociety app.", 
                userName, amount, dueDate);

            // Truncate if too long
            if (messageText.length() > 160) {
                messageText = messageText.substring(0, 157) + "...";
            }

            Message message = Message.creator(
                    new PhoneNumber(twilioNumber),
                    new PhoneNumber(fromPhoneNumber),
                    messageText
            ).create();

            logger.info("Payment reminder SMS sent successfully to {}: {}", cleanedNumber, message.getSid());

        } catch (Exception e) {
            logger.error("Failed to send payment reminder SMS to {}: {}", phoneNumber, e.getMessage());
        }
    }

    /**
     * Validate phone number format (10 digits only)
     */
    private boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }
        
        // Must be exactly 10 digits
        String cleaned = phoneNumber.trim();
        return cleaned.matches("\\d{10}");
    }

    /**
     * Check if SMS service is enabled
     */
    public boolean isEnabled() {
        return smsEnabled;
    }
}

