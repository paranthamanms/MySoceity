package com.mysociety.user.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pre_approvals", indexes = {
    @Index(name = "idx_apartment_society", columnList = "apartment_number, society_name"),
    @Index(name = "idx_status_pre_approvals", columnList = "status"),
    @Index(name = "idx_valid_dates", columnList = "valid_from, valid_until")
})
public class PreApproval {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "apartment_number", nullable = false, length = 50)
    private String apartmentNumber;
    
    @Column(name = "society_name", nullable = false)
    private String societyName;
    
    @Column(name = "visitor_type", nullable = false, length = 50)
    private String visitorType; // GUEST, CAB, DELIVERY, VISITING_HELP, VENDOR
    
    @Column(name = "visitor_name", nullable = false)
    private String visitorName;
    
    @Column(name = "visitor_phone", length = 20)
    private String visitorPhone;
    
    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;
    
    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "created_by", nullable = false)
    private String createdBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "status", length = 20)
    private String status; // ACTIVE, EXPIRED, REVOKED
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getApartmentNumber() {
        return apartmentNumber;
    }
    
    public void setApartmentNumber(String apartmentNumber) {
        this.apartmentNumber = apartmentNumber;
    }
    
    public String getSocietyName() {
        return societyName;
    }
    
    public void setSocietyName(String societyName) {
        this.societyName = societyName;
    }
    
    public String getVisitorType() {
        return visitorType;
    }
    
    public void setVisitorType(String visitorType) {
        this.visitorType = visitorType;
    }
    
    public String getVisitorName() {
        return visitorName;
    }
    
    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }
    
    public String getVisitorPhone() {
        return visitorPhone;
    }
    
    public void setVisitorPhone(String visitorPhone) {
        this.visitorPhone = visitorPhone;
    }
    
    public LocalDateTime getValidFrom() {
        return validFrom;
    }
    
    public void setValidFrom(LocalDateTime validFrom) {
        this.validFrom = validFrom;
    }
    
    public LocalDateTime getValidUntil() {
        return validUntil;
    }
    
    public void setValidUntil(LocalDateTime validUntil) {
        this.validUntil = validUntil;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
}

