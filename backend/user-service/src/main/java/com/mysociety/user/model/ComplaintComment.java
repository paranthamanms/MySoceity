package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "complaint_comments")
public class ComplaintComment implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "complaint_id", nullable = false, length = 50)
    private String complaintId;
    
    @Column(name = "author_id", length = 50)
    private String authorId;
    
    @Column(name = "author_name", nullable = false, length = 255)
    private String authorName;
    
    @Column(name = "author_role", length = 50)
    private String authorRole; // USER, SOCIETY_ADMIN, SUPER_ADMIN
    
    @Column(name = "comment_text", columnDefinition = "TEXT", nullable = false)
    private String commentText;
    
    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;
    
    @Column(name = "is_resolution", nullable = false)
    private boolean isResolution; // True if this comment marks the complaint as resolved
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    public ComplaintComment() {}

    public ComplaintComment(String id, String complaintId, String authorId, String authorName,
                          String authorRole, String commentText, String attachmentUrl,
                          boolean isResolution, long createdAt, long updatedAt) {
        this.id = id;
        this.complaintId = complaintId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorRole = authorRole;
        this.commentText = commentText;
        this.attachmentUrl = attachmentUrl;
        this.isResolution = isResolution;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public String getCommentText() { return commentText; }
    public void setCommentText(String commentText) { this.commentText = commentText; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public boolean isResolution() { return isResolution; }
    public void setResolution(boolean resolution) { isResolution = resolution; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}

