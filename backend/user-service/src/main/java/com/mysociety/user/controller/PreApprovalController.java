package com.mysociety.user.controller;

import com.mysociety.user.model.PreApproval;
import com.mysociety.user.service.PreApprovalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/pre-approvals")
@CrossOrigin(origins = "*")
public class PreApprovalController {
    
    private static final Logger logger = LoggerFactory.getLogger(PreApprovalController.class);
    
    @Autowired
    private PreApprovalService preApprovalService;
    
    /**
     * Create a new pre-approval
     * POST /api/pre-approvals
     */
    @PostMapping
    public ResponseEntity<?> createPreApproval(@RequestBody PreApproval preApproval) {
        try {
            PreApproval created = preApprovalService.createPreApproval(preApproval);
            logger.info("Pre-approval created: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            logger.error("Error creating pre-approval", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create pre-approval: " + e.getMessage()));
        }
    }
    
    /**
     * Get all pre-approvals for an apartment
     * GET /api/pre-approvals?apartmentNumber=A101&societyName=XYZ
     */
    @GetMapping
    public ResponseEntity<?> getPreApprovals(
            @RequestParam(required = false) String apartmentNumber,
            @RequestParam String societyName) {
        try {
            List<PreApproval> preApprovals;
            if (apartmentNumber != null && !apartmentNumber.isEmpty()) {
                preApprovals = preApprovalService.getPreApprovalsForApartment(
                    apartmentNumber, societyName);
            } else {
                preApprovals = preApprovalService.getPreApprovalsForSociety(societyName);
            }
            return ResponseEntity.ok(preApprovals);
        } catch (Exception e) {
            logger.error("Error fetching pre-approvals", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch pre-approvals: " + e.getMessage()));
        }
    }
    
    /**
     * Get currently active pre-approvals
     * GET /api/pre-approvals/active?apartmentNumber=A101&societyName=XYZ
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActivePreApprovals(
            @RequestParam(required = false) String apartmentNumber,
            @RequestParam String societyName) {
        try {
            List<PreApproval> preApprovals;
            if (apartmentNumber != null && !apartmentNumber.isEmpty()) {
                preApprovals = preApprovalService.getActivePreApprovals(
                    apartmentNumber, societyName);
            } else {
                preApprovals = preApprovalService.getActivePreApprovalsForSociety(societyName);
            }
            return ResponseEntity.ok(preApprovals);
        } catch (Exception e) {
            logger.error("Error fetching active pre-approvals", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch active pre-approvals: " + e.getMessage()));
        }
    }
    
    /**
     * Check if a visitor is pre-approved by phone
     * GET /api/pre-approvals/check?phone=1234567890&societyName=XYZ
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkPreApproval(
            @RequestParam String phone,
            @RequestParam String societyName) {
        try {
            List<PreApproval> preApprovals = preApprovalService.checkPreApprovalByPhone(
                phone, societyName);
            return ResponseEntity.ok(Map.of(
                "preApproved", !preApprovals.isEmpty(),
                "approvals", preApprovals
            ));
        } catch (Exception e) {
            logger.error("Error checking pre-approval", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to check pre-approval: " + e.getMessage()));
        }
    }
    
    /**
     * Revoke a pre-approval
     * DELETE /api/pre-approvals/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> revokePreApproval(
            @PathVariable Long id,
            @RequestParam String userId) {
        try {
            boolean revoked = preApprovalService.revokePreApproval(id, userId);
            if (revoked) {
                return ResponseEntity.ok(Map.of("message", "Pre-approval revoked successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Pre-approval not found"));
            }
        } catch (Exception e) {
            logger.error("Error revoking pre-approval", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to revoke pre-approval: " + e.getMessage()));
        }
    }
    
    /**
     * Get a specific pre-approval by ID
     * GET /api/pre-approvals/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPreApprovalById(@PathVariable Long id) {
        try {
            Optional<PreApproval> preApproval = preApprovalService.getPreApprovalById(id);
            if (preApproval.isPresent()) {
                return ResponseEntity.ok(preApproval.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Pre-approval not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching pre-approval", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch pre-approval: " + e.getMessage()));
        }
    }
}

