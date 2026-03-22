package com.mysociety.user.service;

import com.mysociety.user.model.MaintenancePayment;
import com.mysociety.user.model.UserProfile;
import com.mysociety.user.repository.MaintenancePaymentRepository;
import com.mysociety.user.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final Set<String> REQUIRED_HEADERS = new HashSet<>(Arrays.asList(
        "towernumber",
        "flatnumber",
        "quartername",
        "quarterperiod",
        "amount",
        "duedate",
        "status"
    ));
    
    // Optional header for society name
    private static final String OPTIONAL_SOCIETY_HEADER = "societyname";
    
    @Autowired
    private MaintenancePaymentRepository paymentRepository;
    
    @Autowired
    private UserProfileRepository userProfileRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SMSService smsService;
    
    /**
     * Process bulk upload of payment data from CSV file
     * CSV format: towerNumber,flatNumber,quarterName,quarterPeriod,amount,dueDate,status
     */
    public int processBulkUpload(MultipartFile file) throws Exception {
        int recordsProcessed = 0;
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            List<String> headers = null;
            Map<String, Integer> headerIndex = new HashMap<>();

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }

                if (headers == null) {
                    headers = parseCsvHeader(line);
                    headerIndex = buildHeaderIndex(headers);
                    validateHeaders(headerIndex);
                    continue;
                }

                try {
                    MaintenancePayment payment = parseCsvLine(headers, headerIndex, line);
                    storePayment(payment);
                    recordsProcessed++;
                } catch (Exception e) {
                    logger.warn("Error parsing CSV line: {}. Error: {}", line, e.getMessage());
                    // Continue processing other lines
                }
            }
        }
        
        logger.info("Payment bulk upload completed. Total records processed: {}", recordsProcessed);
        return recordsProcessed;
    }
    
    /**
     * Parse a single CSV line into MaintenancePayment object
     * Supports both DD-MM-YYYY and YYYY-MM-DD date formats
     */
    private MaintenancePayment parseCsvLine(List<String> headers, Map<String, Integer> headerIndex, String line) {
        String[] fields = line.split(",", -1);

        String towerNumber = getRequiredValue(headerIndex, fields, "towernumber");
        String flatNumber = getRequiredValue(headerIndex, fields, "flatnumber");
        String quarterName = getRequiredValue(headerIndex, fields, "quartername");
        String quarterPeriod = getRequiredValue(headerIndex, fields, "quarterperiod");
        Double amount = Double.parseDouble(getRequiredValue(headerIndex, fields, "amount"));

        String dateStr = getRequiredValue(headerIndex, fields, "duedate");
        LocalDate dueDate = parseDateFlexible(dateStr);

        String status = getRequiredValue(headerIndex, fields, "status");

        Map<String, String> additionalFields = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            String header = headers.get(i).trim();
            String normalized = header.toLowerCase();
            if (REQUIRED_HEADERS.contains(normalized)) {
                continue;
            }
            if (i >= fields.length) {
                continue;
            }
            String value = fields[i].trim();
            if (!value.isEmpty()) {
                additionalFields.put(header, value);
            }
        }

        logger.info("Parsed CSV line - Tower: {}, Flat: {}, Quarter: {}, Amount: {}, Date: {}, Status: {}", 
                towerNumber, flatNumber, quarterName, amount, dueDate, status);

        MaintenancePayment payment = new MaintenancePayment(towerNumber, flatNumber, quarterName, quarterPeriod, amount, dueDate, status);
        payment.setId(UUID.randomUUID().toString());
        payment.setCreatedAt(System.currentTimeMillis());
        payment.setUpdatedAt(System.currentTimeMillis());
        
        // Set society name if present in CSV
        String societyName = getOptionalValue(headerIndex, fields, OPTIONAL_SOCIETY_HEADER);
        if (societyName != null && !societyName.isEmpty()) {
            payment.setSocietyName(societyName);
            logger.info("Society name set from CSV: {}", societyName);
        }
        
        return payment;
    }

    private List<String> parseCsvHeader(String line) {
        String[] fields = line.split(",", -1);
        List<String> headers = new ArrayList<>();
        for (String field : fields) {
            headers.add(field.trim());
        }
        return headers;
    }

    private Map<String, Integer> buildHeaderIndex(List<String> headers) {
        Map<String, Integer> headerIndex = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            String header = headers.get(i).trim().toLowerCase();
            if (!header.isEmpty()) {
                headerIndex.put(header, i);
            }
        }
        return headerIndex;
    }

    private void validateHeaders(Map<String, Integer> headerIndex) {
        for (String required : REQUIRED_HEADERS) {
            if (!headerIndex.containsKey(required)) {
                throw new IllegalArgumentException("Missing required CSV header: " + required);
            }
        }
    }

    private String getRequiredValue(Map<String, Integer> headerIndex, String[] fields, String key) {
        Integer index = headerIndex.get(key);
        if (index == null || index < 0 || index >= fields.length) {
            throw new IllegalArgumentException("Missing required CSV value: " + key);
        }
        String value = fields[index].trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("Empty required CSV value: " + key);
        }
        return value;
    }
    
    /**
     * Get optional value from CSV (returns null if not present or empty)
     */
    private String getOptionalValue(Map<String, Integer> headerIndex, String[] fields, String key) {
        Integer index = headerIndex.get(key);
        if (index == null || index < 0 || index >= fields.length) {
            return null;
        }
        String value = fields[index].trim();
        return value.isEmpty() ? null : value;
    }
    
    /**
     * Parse date string in flexible format (DD-MM-YYYY or YYYY-MM-DD)
     */
    private LocalDate parseDateFlexible(String dateStr) {
        // Try YYYY-MM-DD format first (ISO standard)
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        } catch (Exception e1) {
            logger.debug("Date not in YYYY-MM-DD format, trying DD-MM-YYYY");
        }
        
        // Try DD-MM-YYYY format
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception e2) {
            logger.debug("Date not in DD-MM-YYYY format, trying DD/MM/YYYY");
        }
        
        // Try DD/MM/YYYY format (with slashes)
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception e3) {
            logger.debug("Date not in DD/MM/YYYY format, trying YYYY/MM/DD");
        }
        
        // Try YYYY/MM/DD format
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        } catch (Exception e4) {
            logger.error("Unable to parse date in any recognized format: {}", dateStr);
            throw new IllegalArgumentException("Unable to parse date: " + dateStr);
        }
    }
    
    /**
     * Store payment to database
     */
    private void storePayment(MaintenancePayment payment) {
        // Check if payment already exists for this tower/flat/quarter
        List<MaintenancePayment> existing = paymentRepository.findByTowerNumberAndFlatNumberAndQuarterName(
            payment.getTowerNumber(), payment.getFlatNumber(), payment.getQuarterName());
        
        if (!existing.isEmpty()) {
            // Update existing payment
            MaintenancePayment existingPayment = existing.get(0);
            existingPayment.setAmount(payment.getAmount());
            existingPayment.setDueDate(payment.getDueDate());
            existingPayment.setStatus(payment.getStatus());
            existingPayment.setQuarterPeriod(payment.getQuarterPeriod());
            existingPayment.setUpdatedAt(System.currentTimeMillis());
            paymentRepository.save(existingPayment);
            logger.info("Updated existing payment - Tower: {}, Flat: {}, Quarter: {}", 
                payment.getTowerNumber(), payment.getFlatNumber(), payment.getQuarterName());
        } else {
            // Save new payment
            paymentRepository.save(payment);
            logger.info("Stored new payment - Tower: {}, Flat: {}, Quarter: {}, Amount: {}", 
                payment.getTowerNumber(), payment.getFlatNumber(), 
                payment.getQuarterName(), payment.getAmount());
        }
    }
    
    /**
     * Get all payments for a specific user by username
     * This would need to lookup the user's tower and flat from user service
     */
    public List<MaintenancePayment> getPaymentsByUsername(String username) {
        // TODO: Lookup user's tower and flat number from user repository
        // For now, returning empty list
        logger.warn("getPaymentsByUsername not fully implemented yet");
        return new ArrayList<>();
    }
    
    /**
     * Get all payments for a specific tower and flat
     */
    public List<MaintenancePayment> getPaymentsByTowerAndFlat(String towerNumber, String flatNumber) {
        List<MaintenancePayment> payments = paymentRepository.findByTowerNumberAndFlatNumber(towerNumber, flatNumber);
        
        logger.info("Retrieving payments - Tower: {}, Flat: {}, Found {} records", 
                    towerNumber, flatNumber, payments.size());
        
        if (payments.isEmpty()) {
            logger.warn("No payment records found for Tower: {}, Flat: {}", 
                        towerNumber, flatNumber);
        }
        
        return payments;
    }
    
    /**
     * Get all payments for a specific society
     */
    public List<MaintenancePayment> getPaymentsBySociety(String societyName) {
        return paymentRepository.findBySocietyName(societyName);
    }
    
    /**
     * Get all stored payment data (for debugging/admin purposes)
     */
    public List<MaintenancePayment> getAllPayments() {
        return paymentRepository.findAll();
    }
    
    /**
     * Clear all payment data
     */
    public void clearAllPayments() {
        paymentRepository.deleteAll();
        logger.info("All payment data cleared");
    }
    
    /**
     * Send payment reminders for pending/overdue payments
     * @param societyName Society to send reminders for
     * @param daysBefore Number of days before due date to send reminders (0 = due today, negative = overdue)
     * @param sendEmail Whether to send email reminders
     * @param sendSMS Whether to send SMS reminders
     * @return Map with reminder statistics
     */
    public Map<String, Object> sendPaymentReminders(String societyName, int daysBefore, boolean sendEmail, boolean sendSMS) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            LocalDate targetDate = LocalDate.now().plusDays(daysBefore);
            
            // Get all pending payments for the society
            List<MaintenancePayment> payments = paymentRepository.findBySocietyName(societyName);
            List<MaintenancePayment> pendingPayments = payments.stream()
                    .filter(p -> "pending".equalsIgnoreCase(p.getStatus()))
                    .filter(p -> {
                        LocalDate dueDate = p.getDueDate();
                        // For overdue: dueDate is before today
                        // For upcoming: dueDate matches target date
                        if (daysBefore < 0) {
                            return dueDate.isBefore(LocalDate.now());
                        } else {
                            return dueDate.isEqual(targetDate) || dueDate.isBefore(targetDate);
                        }
                    })
                    .collect(Collectors.toList());
            
            logger.info("Found {} pending payments for society {} with target date {}", 
                    pendingPayments.size(), societyName, targetDate);
            
            int emailsSent = 0;
            int smsSent = 0;
            List<String> errors = new ArrayList<>();
            
            // Group payments by user (tower + flat)
            Map<String, List<MaintenancePayment>> paymentsByUser = pendingPayments.stream()
                    .collect(Collectors.groupingBy(p -> p.getTowerNumber() + "-" + p.getFlatNumber()));
            
            // Send reminders for each user
            for (Map.Entry<String, List<MaintenancePayment>> entry : paymentsByUser.entrySet()) {
                String userKey = entry.getKey();
                List<MaintenancePayment> userPayments = entry.getValue();
                
                // Get user profile
                UserProfile user = findUserByTowerAndFlat(societyName, userPayments.get(0).getTowerNumber(), userPayments.get(0).getFlatNumber());
                
                if (user == null) {
                    logger.warn("User not found for tower {} flat {}", userPayments.get(0).getTowerNumber(), userPayments.get(0).getFlatNumber());
                    errors.add("User not found: " + userKey);
                    continue;
                }
                
                // Calculate total amount due
                double totalAmount = userPayments.stream()
                        .mapToDouble(MaintenancePayment::getAmount)
                        .sum();
                
                // Get earliest due date
                LocalDate earliestDueDate = userPayments.stream()
                        .map(MaintenancePayment::getDueDate)
                        .min(LocalDate::compareTo)
                        .orElse(LocalDate.now());
                
                // Send email reminder
                if (sendEmail && user.getEmail() != null && !user.getEmail().isEmpty()) {
                    try {
                        sendPaymentReminderEmail(user, userPayments, totalAmount, earliestDueDate, daysBefore < 0);
                        emailsSent++;
                    } catch (Exception e) {
                        logger.error("Failed to send email to {}: {}", user.getEmail(), e.getMessage());
                        errors.add("Email failed for " + user.getUsername() + ": " + e.getMessage());
                    }
                }
                
                // Send SMS reminder
                if (sendSMS && smsService.isEnabled() && user.getPhoneNumber() != null && !user.getPhoneNumber().isEmpty()) {
                    try {
                        smsService.sendPaymentReminderSMS(
                                user.getPhoneNumber(),
                                user.getUsername(),
                                totalAmount,
                                earliestDueDate.toString()
                        );
                        smsSent++;
                    } catch (Exception e) {
                        logger.error("Failed to send SMS to {}: {}", user.getPhoneNumber(), e.getMessage());
                        errors.add("SMS failed for " + user.getUsername() + ": " + e.getMessage());
                    }
                }
            }
            
            result.put("success", true);
            result.put("message", "Payment reminders sent successfully");
            result.put("totalPendingPayments", pendingPayments.size());
            result.put("uniqueUsers", paymentsByUser.size());
            result.put("emailsSent", emailsSent);
            result.put("smsSent", smsSent);
            result.put("errors", errors);
            
            logger.info("Payment reminders completed: {} emails, {} SMS sent", emailsSent, smsSent);
            
        } catch (Exception e) {
            logger.error("Error sending payment reminders: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "Error sending reminders: " + e.getMessage());
            result.put("emailsSent", 0);
            result.put("smsSent", 0);
        }
        
        return result;
    }
    
    /**
     * Find user by tower and flat number
     */
    private UserProfile findUserByTowerAndFlat(String societyName, String towerNumber, String flatNumber) {
        List<UserProfile> users = userProfileRepository.findBySocietyName(societyName);
        return users.stream()
                .filter(u -> towerNumber.equals(u.getTowerNumber()) && flatNumber.equals(u.getFlatNumber()))
                .findFirst()
                .orElse(null);
    }
    
    /**
     * Send payment reminder email
     */
    private void sendPaymentReminderEmail(UserProfile user, List<MaintenancePayment> payments, double totalAmount, LocalDate dueDate, boolean isOverdue) {
        String subject = isOverdue ? 
                "âš ï¸ Overdue Payment Reminder - NammaSociety" : 
                "ðŸ’° Payment Reminder - NammaSociety";
        
        StringBuilder paymentDetails = new StringBuilder();
        paymentDetails.append("<ul style='list-style: none; padding: 0;'>");
        for (MaintenancePayment payment : payments) {
            paymentDetails.append("<li style='padding: 8px 0; border-bottom: 1px solid #eee;'>");
            paymentDetails.append("<strong>").append(payment.getQuarterName()).append("</strong> (")
                    .append(payment.getQuarterPeriod()).append(")<br>");
            paymentDetails.append("Amount: â‚¹").append(String.format("%.2f", payment.getAmount()))
                    .append(" | Due: ").append(payment.getDueDate().toString());
            paymentDetails.append("</li>");
        }
        paymentDetails.append("</ul>");
        
        String content = String.format("""
                <p>Dear %s,</p>
                <p>This is a %s regarding your maintenance payment(s):</p>
                %s
                <div style='background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                    <p style='margin: 0; font-size: 18px; font-weight: 600; color: #f57c00;'>
                        Total Amount Due: â‚¹%s
                    </p>
                    <p style='margin: 10px 0 0 0; font-size: 14px; color: #666;'>
                        %s
                    </p>
                </div>
                <p><strong>Payment Details:</strong></p>
                <p>Tower: %s | Flat: %s<br>
                Society: %s</p>
                <p style='margin-top: 25px;'>Please make the payment at your earliest convenience to avoid late fees.</p>
                """,
                user.getUsername(),
                isOverdue ? "reminder about your <strong>overdue</strong> payment" : "friendly reminder",
                paymentDetails.toString(),
                String.format("%.2f", totalAmount),
                isOverdue ? "âš ï¸ This payment is overdue. Please pay immediately." : 
                           "Due Date: " + dueDate.toString(),
                user.getTowerNumber(),
                user.getFlatNumber(),
                user.getSocietyName()
        );
        
        emailService.sendAnnouncementEmail(
                Arrays.asList(user.getEmail()),
                subject,
                content,
                isOverdue ? "urgent" : "maintenance"
        );
    }
    
    /**
     * Get overdue payments count for a society
     */
    public long getOverduePaymentsCount(String societyName) {
        List<MaintenancePayment> payments = paymentRepository.findBySocietyName(societyName);
        return payments.stream()
                .filter(p -> "pending".equalsIgnoreCase(p.getStatus()))
                .filter(p -> p.getDueDate().isBefore(LocalDate.now()))
                .count();
    }
}


