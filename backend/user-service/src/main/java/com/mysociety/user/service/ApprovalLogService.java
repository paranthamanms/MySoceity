package com.mysociety.user.service;

import com.mysociety.user.model.ApprovalLog;
import com.mysociety.user.repository.ApprovalLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ApprovalLogService {
    
    private static final Logger logger = LoggerFactory.getLogger(ApprovalLogService.class);
    
    @Autowired
    private ApprovalLogRepository approvalLogRepository;
    
    /**
     * Create approval log entry (used when pre-approved visitor enters)
     */
    @Transactional
    public ApprovalLog createLogEntry(ApprovalLog log) {
        logger.info("Creating approval log for {} at apartment {}", 
            log.getVisitorName(), log.getApartmentNumber());
        return approvalLogRepository.save(log);
    }
    
    /**
     * Get all approval logs for a society
     */
    public List<ApprovalLog> getLogsForSociety(String societyName) {
        return approvalLogRepository.findBySocietyNameOrderByEntryTimeDesc(societyName);
    }
    
    /**
     * Get approval logs for an apartment
     */
    public List<ApprovalLog> getLogsForApartment(String apartmentNumber, String societyName) {
        return approvalLogRepository.findByApartmentNumberAndSocietyNameOrderByEntryTimeDesc(
            apartmentNumber, societyName);
    }
    
    /**
     * Get logs for a date range
     */
    public List<ApprovalLog> getLogsByDateRange(String societyName, 
                                                 LocalDateTime startDate, 
                                                 LocalDateTime endDate) {
        return approvalLogRepository.findBySocietyAndDateRange(societyName, startDate, endDate);
    }
    
    /**
     * Get currently active visitors (who haven't exited yet)
     */
    public List<ApprovalLog> getActiveVisitors(String societyName) {
        return approvalLogRepository.findActiveVisitors(societyName);
    }
    
    /**
     * Mark visitor exit
     */
    @Transactional
    public boolean markExit(Long logId,
                            String securityGuard,
                            String exitMethod,
                            String exitFaceCapture,
                            Double exitMatchConfidence) {
        Optional<ApprovalLog> logOpt = approvalLogRepository.findById(logId);
        if (logOpt.isPresent()) {
            ApprovalLog log = logOpt.get();
            log.setExitTime(LocalDateTime.now());
            if (securityGuard != null) {
                log.setSecurityGuard(securityGuard);
            }
            if (exitMethod != null && !exitMethod.isBlank()) {
                log.setExitMethod(exitMethod.trim());
            }
            if (exitFaceCapture != null && !exitFaceCapture.isBlank()) {
                log.setExitFaceCapture(exitFaceCapture);
            }
            if (exitMatchConfidence != null) {
                log.setExitMatchConfidence(exitMatchConfidence);
            }
            approvalLogRepository.save(log);
            logger.info("Marked exit for log {}", logId);
            return true;
        }
        return false;
    }
}

