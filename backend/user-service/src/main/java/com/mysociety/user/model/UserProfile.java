package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.Date;

@Entity
@Table(name = "user_profiles")
public class UserProfile implements Serializable {
    
    @Id
    @Column(name = "user_id", nullable = false, unique = true, length = 50)
    private String userId;
    
    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;
    
    @Column(name = "email", nullable = false, length = 255)
    private String email;
    
    @Column(name = "user_type", nullable = false, length = 50)
    private String userType;
    
    @Column(name = "owner_type", length = 50)
    private String ownerType;
    
    @Column(name = "tower_number", length = 50)
    private String towerNumber;
    
    @Column(name = "flat_number", length = 50)
    private String flatNumber;
    
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    @Column(name = "address", length = 500)
    private String address;
    
    @Column(name = "society_name", length = 255)
    private String societyName;
    
    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;
    
    @Column(name = "active")
    private boolean active;
    
    @Column(name = "created_at")
    private long createdAt;
    
    @Column(name = "updated_at")
    private long updatedAt;

    public UserProfile() {}

    public UserProfile(String userId, String username, String email, String userType, String ownerType,
                      String towerNumber, String flatNumber, String phoneNumber, String address,
                      String societyName, String profilePhotoUrl, boolean active, long createdAt, long updatedAt) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.userType = userType;
        this.ownerType = ownerType;
        this.towerNumber = towerNumber;
        this.flatNumber = flatNumber;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.societyName = societyName;
        this.profilePhotoUrl = profilePhotoUrl;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
    }

    public String getTowerNumber() {
        return towerNumber;
    }

    public void setTowerNumber(String towerNumber) {
        this.towerNumber = towerNumber;
    }

    public String getFlatNumber() {
        return flatNumber;
    }

    public void setFlatNumber(String flatNumber) {
        this.flatNumber = flatNumber;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getSocietyName() {
        return societyName;
    }

    public void setSocietyName(String societyName) {
        this.societyName = societyName;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
    // Helper methods for frontend compatibility
    public String getStatus() {
        return this.active ? "Active" : "Inactive";
    }

    public String getCreatedDate() {
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date(this.createdAt));
    }

    public String getId() {
        return this.userId;
    }
}


