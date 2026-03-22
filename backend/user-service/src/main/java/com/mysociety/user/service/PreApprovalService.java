package com.mysociety.user.service;

import com.mysociety.user.model.PreApproval;
import com.mysociety.user.repository.PreApprovalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PreApprovalService {
    
    private static final Logger logger = LoggerFactory.getLogger(PreApprovalService.class);
    
    @Autowired
    private PreApprovalRepository preApprovalRepository;
    
    /**
     * Create a new pre-approval
     */
    @Transactional
    public PreApproval createPreApproval(PreApproval preApproval) {
        logger.info("Creating pre-approval for {} at apartment {}", 
            preApproval.getVisitorName(), preApproval.getApartmentNumber());
        preApproval.setStatus("ACTIVE");
        return preApprovalRepository.save(preApproval);
    }
    
    /**
     * Get all pre-approvals for an apartment
     */
    public List<PreApproval> getPreApprovalsForApartment(String apartmentNumber, String societyName) {
        return preApprovalRepository.findByApartmentNumberAndSocietyNameAndStatus(
            apartmentNumber, societyName, "ACTIVE");
    }

    /**
     * Get all active pre-approvals for a society
     */
    public List<PreApproval> getPreApprovalsForSociety(String societyName) {
        return preApprovalRepository.findBySocietyNameAndStatus(societyName, "ACTIVE");
    }
    
    /**
     * Get all active pre-approvals that are currently valid
     */
    public List<PreApproval> getActivePreApprovals(String apartmentNumber, String societyName) {
        return preApprovalRepository.findActivePreApprovals(
            apartmentNumber, societyName, LocalDateTime.now());
    }

    /**
     * Get all currently valid pre-approvals for a society
     */
    public List<PreApproval> getActivePreApprovalsForSociety(String societyName) {
        return preApprovalRepository.findActivePreApprovalsForSociety(
            societyName, LocalDateTime.now());
    }
    
    /**
     * Check if a visitor is pre-approved by phone number
     */
    public List<PreApproval> checkPreApprovalByPhone(String phone, String societyName) {
        return preApprovalRepository.findActivePreApprovalsByPhone(
            phone, societyName, LocalDateTime.now());
    }
    
    /**
     * Revoke a pre-approval
     */
    @Transactional
    public boolean revokePreApproval(Long id, String userId) {
        Optional<PreApproval> preApprovalOpt = preApprovalRepository.findById(id);
        if (preApprovalOpt.isPresent()) {
            PreApproval preApproval = preApprovalOpt.get();
            preApproval.setStatus("REVOKED");
            preApprovalRepository.save(preApproval);
            logger.info("Pre-approval {} revoked by {}", id, userId);
            return true;
        }
        return false;
    }
    
    /**
     * Update expired pre-approvals - called periodically
     */
    @Transactional
    public void updateExpiredPreApprovals() {
        // This would typically be called by a scheduled task
        List<PreApproval> allActive = preApprovalRepository.findBySocietyNameAndStatus("", "ACTIVE");
        LocalDateTime now = LocalDateTime.now();
        
        for (PreApproval preApproval : allActive) {
            if (preApproval.getValidUntil().isBefore(now)) {
                preApproval.setStatus("EXPIRED");
                preApprovalRepository.save(preApproval);
            }
        }
    }
    
    /**
     * Get pre-approval by ID
     */
    public Optional<PreApproval> getPreApprovalById(Long id) {
        return preApprovalRepository.findById(id);
    }
}

