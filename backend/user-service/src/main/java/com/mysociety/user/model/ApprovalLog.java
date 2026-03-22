package com.mysociety.user.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "approval_logs", indexes = {
    @Index(name = "idx_apartment_logs", columnList = "apartment_number, society_name"),
    @Index(name = "idx_entry_time", columnList = "entry_time"),
    @Index(name = "idx_visitor_type", columnList = "visitor_type")
})
public class ApprovalLog {
    
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
    
    @Column(name = "entry_type", nullable = false, length = 30)
    private String entryType; // PRE_APPROVED, REQUEST_APPROVED
    
    @Column(name = "approval_method", length = 50)
    private String approvalMethod; // SMS, DASHBOARD, AUTO
    
    @Column(name = "approved_by", nullable = false)
    private String approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "entry_time")
    private LocalDateTime entryTime;
    
    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(name = "exit_method", length = 40)
    private String exitMethod;

    @Column(name = "exit_face_capture", columnDefinition = "TEXT")
    private String exitFaceCapture;

    @Column(name = "exit_match_confidence")
    private Double exitMatchConfidence;
    
    @Column(name = "security_guard")
    private String securityGuard;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "pre_approval_id")
    private Long preApprovalId;
    
    @Column(name = "request_id")
    private Long requestId;
    
    @PrePersist
    protected void onCreate() {
        if (approvedAt == null) {
            approvedAt = LocalDateTime.now();
        }
        if (entryTime == null) {
            entryTime = LocalDateTime.now();
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
    
    public String getEntryType() {
        return entryType;
    }
    
    public void setEntryType(String entryType) {
        this.entryType = entryType;
    }
    
    public String getApprovalMethod() {
        return approvalMethod;
    }
    
    public void setApprovalMethod(String approvalMethod) {
        this.approvalMethod = approvalMethod;
    }
    
    public String getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public LocalDateTime getEntryTime() {
        return entryTime;
    }
    
    public void setEntryTime(LocalDateTime entryTime) {
        this.entryTime = entryTime;
    }
    
    public LocalDateTime getExitTime() {
        return exitTime;
    }
    
    public void setExitTime(LocalDateTime exitTime) {
        this.exitTime = exitTime;
    }

    public String getExitMethod() {
        return exitMethod;
    }

    public void setExitMethod(String exitMethod) {
        this.exitMethod = exitMethod;
    }

    public String getExitFaceCapture() {
        return exitFaceCapture;
    }

    public void setExitFaceCapture(String exitFaceCapture) {
        this.exitFaceCapture = exitFaceCapture;
    }

    public Double getExitMatchConfidence() {
        return exitMatchConfidence;
    }

    public void setExitMatchConfidence(Double exitMatchConfidence) {
        this.exitMatchConfidence = exitMatchConfidence;
    }
    
    public String getSecurityGuard() {
        return securityGuard;
    }
    
    public void setSecurityGuard(String securityGuard) {
        this.securityGuard = securityGuard;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public Long getPreApprovalId() {
        return preApprovalId;
    }
    
    public void setPreApprovalId(Long preApprovalId) {
        this.preApprovalId = preApprovalId;
    }
    
    public Long getRequestId() {
        return requestId;
    }
    
    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }
}

