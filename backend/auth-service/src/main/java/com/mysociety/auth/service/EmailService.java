package com.NammaSociety.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service for sending email notifications
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${notification.email.from:noreply@NammaSociety.com}")
    private String fromEmail;

    @Value("${notification.email.from-name:NammaSociety}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send OTP via email
     */
    public void sendOTP(String recipientEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject("Your NammaSociety OTP Code");
            
            String htmlBody = buildOTPEmailTemplate(otp);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            
            logger.info("âœ… OTP email sent successfully to {}", recipientEmail);
        } catch (MessagingException e) {
            logger.error("âŒ Failed to send OTP email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP email", e);
        } catch (Exception e) {
            logger.error("âŒ Unexpected error while sending OTP email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    /**
     * Build HTML email template for OTP
     */
    private String buildOTPEmailTemplate(String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        background-color: #f5f5f5; 
                        margin: 0; 
                        padding: 20px; 
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background: white; 
                        border-radius: 12px; 
                        overflow: hidden; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                    }
                    .header { 
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
                        padding: 30px; 
                        text-align: center; 
                        color: white; 
                    }
                    .header h1 { 
                        margin: 0; 
                        font-size: 28px; 
                        font-weight: 600; 
                    }
                    .header p { 
                        margin: 5px 0 0 0; 
                        font-size: 14px; 
                        opacity: 0.9; 
                    }
                    .content { 
                        padding: 40px 30px; 
                        text-align: center; 
                    }
                    .content h2 { 
                        color: #333; 
                        font-size: 22px; 
                        margin: 0 0 15px 0; 
                    }
                    .content p { 
                        color: #666; 
                        line-height: 1.8; 
                        font-size: 15px; 
                        margin: 0 0 20px 0; 
                    }
                    .otp-box { 
                        background: linear-gradient(135deg, #f093fb 0%%, #f5576c 100%%); 
                        padding: 20px; 
                        border-radius: 8px; 
                        margin: 30px 0; 
                    }
                    .otp-code { 
                        font-size: 36px; 
                        font-weight: 700; 
                        letter-spacing: 8px; 
                        color: white; 
                        margin: 0; 
                    }
                    .warning { 
                        background: #fff3cd; 
                        border-left: 4px solid #ffc107; 
                        padding: 15px; 
                        margin: 20px 0; 
                        text-align: left; 
                    }
                    .warning p { 
                        margin: 0; 
                        color: #856404; 
                        font-size: 14px; 
                    }
                    .footer { 
                        background: #f8f9fa; 
                        padding: 20px 30px; 
                        text-align: center; 
                        color: #999; 
                        font-size: 12px; 
                    }
                    .footer p { 
                        margin: 5px 0; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ðŸ”’ NammaSociety</h1>
                        <p>Secure Authentication</p>
                    </div>
                    <div class="content">
                        <h2>Your One-Time Password</h2>
                        <p>Use this OTP to complete your login or password reset:</p>
                        
                        <div class="otp-box">
                            <p class="otp-code">%s</p>
                        </div>
                        
                        <p style="font-size: 13px; color: #999;">This OTP is valid for <strong>5 minutes</strong></p>
                        
                        <div class="warning">
                            <p>âš ï¸ <strong>Security Notice:</strong></p>
                            <p>Never share this OTP with anyone. NammaSociety staff will never ask for your OTP.</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>NammaSociety</strong> - Your Smart Society Management Platform</p>
                        <p>This is an automated email. Please do not reply.</p>
                        <p style="margin-top: 10px;">If you didn't request this OTP, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(otp);
    }
}

