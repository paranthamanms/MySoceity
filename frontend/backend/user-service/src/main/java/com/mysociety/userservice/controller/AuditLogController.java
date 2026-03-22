package com.NammaSociety.userservice.controller;

import com.NammaSociety.userservice.model.AuditLog;
import com.NammaSociety.userservice.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Get all audit logs (Admin only)
     */
    @GetMapping
    public ResponseEntity<?> getAllAuditLogs() {
        try {
            List<AuditLog> logs = auditLogService.getAllAuditLogs();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", logs,
                "count", logs.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error retrieving audit logs: " + e.getMessage()
            ));
        }
    }

    /**
     * Get audit logs by event type
     */
    @GetMapping("/by-event-type/{eventType}")
    public ResponseEntity<?> getAuditLogsByEventType(@PathVariable String eventType) {
        try {
            List<AuditLog> logs = auditLogService.getAuditLogsByEventType(eventType);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", logs,
                "count", logs.size(),
                "eventType", eventType
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error retrieving audit logs: " + e.getMessage()
            ));
        }
    }

    /**
     * Get audit logs by username
     */
    @GetMapping("/by-user/{username}")
    public ResponseEntity<?> getAuditLogsByUsername(@PathVariable String username) {
        try {
            List<AuditLog> logs = auditLogService.getAuditLogsByUsername(username);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", logs,
                "count", logs.size(),
                "username", username
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error retrieving audit logs: " + e.getMessage()
            ));
        }
    }

    /**
     * Get recent audit logs
     */
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentAuditLogs(
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) String serviceName) {
        try {
            List<AuditLog> logs = (serviceName == null || serviceName.isBlank())
                ? auditLogService.getRecentAuditLogs(limit)
                : auditLogService.getRecentAuditLogsByService(limit, serviceName);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", logs,
                "count", logs.size(),
                "limit", limit,
                "serviceName", serviceName
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error retrieving recent audit logs: " + e.getMessage()
            ));
        }
    }

    /**
     * Get audit log statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getAuditLogStatistics() {
        try {
            List<AuditLog> allLogs = auditLogService.getAllAuditLogs();
            Map<String, Long> eventTypeCount = new java.util.HashMap<>();
            allLogs.forEach(log -> 
                eventTypeCount.merge(log.getEventType(), 1L, Long::sum)
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "totalLogs", allLogs.size(),
                "eventTypeDistribution", eventTypeCount
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error retrieving audit log statistics: " + e.getMessage()
            ));
        }
    }

    /**
     * Log a new action (called from various services)
     */
    @PostMapping("/log")
    public ResponseEntity<?> logAction(@RequestBody Map<String, String> request) {
        try {
            String eventType = request.get("eventType");
            String serviceName = request.get("serviceName");
            String userId = request.get("userId");
            String username = request.get("username");
            String description = request.get("description");
            String ipAddress = request.get("ipAddress");
            String details = request.get("details");

            if (eventType == null || username == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "eventType and username are required"
                ));
            }

            AuditLog log = auditLogService.logAction(
                eventType, serviceName, userId, username, description, ipAddress, details
            );

            if (log == null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Audit logging is disabled",
                    "data", null
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Action logged successfully",
                "data", log
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error logging action: " + e.getMessage()
            ));
        }
    }

    /**
     * Get audit log configuration
     */
    @GetMapping("/config")
    public ResponseEntity<?> getAuditLogConfig() {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "retentionDays", auditLogService.getRetentionDays(),
                "auditLoggingEnabled", auditLogService.isAuditLoggingEnabled()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error retrieving audit log config: " + e.getMessage()
            ));
        }
    }

    /**
     * Update audit log configuration
     */
    @PutMapping("/config")
    public ResponseEntity<?> updateAuditLogConfig(@RequestBody Map<String, Object> request) {
        try {
            Object retentionDaysObj = request.get("retentionDays");
            Object auditLoggingEnabledObj = request.get("auditLoggingEnabled");

            if (retentionDaysObj != null) {
                int retentionDays = Integer.parseInt(retentionDaysObj.toString());
                auditLogService.setRetentionDays(retentionDays);
            }

            if (auditLoggingEnabledObj != null) {
                boolean enabled = Boolean.parseBoolean(auditLoggingEnabledObj.toString());
                auditLogService.setAuditLoggingEnabled(enabled);
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Audit log configuration updated",
                "retentionDays", auditLogService.getRetentionDays(),
                "auditLoggingEnabled", auditLogService.isAuditLoggingEnabled()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error updating audit log config: " + e.getMessage()
            ));
        }
    }

    /**
     * Clear all audit logs (Admin only - be careful!)
     */
    @DeleteMapping("/clear")
    public ResponseEntity<?> clearAuditLogs() {
        try {
            auditLogService.clearAuditLogs();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All audit logs cleared"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Error clearing audit logs: " + e.getMessage()
            ));
        }
    }
}

