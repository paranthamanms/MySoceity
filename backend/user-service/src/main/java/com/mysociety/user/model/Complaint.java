package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "complaints")
public class Complaint implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "society_name", nullable = false, length = 255)
    private String societyName;
    
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "category", length = 50)
    private String category; // MAINTENANCE, SECURITY, NOISE, OTHER
    
    @Column(name = "status", nullable = false, length = 50)
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    
    @Column(name = "reporter_id", length = 50)
    private String reporterId;
    
    @Column(name = "reporter_name", length = 255)
    private String reporterName;
    
    @Column(name = "assigned_to", length = 50)
    private String assignedTo;
    
    @ElementCollection
    @CollectionTable(name = "complaint_attachments", joinColumns = @JoinColumn(name = "complaint_id"))
    @Column(name = "attachment_url", length = 500)
    private List<String> attachmentUrls;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;
    
    @Column(name = "resolved_at")
    private long resolvedAt;

    public Complaint() {
        this.attachmentUrls = new ArrayList<>();
    }

    public Complaint(String id, String societyName, String title, String description, 
                    String category, String status, String reporterId, String reporterName,
                    String assignedTo, List<String> attachmentUrls, long createdAt, long updatedAt, long resolvedAt) {
        this.id = id;
        this.societyName = societyName;
        this.title = title;
        this.description = description;
        this.category = category;
        this.status = status;
        this.reporterId = reporterId;
        this.reporterName = reporterName;
        this.assignedTo = assignedTo;
        this.attachmentUrls = attachmentUrls != null ? attachmentUrls : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.resolvedAt = resolvedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSocietyName() { return societyName; }
    public void setSocietyName(String societyName) { this.societyName = societyName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public List<String> getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(List<String> attachmentUrls) { 
        this.attachmentUrls = attachmentUrls != null ? attachmentUrls : new ArrayList<>();
    }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public long getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(long resolvedAt) { this.resolvedAt = resolvedAt; }
}

