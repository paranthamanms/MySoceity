package com.mysociety.user.controller;

import com.mysociety.user.model.Property;
import com.mysociety.user.service.PropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "*")
public class PropertyController {
    
    @Autowired
    private PropertyService propertyService;

    /**
     * Create new property listing
     */
    @PostMapping
    public ResponseEntity<?> createProperty(@RequestBody Property property) {
        try {
            Property created = propertyService.createProperty(property);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all properties with optional filters
     */
    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String societyName) {
        try {
            List<Property> properties;
            if (type != null && !type.isEmpty()) {
                properties = propertyService.getPropertiesByType(type);
            } else if (societyName != null && !societyName.isEmpty()) {
                properties = propertyService.getPropertiesBySociety(societyName);
            } else {
                properties = propertyService.getAllProperties();
            }
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Search properties with multiple filters
     */
    @GetMapping("/search")
    public ResponseEntity<List<Property>> searchProperties(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String bhk,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String societyName) {
        try {
            List<Property> properties = propertyService.searchProperties(
                    type, bhk, minPrice, maxPrice, societyName);
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get property by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPropertyById(@PathVariable String id) {
        try {
            Property property = propertyService.getPropertyById(id);
            return ResponseEntity.ok(property);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get properties by owner
     */
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Property>> getOwnerProperties(@PathVariable String ownerId) {
        try {
            List<Property> properties = propertyService.getOwnerProperties(ownerId);
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Update property
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProperty(
            @PathVariable String id, 
            @RequestBody Property property) {
        try {
            Property updated = propertyService.updateProperty(id, property);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark property as unavailable (sold/rented)
     */
    @PutMapping("/{id}/unavailable")
    public ResponseEntity<?> markAsUnavailable(@PathVariable String id) {
        try {
            Property property = propertyService.markAsUnavailable(id);
            return ResponseEntity.ok(property);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete property
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable String id) {
        try {
            propertyService.deleteProperty(id);
            return ResponseEntity.ok(Map.of("message", "Property deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

