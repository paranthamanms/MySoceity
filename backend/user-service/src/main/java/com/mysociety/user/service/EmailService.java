package com.mysociety.user.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for sending email notifications
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${notification.email.from:noreply@nammasociety.com}")
    private String fromEmail;

    @Value("${notification.email.from-name:NammaSociety}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send announcement email to multiple recipients
     */
    public void sendAnnouncementEmail(List<String> recipients, String subject, String content, String announcementType) {
        if (recipients == null || recipients.isEmpty()) {
            logger.warn("No recipients provided for email");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipients.toArray(new String[0]));
            helper.setSubject(subject);
            
            // Create HTML email body with NammaSociety branding
            String htmlBody = buildEmailTemplate(subject, content, announcementType);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            
            logger.info("Successfully sent email to {} recipients", recipients.size());
        } catch (MessagingException e) {
            logger.error("Failed to send email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send email notification", e);
        } catch (Exception e) {
            logger.error("Unexpected error while sending email: {}", e.getMessage(), e);
        }
    }

    /**
     * Send complaint notification email
     */
    public void sendComplaintNotificationEmail(String recipientEmail, String complaintTitle, String complaintDescription, String createdBy) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject("New Complaint Filed: " + complaintTitle);
            
            String htmlBody = buildComplaintEmailTemplate(complaintTitle, complaintDescription, createdBy);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            
            logger.info("Successfully sent complaint notification email to {}", recipientEmail);
        } catch (Exception e) {
            logger.error("Failed to send complaint notification email: {}", e.getMessage(), e);
        }
    }

    /**
     * Build HTML email template for announcements
     */
    private String buildEmailTemplate(String title, String content, String type) {
        String typeColor = getTypeColor(type);
        String typeLabel = type != null ? type.toUpperCase() : "ANNOUNCEMENT";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                    .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
                    .badge { display: inline-block; padding: 6px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 1px; margin-top: 10px; }
                    .content { padding: 40px 30px; }
                    .content h2 { color: #333; font-size: 22px; margin: 0 0 15px 0; }
                    .content p { color: #666; line-height: 1.8; font-size: 15px; margin: 0 0 20px 0; }
                    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
                    .footer p { margin: 5px 0; }
                    .cta-button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>âœ¨ NammaSociety</h1>
                        <p>Smart Living, Simplified</p>
                        <span class="badge">%s</span>
                    </div>
                    <div class="content">
                        <h2>%s</h2>
                        <p>%s</p>
                        <a href="http://localhost:4203" class="cta-button">View in Dashboard</a>
                    </div>
                    <div class="footer">
                        <p><strong>NammaSociety</strong> - Your Smart Society Management Platform</p>
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(typeLabel, title, content);
    }

    /**
     * Build HTML email template for complaints
     */
    private String buildComplaintEmailTemplate(String title, String description, String createdBy) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #f44336 0%%, #e91e63 100%%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                    .badge { display: inline-block; padding: 6px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 1px; margin-top: 10px; }
                    .content { padding: 40px 30px; }
                    .content h2 { color: #333; font-size: 22px; margin: 0 0 15px 0; }
                    .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .info-box p { margin: 5px 0; color: #666; font-size: 14px; }
                    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>âš ï¸ New Complaint</h1>
                        <span class="badge">REQUIRES ATTENTION</span>
                    </div>
                    <div class="content">
                        <h2>%s</h2>
                        <div class="info-box">
                            <p><strong>Description:</strong></p>
                            <p>%s</p>
                            <p style="margin-top: 15px;"><strong>Filed by:</strong> %s</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>NammaSociety</strong> - Your Smart Society Management Platform</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(title, description, createdBy);
    }

    /**
     * Get color based on announcement type
     */
    private String getTypeColor(String type) {
        if (type == null) return "#667eea";
        return switch (type.toLowerCase()) {
            case "urgent" -> "#f44336";
            case "event" -> "#4caf50";
            case "maintenance" -> "#ff9800";
            default -> "#667eea";
        };
    }
}

