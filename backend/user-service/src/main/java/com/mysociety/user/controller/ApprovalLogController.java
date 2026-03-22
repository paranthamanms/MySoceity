package com.mysociety.user.controller;

import com.mysociety.user.model.ApprovalLog;
import com.mysociety.user.service.ApprovalLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approval-logs")
@CrossOrigin(origins = "*")
public class ApprovalLogController {
    
    private static final Logger logger = LoggerFactory.getLogger(ApprovalLogController.class);
    
    @Autowired
    private ApprovalLogService approvalLogService;
    
    /**
     * Get all approval logs for a society (Security dashboard)
     * GET /api/approval-logs?societyName=XYZ
     */
    @GetMapping
    public ResponseEntity<?> getApprovalLogs(
            @RequestParam String societyName,
            @RequestParam(required = false) String apartmentNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<ApprovalLog> logs;
            
            if (startDate != null && endDate != null) {
                // Filter by date range
                logs = approvalLogService.getLogsByDateRange(societyName, startDate, endDate);
            } else if (apartmentNumber != null && !apartmentNumber.isEmpty()) {
                // Filter by apartment
                logs = approvalLogService.getLogsForApartment(apartmentNumber, societyName);
            } else {
                // All logs for society
                logs = approvalLogService.getLogsForSociety(societyName);
            }
            
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            logger.error("Error fetching approval logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch approval logs: " + e.getMessage()));
        }
    }
    
    /**
     * Get currently active visitors (who haven't exited)
     * GET /api/approval-logs/active?societyName=XYZ
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveVisitors(@RequestParam String societyName) {
        try {
            List<ApprovalLog> activeVisitors = approvalLogService.getActiveVisitors(societyName);
            return ResponseEntity.ok(activeVisitors);
        } catch (Exception e) {
            logger.error("Error fetching active visitors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch active visitors: " + e.getMessage()));
        }
    }
    
    /**
     * Mark visitor exit
     * POST /api/approval-logs/{id}/exit
     */
    @PostMapping("/{id}/exit")
    public ResponseEntity<?> markExit(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> data) {
        try {
            String securityGuard = getString(data, "securityGuard");
            String exitMethod = getString(data, "exitMethod");
            String exitFaceCapture = getString(data, "exitFaceCapture");
            Double exitMatchConfidence = getDouble(data, "exitMatchConfidence");

            boolean marked = approvalLogService.markExit(
                id,
                securityGuard,
                exitMethod,
                exitFaceCapture,
                exitMatchConfidence
            );
            
            if (marked) {
                return ResponseEntity.ok(Map.of("message", "Exit marked successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Log entry not found"));
            }
        } catch (Exception e) {
            logger.error("Error marking exit", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to mark exit: " + e.getMessage()));
        }
    }

    private String getString(Map<String, Object> data, String key) {
        if (data == null) {
            return null;
        }
        Object value = data.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private Double getDouble(Map<String, Object> data, String key) {
        if (data == null) {
            return null;
        }
        Object value = data.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ex) {
            return null;
        }
    }
    
    /**
     * Create approval log entry manually (when visitor with pre-approval enters)
     * POST /api/approval-logs
     */
    @PostMapping
    public ResponseEntity<?> createLogEntry(@RequestBody ApprovalLog log) {
        try {
            ApprovalLog created = approvalLogService.createLogEntry(log);
            logger.info("Approval log created: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            logger.error("Error creating approval log", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create approval log: " + e.getMessage()));
        }
    }
}

