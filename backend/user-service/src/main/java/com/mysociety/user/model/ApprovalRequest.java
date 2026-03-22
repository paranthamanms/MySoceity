package com.mysociety.user.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "approval_requests", indexes = {
    @Index(name = "idx_apartment", columnList = "apartment_number, society_name"),
    @Index(name = "idx_status_approval_requests", columnList = "status"),
    @Index(name = "idx_requested_at", columnList = "requested_at")
})
public class ApprovalRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "apartment_number", nullable = false, length = 50)
    private String apartmentNumber;
    
    @Column(name = "society_name", nullable = false)
    private String societyName;
    
    @Column(name = "tower", length = 50)
    private String tower;
    
    @Column(name = "visitor_type", nullable = false, length = 50)
    private String visitorType;
    
    @Column(name = "visitor_name", nullable = false)
    private String visitorName;
    
    @Column(name = "visitor_phone", length = 20)
    private String visitorPhone;

    
    @Column(name = "visitor_id_proof")
    private String visitorIdProof;

    @Column(name = "visitor_aadhaar", length = 20)
    private String visitorAadhaar;

    @Column(name = "service_sub_category", length = 100)
    private String serviceSubCategory;

    @Column(name = "owner_name", length = 150)
    private String ownerName;

    @Column(name = "owner_phone", length = 20)
    private String ownerPhone;

    @Column(name = "face_capture", columnDefinition = "TEXT")
    private String faceCapture;

    @Column(name = "scanner_code", length = 120)
    private String scannerCode;

    @Column(name = "scanner_source", length = 30)
    private String scannerSource;
    
    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;
    
    @Column(name = "requested_by", nullable = false)
    private String requestedBy; // Security guard name
    
    @Column(name = "requested_at")
    private LocalDateTime requestedAt;
    
    @Column(name = "status", length = 20)
    private String status; // PENDING, APPROVED, REJECTED
    
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
    
    @Column(name = "responded_by")
    private String respondedBy;
    
    @Column(name = "response_note", columnDefinition = "TEXT")
    private String responseNote;
    
    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
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
    
    public String getTower() {
        return tower;
    }
    
    public void setTower(String tower) {
        this.tower = tower;
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

    
    public String getVisitorIdProof() {
        return visitorIdProof;
    }
    
    public void setVisitorIdProof(String visitorIdProof) {
        this.visitorIdProof = visitorIdProof;
    }

    public String getVisitorAadhaar() {
        return visitorAadhaar;
    }

    public void setVisitorAadhaar(String visitorAadhaar) {
        this.visitorAadhaar = visitorAadhaar;
    }

    public String getServiceSubCategory() {
        return serviceSubCategory;
    }

    public void setServiceSubCategory(String serviceSubCategory) {
        this.serviceSubCategory = serviceSubCategory;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerPhone() {
        return ownerPhone;
    }

    public void setOwnerPhone(String ownerPhone) {
        this.ownerPhone = ownerPhone;
    }

    public String getFaceCapture() {
        return faceCapture;
    }

    public void setFaceCapture(String faceCapture) {
        this.faceCapture = faceCapture;
    }

    public String getScannerCode() {
        return scannerCode;
    }

    public void setScannerCode(String scannerCode) {
        this.scannerCode = scannerCode;
    }

    public String getScannerSource() {
        return scannerSource;
    }

    public void setScannerSource(String scannerSource) {
        this.scannerSource = scannerSource;
    }
    
    public String getPurpose() {
        return purpose;
    }
    
    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
    
    public String getRequestedBy() {
        return requestedBy;
    }
    
    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }
    
    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }
    
    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }
    
    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }
    
    public String getRespondedBy() {
        return respondedBy;
    }
    
    public void setRespondedBy(String respondedBy) {
        this.respondedBy = respondedBy;
    }
    
    public String getResponseNote() {
        return responseNote;
    }
    
    public void setResponseNote(String responseNote) {
        this.responseNote = responseNote;
    }
}

