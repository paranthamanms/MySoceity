package com.NammaSociety.auth.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "users")
public class User implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;
    
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;
    
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    @Column(name = "password", nullable = false, length = 255)
    private String password;
    
    @Column(name = "user_type", length = 50)
    private String userType;
    
    @Column(name = "owner_type", length = 50)
    private String ownerType;
    
    @Column(name = "tower_number", length = 50)
    private String towerNumber;
    
    @Column(name = "flat_number", length = 50)
    private String flatNumber;
    
    @Column(name = "society_name", length = 255)
    private String societyName;
    
    @Column(name = "active", nullable = false)
    private boolean active;
    
    @Column(name = "role", nullable = false, length = 20)
    private String role; // "USER" or "ADMIN"
    
    @Column(name = "is_default_password", nullable = false)
    private boolean isDefaultPassword; // True if password needs to be changed on first login
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    public User() {}

    public User(String id, String username, String email, String password, String userType, 
                String ownerType, String towerNumber, String flatNumber, String societyName,
                boolean active, String role, boolean isDefaultPassword, long createdAt, long updatedAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.userType = userType;
        this.ownerType = ownerType;
        this.towerNumber = towerNumber;
        this.flatNumber = flatNumber;
        this.societyName = societyName;
        this.active = active;
        this.role = role != null ? role : "USER";
        this.isDefaultPassword = isDefaultPassword;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public String getSocietyName() {
        return societyName;
    }

    public void setSocietyName(String societyName) {
        this.societyName = societyName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role != null ? role : "USER";
    }

    public boolean isDefaultPassword() {
        return isDefaultPassword;
    }

    public void setDefaultPassword(boolean defaultPassword) {
        isDefaultPassword = defaultPassword;
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
}


