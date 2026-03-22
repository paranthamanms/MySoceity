package com.mysociety.user.service;

import com.mysociety.user.model.CommunityPost;
import com.mysociety.user.model.UserProfile;
import com.mysociety.user.repository.CommunityPostRepository;
import com.mysociety.user.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommunityPostService {
    
    private static final Logger logger = LoggerFactory.getLogger(CommunityPostService.class);
    
    @Autowired
    private CommunityPostRepository communityPostRepository;
    
    @Autowired
    private UserProfileRepository userProfileRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private SMSService smsService;

    public CommunityPost createPost(CommunityPost post) {
        if (post.getId() == null || post.getId().isEmpty()) {
            post.setId(java.util.UUID.randomUUID().toString());
        }
        post.setCreatedAt(System.currentTimeMillis());
        post.setUpdatedAt(System.currentTimeMillis());
        post.setActive(true);
        post.setLikesCount(0);
        post.setCommentsCount(0);
        
        // Save notification preferences before saving (transient fields)
        boolean shouldSendEmail = post.isSendEmail();
        boolean shouldSendSMS = post.isSendSMS();
        
        // Save post to database
        CommunityPost savedPost = communityPostRepository.save(post);
        
        // Send notifications if requested and post is an announcement
        if ((shouldSendEmail || shouldSendSMS) && "announcement".equalsIgnoreCase(post.getCategory())) {
            sendNotifications(savedPost, shouldSendEmail, shouldSendSMS);
        }
        
        return savedPost;
    }
    
    /**
     * Send email and/or SMS notifications for announcements
     */
    private void sendNotifications(CommunityPost post, boolean sendEmail, boolean sendSMS) {
        try {
            // Get all users from the same society
            List<UserProfile> societyUsers = userProfileRepository.findBySocietyName(post.getSocietyName());
            
            if (societyUsers.isEmpty()) {
                logger.warn("No users found in society: {}", post.getSocietyName());
                return;
            }
            
            logger.info("Sending notifications to {} users in society: {}", societyUsers.size(), post.getSocietyName());
            
            // Send email notifications
            if (sendEmail) {
                List<String> emailAddresses = societyUsers.stream()
                        .map(UserProfile::getEmail)
                        .filter(email -> email != null && !email.isEmpty())
                        .collect(Collectors.toList());
                
                if (!emailAddresses.isEmpty()) {
                    logger.info("Sending email to {} recipients", emailAddresses.size());
                    emailService.sendAnnouncementEmail(
                            emailAddresses,
                            post.getTitle(),
                            post.getContent(),
                            post.getCategory()
                    );
                } else {
                    logger.warn("No valid email addresses found for society: {}", post.getSocietyName());
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
                    String smsContent = post.getTitle();
                    if (post.getContent() != null && !post.getContent().isEmpty()) {
                        smsContent += ": " + post.getContent();
                    }
                    if (smsContent.length() > 100) {
                        smsContent = smsContent.substring(0, 97) + "...";
                    }
                    smsService.sendAnnouncementSMS(
                            phoneNumbers,
                            smsContent,
                            post.getCategory()
                    );
                } else {
                    logger.warn("No valid phone numbers found for society: {}", post.getSocietyName());
                }
            }
            
        } catch (Exception e) {
            logger.error("Failed to send notifications: {}", e.getMessage(), e);
            // Don't throw exception - post was already saved successfully
        }
    }

    public CommunityPost updatePost(String id, CommunityPost post) throws Exception {
        CommunityPost existing = communityPostRepository.findById(id)
                .orElseThrow(() -> new Exception("Post not found"));
        
        existing.setTitle(post.getTitle());
        existing.setContent(post.getContent());
        existing.setCategory(post.getCategory());
        existing.setImageUrls(post.getImageUrls());
        existing.setActive(post.isActive());
        existing.setUpdatedAt(System.currentTimeMillis());
        
        return communityPostRepository.save(existing);
    }

    public CommunityPost likePost(String id) throws Exception {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new Exception("Post not found"));
        
        post.setLikesCount(post.getLikesCount() + 1);
        post.setUpdatedAt(System.currentTimeMillis());
        
        return communityPostRepository.save(post);
    }

    public CommunityPost getPostById(String id) throws Exception {
        return communityPostRepository.findById(id)
                .orElseThrow(() -> new Exception("Post not found"));
    }

    public List<CommunityPost> getAllPosts() {
        return communityPostRepository.findAll();
    }

    public List<CommunityPost> getPostsBySociety(String societyName) {
        return communityPostRepository.findBySocietyName(societyName);
    }

    public List<CommunityPost> getPostsByCategory(String category) {
        return communityPostRepository.findByCategory(category);
    }

    public void deletePost(String id) throws Exception {
        if (!communityPostRepository.findById(id).isPresent()) {
            throw new Exception("Post not found");
        }
        communityPostRepository.deleteById(id);
    }
}

