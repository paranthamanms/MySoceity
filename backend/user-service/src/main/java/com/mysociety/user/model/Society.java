package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "societies")
public class Society implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "name", nullable = false, unique = true, length = 255)
    private String name;
    
    @Column(name = "street", length = 255)
    private String street;
    
    @Column(name = "area", length = 255)
    private String area;
    
    @Column(name = "city", length = 100)
    private String city;
    
    @Column(name = "state", length = 100)
    private String state;
    
    @Column(name = "country", length = 100)
    private String country;
    
    @Column(name = "pincode", length = 20)
    private String pincode;
    
    @Column(name = "total_towers")
    private int totalTowers;
    
    @Column(name = "total_flats")
    private int totalFlats;
    
    @Column(name = "active", nullable = false)
    private boolean active;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    @Column(name = "scanner_code", length = 120)
    private String scannerCode;

    @Column(name = "scanner_code_updated_at")
    private long scannerCodeUpdatedAt;

    public Society() {}

    public Society(String id, String name, String street, String area, String city, 
                   String state, String country, String pincode, int totalTowers, 
                   int totalFlats, boolean active, long createdAt, long updatedAt) {
        this.id = id;
        this.name = name;
        this.street = street;
        this.area = area;
        this.city = city;
        this.state = state;
        this.country = country;
        this.pincode = pincode;
        this.totalTowers = totalTowers;
        this.totalFlats = totalFlats;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public int getTotalTowers() { return totalTowers; }
    public void setTotalTowers(int totalTowers) { this.totalTowers = totalTowers; }

    public int getTotalFlats() { return totalFlats; }
    public void setTotalFlats(int totalFlats) { this.totalFlats = totalFlats; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public String getScannerCode() { return scannerCode; }
    public void setScannerCode(String scannerCode) { this.scannerCode = scannerCode; }

    public long getScannerCodeUpdatedAt() { return scannerCodeUpdatedAt; }
    public void setScannerCodeUpdatedAt(long scannerCodeUpdatedAt) { this.scannerCodeUpdatedAt = scannerCodeUpdatedAt; }
}

