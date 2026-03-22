package com.NammaSociety.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuditLogClient {

    private final RestTemplate restTemplate;
    private final String auditServiceUrl;
    private final String serviceName;

    public AuditLogClient(RestTemplate restTemplate,
                          @Value("${audit.serviceUrl:http://localhost:8002}") String auditServiceUrl,
                          @Value("${spring.application.name:auth-service}") String serviceName) {
        this.restTemplate = restTemplate;
        this.auditServiceUrl = auditServiceUrl;
        this.serviceName = serviceName;
    }

    public void logAction(String eventType, String userId, String username,
                          String description, String ipAddress, String details) {
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("eventType", eventType);
            payload.put("serviceName", serviceName);
            payload.put("userId", userId);
            payload.put("username", username);
            payload.put("description", description);
            payload.put("ipAddress", ipAddress);
            payload.put("details", details);

            restTemplate.postForEntity(
                auditServiceUrl + "/api/user/audit-logs/log",
                payload,
                Object.class
            );
        } catch (Exception e) {
            System.err.println("[AuditLogClient] Failed to log action: " + e.getMessage());
        }
    }
}

