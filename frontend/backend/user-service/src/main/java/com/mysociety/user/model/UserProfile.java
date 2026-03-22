package com.NammaSociety.user.model;

import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.Date;

public class UserProfile implements Serializable {
    private String userId;
    private String username;
    private String email;
    private String userType;
    private String ownerType;
    private String towerNumber;
    private String flatNumber;
    private String phoneNumber;
    private String address;
    private String societyName;
    private String profilePhotoUrl;
    private boolean active;
    private long createdAt;
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


