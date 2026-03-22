package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "announcements")
public class Announcement implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "society_name", nullable = false, length = 255)
    private String societyName;
    
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "priority", length = 20)
    private String priority; // LOW, MEDIUM, HIGH
    
    @Column(name = "author_id", length = 50)
    private String authorId;
    
    @Column(name = "author_name", length = 255)
    private String authorName;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;
    
    @Column(name = "active", nullable = false)
    private boolean active;

    // Transient fields for notification preferences (not stored in DB)
    @Transient
    private boolean sendEmail;
    
    @Transient
    private boolean sendSMS;

    public Announcement() {
        this.sendEmail = false;
        this.sendSMS = false;
    }

    public Announcement(String id, String societyName, String title, String content, 
                       String priority, String authorId, String authorName, 
                       long createdAt, long updatedAt, boolean active) {
        this.id = id;
        this.societyName = societyName;
        this.title = title;
        this.content = content;
        this.priority = priority;
        this.authorId = authorId;
        this.authorName = authorName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.active = active;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSocietyName() { return societyName; }
    public void setSocietyName(String societyName) { this.societyName = societyName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isSendEmail() { return sendEmail; }
    public void setSendEmail(boolean sendEmail) { this.sendEmail = sendEmail; }

    public boolean isSendSMS() { return sendSMS; }
    public void setSendSMS(boolean sendSMS) { this.sendSMS = sendSMS; }
}

