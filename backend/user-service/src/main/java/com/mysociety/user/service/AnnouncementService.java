package com.mysociety.user.service;

import com.mysociety.user.model.Announcement;
import com.mysociety.user.model.UserProfile;
import com.mysociety.user.repository.AnnouncementRepository;
import com.mysociety.user.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {
    
    private static final Logger logger = LoggerFactory.getLogger(AnnouncementService.class);
    
    @Autowired
    private AnnouncementRepository announcementRepository;
    
    @Autowired
    private UserProfileRepository userProfileRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SMSService smsService;

    public Announcement createAnnouncement(Announcement announcement) {
        if (announcement.getId() == null || announcement.getId().isEmpty()) {
            announcement.setId(java.util.UUID.randomUUID().toString());
        }
        announcement.setCreatedAt(System.currentTimeMillis());
        announcement.setUpdatedAt(System.currentTimeMillis());
        announcement.setActive(true);
        
        // Save notification preferences before saving (transient fields)
        boolean shouldSendEmail = announcement.isSendEmail();
        boolean shouldSendSMS = announcement.isSendSMS();
        
        // Save announcement to database
        Announcement savedAnnouncement = announcementRepository.save(announcement);
        
        // Send notifications if requested
        if (shouldSendEmail || shouldSendSMS) {
            sendNotifications(savedAnnouncement, shouldSendEmail, shouldSendSMS);
        }
        
        return savedAnnouncement;
    }
    
    /**
     * Send email and/or SMS notifications for announcements
     */
    private void sendNotifications(Announcement announcement, boolean sendEmail, boolean sendSMS) {
        try {
            // Get all users from the same society
            List<UserProfile> societyUsers = userProfileRepository.findBySocietyName(announcement.getSocietyName());
            
            if (societyUsers.isEmpty()) {
                logger.warn("No users found in society: {}", announcement.getSocietyName());
                return;
            }
            
            logger.info("Sending announcement notifications to {} users in society: {}", 
                    societyUsers.size(), announcement.getSocietyName());
            
            // Send email notifications
            if (sendEmail) {
                List<String> emailAddresses = societyUsers.stream()
                        .map(UserProfile::getEmail)
                        .filter(email -> email != null && !email.isEmpty())
                        .collect(Collectors.toList());
                
                if (!emailAddresses.isEmpty()) {
                    logger.info("Sending email to {} recipients", emailAddresses.size());
                    String subject = "[" + (announcement.getPriority() != null ? 
                            announcement.getPriority().toUpperCase() : "MEDIUM") + 
                            "] " + announcement.getTitle();
                    emailService.sendAnnouncementEmail(
                            emailAddresses,
                            subject,
                            announcement.getContent(),
                            "announcement"
                    );
                } else {
                    logger.warn("No valid email addresses found for society: {}", announcement.getSocietyName());
                }
            }
            
            // Send SMS notifications
            if (sendSMS && smsService.isEnabled()) {
                List<String> phoneNumbers = societyUsers.stream()
                        .map(UserProfile::getPhoneNumber)
                        .filter(phone -> phone != null && !phone.isEmpty())
                        .collect(Collectors.toList());
                
                if (!phoneNumbers.isEmpty()) {
                    logger.info("Sending SMS to {} recipients", phoneNumbers.size());
                    // Truncate content for SMS (max 100 chars)
                    String smsContent = announcement.getTitle();
                    if (announcement.getContent() != null && !announcement.getContent().isEmpty()) {
                        smsContent += ": " + announcement.getContent();
                    }
                    if (smsContent.length() > 100) {
                        smsContent = smsContent.substring(0, 97) + "...";
                    }
                    smsService.sendAnnouncementSMS(
                            phoneNumbers,
                            smsContent,
                            announcement.getPriority()
                    );
                } else {
                    logger.warn("No valid phone numbers found for society: {}", announcement.getSocietyName());
                }
            }
            
        } catch (Exception e) {
            logger.error("Failed to send announcement notifications: {}", e.getMessage(), e);
            // Don't throw exception - announcement was already saved successfully
        }
    }

    public Announcement updateAnnouncement(String id, Announcement announcement) throws Exception {
        Announcement existing = announcementRepository.findById(id)
                .orElseThrow(() -> new Exception("Announcement not found"));
        
        existing.setTitle(announcement.getTitle());
        existing.setContent(announcement.getContent());
        existing.setPriority(announcement.getPriority());
        existing.setActive(announcement.isActive());
        existing.setUpdatedAt(System.currentTimeMillis());
        
        return announcementRepository.save(existing);
    }

    public Announcement getAnnouncementById(String id) throws Exception {
        return announcementRepository.findById(id)
                .orElseThrow(() -> new Exception("Announcement not found"));
    }

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllActive();
    }

    public List<Announcement> getAnnouncementsBySociety(String societyName) {
        return announcementRepository.findBySocietyName(societyName);
    }

    public void deleteAnnouncement(String id) throws Exception {
        if (!announcementRepository.findById(id).isPresent()) {
            throw new Exception("Announcement not found");
        }
        announcementRepository.deleteById(id);
    }
}

