package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "amenity_bookings")
public class AmenityBooking implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "amenity_id", nullable = false, length = 50)
    private String amenityId;
    
    @Column(name = "amenity_name", length = 255)
    private String amenityName;
    
    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;
    
    @Column(name = "user_name", length = 255)
    private String userName;
    
    @Column(name = "society_name", length = 255)
    private String societyName;
    
    @Column(name = "booking_date", nullable = false, length = 20)
    private String bookingDate;
    
    @Column(name = "time_slot", length = 100)
    private String timeSlot;
    
    @Column(name = "amount", nullable = false)
    private double amount;
    
    @Column(name = "payment_status", nullable = false, length = 50)
    private String paymentStatus; // PENDING, COMPLETED, FAILED, REFUNDED
    
    @Column(name = "payment_id", length = 100)
    private String paymentId;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    public AmenityBooking() {}

    public AmenityBooking(String id, String amenityId, String amenityName, String userId,
                         String userName, String societyName, String bookingDate, String timeSlot,
                         double amount, String paymentStatus, String paymentId, String remarks,
                         long createdAt, long updatedAt) {
        this.id = id;
        this.amenityId = amenityId;
        this.amenityName = amenityName;
        this.userId = userId;
        this.userName = userName;
        this.societyName = societyName;
        this.bookingDate = bookingDate;
        this.timeSlot = timeSlot;
        this.amount = amount;
        this.paymentStatus = paymentStatus;
        this.paymentId = paymentId;
        this.remarks = remarks;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAmenityId() { return amenityId; }
    public void setAmenityId(String amenityId) { this.amenityId = amenityId; }

    public String getAmenityName() { return amenityName; }
    public void setAmenityName(String amenityName) { this.amenityName = amenityName; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getSocietyName() { return societyName; }
    public void setSocietyName(String societyName) { this.societyName = societyName; }

    public String getBookingDate() { return bookingDate; }
    public void setBookingDate(String bookingDate) { this.bookingDate = bookingDate; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}

