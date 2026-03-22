package com.mysociety.user.controller;

import com.mysociety.user.model.ApprovalRequest;
import com.mysociety.user.service.ApprovalRequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approval-requests")
@CrossOrigin(origins = "*")
public class ApprovalRequestController {
    
    private static final Logger logger = LoggerFactory.getLogger(ApprovalRequestController.class);
    
    @Autowired
    private ApprovalRequestService approvalRequestService;
    
    /**
     * Create a new approval request (Security raises request)
     * POST /api/approval-requests
     */
    @PostMapping
    public ResponseEntity<?> createApprovalRequest(
            @RequestBody Map<String, Object> requestData) {
        try {
            ApprovalRequest request = new ApprovalRequest();
            request.setApartmentNumber((String) requestData.get("apartmentNumber"));
            request.setSocietyName((String) requestData.get("societyName"));
            request.setTower((String) requestData.get("tower"));
            request.setVisitorType((String) requestData.get("visitorType"));
            request.setVisitorName((String) requestData.get("visitorName"));
            request.setVisitorPhone((String) requestData.get("visitorPhone"));
            request.setVisitorIdProof((String) requestData.get("visitorIdProof"));
            request.setVisitorAadhaar((String) requestData.get("visitorAadhaar"));
            request.setServiceSubCategory((String) requestData.get("serviceSubCategory"));
            request.setOwnerName((String) requestData.get("ownerName"));
            request.setOwnerPhone((String) requestData.get("ownerPhone"));
            request.setFaceCapture((String) requestData.get("faceCapture"));
            request.setScannerCode((String) requestData.get("scannerCode"));
            request.setScannerSource((String) requestData.get("scannerSource"));
            request.setPurpose((String) requestData.get("purpose"));
            request.setRequestedBy((String) requestData.get("requestedBy"));
            
            String residentPhone = (String) requestData.get("residentPhone");
            if (residentPhone == null || residentPhone.isEmpty()) {
                residentPhone = request.getOwnerPhone();
            }
            
            ApprovalRequest created = approvalRequestService.createApprovalRequest(
                request, residentPhone);
            
            logger.info("Approval request created: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            logger.error("Error creating approval request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create approval request: " + e.getMessage()));
        }
    }
    
    /**
     * Get pending approval requests for an apartment
     * GET /api/approval-requests/pending?apartmentNumber=A101&societyName=XYZ
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(
            @RequestParam String apartmentNumber,
            @RequestParam String societyName) {
        try {
            List<ApprovalRequest> requests = approvalRequestService.getPendingRequestsForApartment(
                apartmentNumber, societyName);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            logger.error("Error fetching pending requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch pending requests: " + e.getMessage()));
        }
    }
    
    /**
     * Get all approval requests for an apartment
     * GET /api/approval-requests?apartmentNumber=A101&societyName=XYZ
     */
    @GetMapping
    public ResponseEntity<?> getAllRequests(
            @RequestParam(required = false) String apartmentNumber,
            @RequestParam String societyName) {
        try {
            List<ApprovalRequest> requests;
            if (apartmentNumber != null && !apartmentNumber.isEmpty()) {
                requests = approvalRequestService.getAllRequestsForApartment(
                    apartmentNumber, societyName);
            } else {
                // For security dashboard - all requests for the society
                requests = approvalRequestService.getAllRequestsForSociety(societyName);
            }
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            logger.error("Error fetching approval requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch approval requests: " + e.getMessage()));
        }
    }
    
    /**
     * Approve an approval request
     * POST /api/approval-requests/{id}/approve
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {
        try {
            String approvedBy = data.get("approvedBy");
            String approvalMethod = data.getOrDefault("approvalMethod", "DASHBOARD");
            String note = data.getOrDefault("note", "");
            
            boolean approved = approvalRequestService.approveRequest(
                id, approvedBy, approvalMethod, note);
            
            if (approved) {
                return ResponseEntity.ok(Map.of("message", "Request approved successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Approval request not found"));
            }
        } catch (Exception e) {
            logger.error("Error approving request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to approve request: " + e.getMessage()));
        }
    }
    
    /**
     * Reject an approval request
     * POST /api/approval-requests/{id}/reject
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {
        try {
            String rejectedBy = data.get("rejectedBy");
            String note = data.getOrDefault("note", "");
            
            boolean rejected = approvalRequestService.rejectRequest(id, rejectedBy, note);
            
            if (rejected) {
                return ResponseEntity.ok(Map.of("message", "Request rejected successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Approval request not found"));
            }
        } catch (Exception e) {
            logger.error("Error rejecting request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to reject request: " + e.getMessage()));
        }
    }
}

