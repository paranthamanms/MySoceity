package com.NammaSociety.user.controller;

import com.NammaSociety.user.model.MaintenancePayment;
import com.NammaSociety.user.service.PaymentService;
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
}

