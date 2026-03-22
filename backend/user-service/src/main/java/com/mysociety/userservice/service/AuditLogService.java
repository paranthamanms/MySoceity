package com.mysociety.userservice.service;

import com.mysociety.userservice.model.AuditLog;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    // In-memory storage (In production, use database)
    private List<AuditLog> auditLogs = Collections.synchronizedList(new ArrayList<>());
    private boolean auditLoggingEnabled = true;
    private int retentionDays = 15;

    /**
     * Log a user action
     */
    public AuditLog logAction(String eventType, String serviceName, String userId, String username, 
                               String description, String ipAddress, String details) {
        if (!auditLoggingEnabled) {
            return null;
        }
        pruneOldLogs();
        String id = UUID.randomUUID().toString();
        AuditLog log = new AuditLog(
            id, 
            eventType, 
            serviceName,
            userId, 
            username, 
            description, 
            ipAddress, 
            details, 
            System.currentTimeMillis()
        );
        auditLogs.add(log);
        return log;
    }

    /**
     * Get all audit logs
     */
    public List<AuditLog> getAllAuditLogs() {
        pruneOldLogs();
        return new ArrayList<>(auditLogs);
    }

    /**
     * Get audit logs by event type
     */
    public List<AuditLog> getAuditLogsByEventType(String eventType) {
        pruneOldLogs();
        return auditLogs.stream()
            .filter(log -> log.getEventType().equalsIgnoreCase(eventType))
            .collect(Collectors.toList());
    }

    /**
     * Get audit logs by username
     */
    public List<AuditLog> getAuditLogsByUsername(String username) {
        pruneOldLogs();
        return auditLogs.stream()
            .filter(log -> log.getUsername().equalsIgnoreCase(username))
            .collect(Collectors.toList());
    }

    /**
     * Get audit logs by user ID
     */
    public List<AuditLog> getAuditLogsByUserId(String userId) {
        pruneOldLogs();
        return auditLogs.stream()
            .filter(log -> log.getUserId().equals(userId))
            .collect(Collectors.toList());
    }

    public List<AuditLog> getAuditLogsByServiceName(String serviceName) {
        pruneOldLogs();
        return auditLogs.stream()
            .filter(log -> serviceName.equalsIgnoreCase(log.getServiceName()))
            .collect(Collectors.toList());
    }

    /**
     * Get recent audit logs (limit)
     */
    public List<AuditLog> getRecentAuditLogs(int limit) {
        pruneOldLogs();
        int startIndex = Math.max(0, auditLogs.size() - limit);
        return new ArrayList<>(auditLogs.subList(startIndex, auditLogs.size()));
    }

    public List<AuditLog> getRecentAuditLogsByService(int limit, String serviceName) {
        pruneOldLogs();
        List<AuditLog> filtered = auditLogs.stream()
            .filter(log -> serviceName.equalsIgnoreCase(log.getServiceName()))
            .collect(Collectors.toList());
        int startIndex = Math.max(0, filtered.size() - limit);
        return new ArrayList<>(filtered.subList(startIndex, filtered.size()));
    }

    /**
     * Clear all audit logs (admin operation)
     */
    public void clearAuditLogs() {
        auditLogs.clear();
    }

    /**
     * Get total audit log count
     */
    public int getAuditLogCount() {
        pruneOldLogs();
        return auditLogs.size();
    }

    public int getRetentionDays() {
        return retentionDays;
    }

    public void setRetentionDays(int retentionDays) {
        this.retentionDays = retentionDays;
        pruneOldLogs();
    }

    public boolean isAuditLoggingEnabled() {
        return auditLoggingEnabled;
    }

    public void setAuditLoggingEnabled(boolean auditLoggingEnabled) {
        this.auditLoggingEnabled = auditLoggingEnabled;
    }

    private void pruneOldLogs() {
        if (retentionDays <= 0) {
            return;
        }
        long cutoffMillis = System.currentTimeMillis() - (retentionDays * 24L * 60L * 60L * 1000L);
        synchronized (auditLogs) {
            auditLogs.removeIf(log -> log.getCreatedAt() < cutoffMillis);
        }
    }
}

