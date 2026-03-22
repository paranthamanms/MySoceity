package com.mysociety.user.service;

import com.mysociety.user.model.Property;
import com.mysociety.user.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PropertyService {
    
    @Autowired
    private PropertyRepository propertyRepository;

    public Property createProperty(Property property) {
        if (property.getId() == null || property.getId().isEmpty()) {
            property.setId(java.util.UUID.randomUUID().toString());
        }
        property.setCreatedAt(System.currentTimeMillis());
        property.setUpdatedAt(System.currentTimeMillis());
        property.setAvailable(true);
        return propertyRepository.save(property);
    }

    public Property updateProperty(String id, Property property) throws Exception {
        Property existing = propertyRepository.findById(id)
                .orElseThrow(() -> new Exception("Property not found"));
        
        existing.setType(property.getType());
        existing.setBhk(property.getBhk());
        existing.setPrice(property.getPrice());
        existing.setArea(property.getArea());
        existing.setFurnishingStatus(property.getFurnishingStatus());
        existing.setAmenities(property.getAmenities());
        existing.setImageUrls(property.getImageUrls());
        existing.setDescription(property.getDescription());
        existing.setAvailable(property.isAvailable());
        existing.setUpdatedAt(System.currentTimeMillis());
        
        return propertyRepository.save(existing);
    }

    public Property getPropertyById(String id) throws Exception {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new Exception("Property not found"));
    }

    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    public List<Property> getPropertiesByType(String type) {
        return propertyRepository.findByType(type);
    }

    public List<Property> getPropertiesBySociety(String societyName) {
        return propertyRepository.findBySocietyName(societyName);
    }

    public List<Property> getOwnerProperties(String ownerId) {
        return propertyRepository.findByOwnerId(ownerId);
    }

    public List<Property> searchProperties(String type, String bhk, Double minPrice, Double maxPrice, String societyName) {
        List<Property> properties = propertyRepository.findAll();

        return properties.stream()
                .filter(Property::isAvailable)
                .filter(p -> type == null || p.getType().equalsIgnoreCase(type))
                .filter(p -> bhk == null || p.getBhk().equalsIgnoreCase(bhk))
                .filter(p -> minPrice == null || p.getPrice() >= minPrice)
                .filter(p -> maxPrice == null || p.getPrice() <= maxPrice)
                .filter(p -> societyName == null || p.getSocietyName().toLowerCase().contains(societyName.toLowerCase()))
                .sorted((p1, p2) -> Long.compare(p2.getCreatedAt(), p1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public void deleteProperty(String id) throws Exception {
        if (!propertyRepository.findById(id).isPresent()) {
            throw new Exception("Property not found");
        }
        propertyRepository.deleteById(id);
    }

    public Property markAsUnavailable(String id) throws Exception {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new Exception("Property not found"));
        
        property.setAvailable(false);
        property.setUpdatedAt(System.currentTimeMillis());
        
        return propertyRepository.save(property);
    }
}

