package com.mysociety.user.controller;

import com.mysociety.user.model.MaintenancePayment;
import com.mysociety.user.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/payments")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    /**
     * Bulk upload payment details from CSV file
     */
    @PostMapping("/bulk-upload")
    public ResponseEntity<Map<String, Object>> bulkUploadPayments(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Received payment bulk upload request. File: {}", file.getOriginalFilename());
            
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }
            
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.endsWith(".csv")) {
                response.put("success", false);
                response.put("message", "Only CSV files are supported");
                return ResponseEntity.badRequest().body(response);
            }
            
            int recordsProcessed = paymentService.processBulkUpload(file);
            
            response.put("success", true);
            response.put("message", String.format("Successfully processed %d payment records", recordsProcessed));
            response.put("recordsProcessed", recordsProcessed);
            
            logger.info("Payment bulk upload completed. Records processed: {}", recordsProcessed);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error processing payment bulk upload", e);
            response.put("success", false);
            response.put("message", "Error processing file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get payment details for a specific user
     */
    @GetMapping("/user/{username}")
    public ResponseEntity<Map<String, Object>> getUserPayments(@PathVariable String username) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<MaintenancePayment> payments = paymentService.getPaymentsByUsername(username);
            
            response.put("success", true);
            response.put("payments", payments);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching user payments", e);
            response.put("success", false);
            response.put("message", "Error fetching payments: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get payment details by tower and flat
     */
    @GetMapping("/tower/{towerNumber}/flat/{flatNumber}")
    public ResponseEntity<Map<String, Object>> getPaymentsByTowerAndFlat(
            @PathVariable String towerNumber, 
            @PathVariable String flatNumber) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<MaintenancePayment> payments = paymentService.getPaymentsByTowerAndFlat(towerNumber, flatNumber);
            
            response.put("success", true);
            response.put("payments", payments);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching payments by tower and flat", e);
            response.put("success", false);
            response.put("message", "Error fetching payments: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get all payments for a specific society
     * Used by society admins to view all maintenance payments
     */
    @GetMapping("/society/{societyName}")
    public ResponseEntity<Map<String, Object>> getPaymentsBySociety(@PathVariable String societyName) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<MaintenancePayment> payments = paymentService.getPaymentsBySociety(societyName);
            
            response.put("success", true);
            response.put("payments", payments);
            response.put("count", payments.size());
            logger.info("Fetched {} payments for society: {}", payments.size(), societyName);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching payments for society: {}", societyName, e);
            response.put("success", false);
            response.put("message", "Error fetching payments: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Debug endpoint - Get all stored payment data
     * Only for testing/debugging purposes
     */
    @GetMapping("/debug/all")
    public ResponseEntity<Map<String, Object>> debugGetAllPayments() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            response.put("success", true);
            response.put("allPayments", paymentService.getAllPayments());
            logger.info("Debug endpoint called - returning all stored payment data");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching all payments for debugging", e);
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Debug endpoint - Clear all payment data
     * Only for testing/debugging purposes
     */
    @DeleteMapping("/debug/clear")
    public ResponseEntity<Map<String, Object>> debugClearAllPayments() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            paymentService.clearAllPayments();
            response.put("success", true);
            response.put("message", "All payment data cleared");
            logger.warn("DEBUG: All payment data cleared");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error clearing payment data", e);
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Send payment reminders to users with pending payments
     * @param societyName Society name
     * @param daysBefore Days before due date (0 = due today, negative = overdue)
     * @param sendEmail Whether to send email reminders
     * @param sendSMS Whether to send SMS reminders
     */
    @PostMapping("/send-reminders")
    public ResponseEntity<Map<String, Object>> sendPaymentReminders(
            @RequestParam String societyName,
            @RequestParam(defaultValue = "0") int daysBefore,
            @RequestParam(defaultValue = "true") boolean sendEmail,
            @RequestParam(defaultValue = "false") boolean sendSMS) {
        
        try {
            logger.info("Sending payment reminders for society: {}, daysBefore: {}, email: {}, SMS: {}", 
                    societyName, daysBefore, sendEmail, sendSMS);
            
            Map<String, Object> result = paymentService.sendPaymentReminders(societyName, daysBefore, sendEmail, sendSMS);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error sending payment reminders", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error sending reminders: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get count of overdue payments for a society
     */
    @GetMapping("/overdue-count")
    public ResponseEntity<Map<String, Object>> getOverdueCount(@RequestParam String societyName) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            long overdueCount = paymentService.getOverduePaymentsCount(societyName);
            
            response.put("success", true);
            response.put("overdueCount", overdueCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting overdue count", e);
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}


