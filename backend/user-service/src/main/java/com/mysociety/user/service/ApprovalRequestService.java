package com.mysociety.user.service;

import com.mysociety.user.model.ApprovalLog;
import com.mysociety.user.model.ApprovalRequest;
import com.mysociety.user.model.PreApproval;
import com.mysociety.user.repository.ApprovalLogRepository;
import com.mysociety.user.repository.ApprovalRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ApprovalRequestService {
    
    private static final Logger logger = LoggerFactory.getLogger(ApprovalRequestService.class);
    
    @Autowired
    private ApprovalRequestRepository approvalRequestRepository;
    
    @Autowired
    private ApprovalLogRepository approvalLogRepository;
    
    @Autowired
    private SMSService smsService;
    
    @Autowired
    private PreApprovalService preApprovalService;
    
    /**
     * Create new approval request and send SMS notification
     */
    @Transactional
    public ApprovalRequest createApprovalRequest(ApprovalRequest request, String residentPhone) {
        logger.info("Creating approval request for {} at apartment {}", 
            request.getVisitorName(), request.getApartmentNumber());
        
        // Check if visitor is pre-approved
        List<PreApproval> preApprovals = preApprovalService.checkPreApprovalByPhone(
            request.getVisitorPhone(), request.getSocietyName());
        
        ApprovalRequest savedRequest = approvalRequestRepository.save(request);
        
        // Send SMS notification to resident
        if (residentPhone != null && !residentPhone.isEmpty()) {
            String message = String.format(
                "Guest Approval Request:\n" +
                "Visitor: %s\n" +
                "Type: %s\n" +
                "Apartment: %s\n" +
                "Requested by: %s\n" +
                "Reply APPROVE-%d to approve or REJECT-%d to reject",
                request.getVisitorName(),
                request.getVisitorType(),
                request.getApartmentNumber(),
                request.getRequestedBy(),
                savedRequest.getId(),
                savedRequest.getId()
            );
            
            smsService.sendSMS(residentPhone, message);
            logger.info("Approval request SMS sent to {}", residentPhone);
        }
        
        // If pre-approved, auto-approve
        if (!preApprovals.isEmpty()) {
            PreApproval preApproval = preApprovals.get(0);
            approveRequest(savedRequest.getId(), "System (Pre-Approved)", 
                "DASHBOARD", "Auto-approved based on pre-approval");
            logger.info("Request auto-approved based on pre-approval {}", preApproval.getId());
        }
        
        return savedRequest;
    }
    
    /**
     * Approve an approval request
     */
    @Transactional
    public boolean approveRequest(Long requestId, String approvedBy, 
                                  String approvalMethod, String note) {
        Optional<ApprovalRequest> requestOpt = approvalRequestRepository.findById(requestId);
        if (requestOpt.isPresent()) {
            ApprovalRequest request = requestOpt.get();
            request.setStatus("APPROVED");
            request.setRespondedBy(approvedBy);
            request.setRespondedAt(LocalDateTime.now());
            request.setResponseNote(note);
            approvalRequestRepository.save(request);
            
            // Create approval log
            ApprovalLog log = new ApprovalLog();
            log.setApartmentNumber(request.getApartmentNumber());
            log.setSocietyName(request.getSocietyName());
            log.setTower(request.getTower());
            log.setVisitorType(request.getVisitorType());
            log.setVisitorName(request.getVisitorName());
            log.setVisitorPhone(request.getVisitorPhone());
            log.setVisitorAadhaar(request.getVisitorAadhaar());
            log.setServiceSubCategory(request.getServiceSubCategory());
            log.setOwnerName(request.getOwnerName());
            log.setOwnerPhone(request.getOwnerPhone());
            log.setFaceCapture(request.getFaceCapture());
            log.setScannerCode(request.getScannerCode());
            log.setScannerSource(request.getScannerSource());
            log.setEntryType("REQUEST_APPROVED");
            log.setApprovalMethod(approvalMethod);
            log.setApprovedBy(approvedBy);
            log.setSecurityGuard(request.getRequestedBy());
            log.setNotes(note);
            log.setRequestId(requestId);
            approvalLogRepository.save(log);
            
            logger.info("Approval request {} approved by {}", requestId, approvedBy);
            return true;
        }
        return false;
    }
    
    /**
     * Reject an approval request
     */
    @Transactional
    public boolean rejectRequest(Long requestId, String rejectedBy, String note) {
        Optional<ApprovalRequest> requestOpt = approvalRequestRepository.findById(requestId);
        if (requestOpt.isPresent()) {
            ApprovalRequest request = requestOpt.get();
            request.setStatus("REJECTED");
            request.setRespondedBy(rejectedBy);
            request.setRespondedAt(LocalDateTime.now());
            request.setResponseNote(note);
            approvalRequestRepository.save(request);
            
            logger.info("Approval request {} rejected by {}", requestId, rejectedBy);
            return true;
        }
        return false;
    }
    
    /**
     * Get pending approval requests for an apartment
     */
    public List<ApprovalRequest> getPendingRequestsForApartment(
            String apartmentNumber, String societyName) {
        return approvalRequestRepository.findByApartmentNumberAndSocietyNameAndStatus(
            apartmentNumber, societyName, "PENDING");
    }
    
    /**
     * Get all approval requests for an apartment
     */
    public List<ApprovalRequest> getAllRequestsForApartment(
            String apartmentNumber, String societyName) {
        return approvalRequestRepository.findByApartmentNumberAndSocietyNameOrderByRequestedAtDesc(
            apartmentNumber, societyName);
    }
    
    /**
     * Get all approval requests for a society (for security dashboard)
     */
    public List<ApprovalRequest> getAllRequestsForSociety(String societyName) {
        return approvalRequestRepository.findBySocietyNameOrderByRequestedAtDesc(societyName);
    }
}

