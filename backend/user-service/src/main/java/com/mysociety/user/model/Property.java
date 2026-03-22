package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "properties")
public class Property implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "type", nullable = false, length = 20)
    private String type; // SALE, RENT
    
    @Column(name = "bhk", length = 20)
    private String bhk;
    
    @Column(name = "society_name", length = 255)
    private String societyName;
    
    @Column(name = "tower", length = 50)
    private String tower;
    
    @Column(name = "flat_number", length = 50)
    private String flatNumber;
    
    @Column(name = "price", nullable = false)
    private double price; // Sale price or monthly rent
    
    @Column(name = "area")
    private double area; // in sq ft
    
    @Column(name = "furnishing_status", length = 50)
    private String furnishingStatus; // FURNISHED, SEMI_FURNISHED, UNFURNISHED
    
    @ElementCollection
    @CollectionTable(name = "property_amenities", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "amenity", length = 255)
    private List<String> amenities;
    
    @ElementCollection
    @CollectionTable(name = "property_images", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "image_url", length = 500)
    private List<String> imageUrls;
    
    @Column(name = "owner_id", length = 50)
    private String ownerId;
    
    @Column(name = "owner_name", length = 255)
    private String ownerName;
    
    @Column(name = "owner_contact", length = 15)
    private String ownerContact;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "available", nullable = false)
    private boolean available;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    public Property() {
        this.amenities = new ArrayList<>();
        this.imageUrls = new ArrayList<>();
    }

    public Property(String id, String type, String bhk, String societyName, String tower,
                   String flatNumber, double price, double area, String furnishingStatus,
                   List<String> amenities, List<String> imageUrls, String ownerId,
                   String ownerName, String ownerContact, String description, boolean available,
                   long createdAt, long updatedAt) {
        this.id = id;
        this.type = type;
        this.bhk = bhk;
        this.societyName = societyName;
        this.tower = tower;
        this.flatNumber = flatNumber;
        this.price = price;
        this.area = area;
        this.furnishingStatus = furnishingStatus;
        this.amenities = amenities != null ? amenities : new ArrayList<>();
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerContact = ownerContact;
        this.description = description;
        this.available = available;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getBhk() { return bhk; }
    public void setBhk(String bhk) { this.bhk = bhk; }

    public String getSocietyName() { return societyName; }
    public void setSocietyName(String societyName) { this.societyName = societyName; }

    public String getTower() { return tower; }
    public void setTower(String tower) { this.tower = tower; }

    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public double getArea() { return area; }
    public void setArea(double area) { this.area = area; }

    public String getFurnishingStatus() { return furnishingStatus; }
    public void setFurnishingStatus(String furnishingStatus) { this.furnishingStatus = furnishingStatus; }

    public List<String> getAmenities() { return amenities; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getOwnerContact() { return ownerContact; }
    public void setOwnerContact(String ownerContact) { this.ownerContact = ownerContact; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}

