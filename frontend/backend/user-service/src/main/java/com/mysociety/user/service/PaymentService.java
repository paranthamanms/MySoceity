package com.NammaSociety.user.service;

import com.NammaSociety.user.model.MaintenancePayment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.concurrent.ConcurrentHashMap;

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
    
    // In-memory storage for payment data (keyed by "towerNumber:flatNumber")
    private final Map<String, List<MaintenancePayment>> paymentStorage = new ConcurrentHashMap<>();
    
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

        return new MaintenancePayment(towerNumber, flatNumber, quarterName, quarterPeriod, amount, dueDate, status, additionalFields);
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
            throw new IllegalArgumentException("Date format not recognized: " + dateStr + ". Supported formats: YYYY-MM-DD or DD-MM-YYYY");
        }
    }
    
    /**
     * Store payment data for a specific tower and flat
     */
    private void storePayment(MaintenancePayment payment) {
        String key = payment.getTowerNumber() + ":" + payment.getFlatNumber();
        
        paymentStorage.computeIfAbsent(key, k -> new ArrayList<>());
        
        List<MaintenancePayment> payments = paymentStorage.get(key);
        
        // Remove existing payment for the same quarter if exists (update logic)
        payments.removeIf(p -> p.getQuarterName().equalsIgnoreCase(payment.getQuarterName()));
        
        // Add new payment
        payments.add(payment);
        
        logger.info("Stored payment - Key: '{}', Tower: {}, Flat: {}, Quarter: {}, Amount: {}", 
                    key, payment.getTowerNumber(), payment.getFlatNumber(), 
                    payment.getQuarterName(), payment.getAmount());
        
        // Log all stored keys for debugging
        logger.debug("Current stored payment keys: {}", paymentStorage.keySet());
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
        String key = towerNumber + ":" + flatNumber;
        List<MaintenancePayment> payments = paymentStorage.getOrDefault(key, new ArrayList<>());
        
        logger.info("Retrieving payments - Requested Key: '{}', Tower: {}, Flat: {}, Found {} records", 
                    key, towerNumber, flatNumber, payments.size());
        logger.debug("Available keys in storage: {}", paymentStorage.keySet());
        
        if (payments.isEmpty()) {
            logger.warn("No payment records found for Tower: {}, Flat: {}. Available keys: {}", 
                        towerNumber, flatNumber, paymentStorage.keySet());
        }
        
        return payments;
    }
    
    /**
     * Get all stored payment data (for debugging/admin purposes)
     */
    public Map<String, List<MaintenancePayment>> getAllPayments() {
        return new ConcurrentHashMap<>(paymentStorage);
    }
    
    /**
     * Clear all payment data
     */
    public void clearAllPayments() {
        paymentStorage.clear();
        logger.info("All payment data cleared");
    }
}

