package com.NammaSociety.user.model;

import java.io.Serializable;

public class Society implements Serializable {
    private String id;
    private String name;
    private String street;
    private String area;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private int totalTowers;
    private int totalFlats;
    private boolean active;
    private long createdAt;
    private long updatedAt;

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
}

