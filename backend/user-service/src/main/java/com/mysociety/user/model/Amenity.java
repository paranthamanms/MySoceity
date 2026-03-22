package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "amenities")
public class Amenity implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    @Column(name = "icon", length = 100)
    private String icon;
    
    @Column(name = "price", nullable = false)
    private double price;
    
    @Column(name = "slot_type", length = 50)
    private String slotType; // HOURLY, HALF_DAY, FULL_DAY
    
    @Column(name = "slot_duration_minutes")
    private int slotDurationMinutes;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "available", nullable = false)
    private boolean available;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    public Amenity() {}

    public Amenity(String id, String name, String icon, double price, String slotType,
                  int slotDurationMinutes, String description, boolean available,
                  long createdAt, long updatedAt) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.price = price;
        this.slotType = slotType;
        this.slotDurationMinutes = slotDurationMinutes;
        this.description = description;
        this.available = available;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getSlotType() { return slotType; }
    public void setSlotType(String slotType) { this.slotType = slotType; }

    public int getSlotDurationMinutes() { return slotDurationMinutes; }
    public void setSlotDurationMinutes(int slotDurationMinutes) { this.slotDurationMinutes = slotDurationMinutes; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}

