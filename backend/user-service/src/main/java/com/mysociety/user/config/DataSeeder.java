package com.mysociety.user.config;

import com.mysociety.user.model.Amenity;
import com.mysociety.user.repository.AmenityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds initial data into the database on application startup
 */
@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private AmenityRepository amenityRepository;

    @Override
    public void run(String... args) throws Exception {
        seedAmenities();
    }

    /**
     * Initialize default amenities if database is empty
     */
    private void seedAmenities() {
        if (amenityRepository.count() == 0) {
            System.out.println("[DataSeeder] No amenities found. Seeding default amenities...");
            
            long now = System.currentTimeMillis();
            
            // Create default amenities
            createAmenity("1", "Cricket Ground", "🏏", 500.0, "HOURLY", 60, "Full size cricket ground", true, now);
            createAmenity("2", "Football Ground", "⚽", 400.0, "HOURLY", 60, "Football turf", true, now);
            createAmenity("3", "Badminton Court", "🏸", 200.0, "HOURLY", 60, "Indoor badminton court", true, now);
            createAmenity("4", "Basketball Court", "🏀", 300.0, "HOURLY", 60, "Outdoor basketball court", true, now);
            createAmenity("5", "Gym", "💪", 0.0, "FULL_DAY", 1440, "Fully equipped gym - Free for residents", true, now);
            createAmenity("6", "Pickle Ball Court", "🎾", 150.0, "HOURLY", 60, "Pickle ball court", true, now);
            createAmenity("7", "Tennis Court", "🎾", 350.0, "HOURLY", 60, "Professional tennis court", true, now);
            
            System.out.println("[DataSeeder] Successfully seeded 7 default amenities");
        } else {
            // Fix any garbled emoji icons in existing records
            fixAmenityIcons();
        }
    }

    private void fixAmenityIcons() {
        java.util.Map<String, String> iconFix = new java.util.HashMap<>();
        iconFix.put("1", "🏏");
        iconFix.put("2", "⚽");
        iconFix.put("3", "🏸");
        iconFix.put("4", "🏀");
        iconFix.put("5", "💪");
        iconFix.put("6", "🎾");
        iconFix.put("7", "🎾");
        iconFix.forEach((id, icon) -> amenityRepository.findById(id).ifPresent(a -> {
            if (a.getIcon() == null || !a.getIcon().equals(icon)) {
                a.setIcon(icon);
                amenityRepository.save(a);
            }
        }));
    }

    private void createAmenity(String id, String name, String icon, double price, String slotType, 
                               int slotDuration, String description, boolean available, long timestamp) {
        Amenity amenity = new Amenity();
        amenity.setId(id);
        amenity.setName(name);
        amenity.setIcon(icon);
        amenity.setPrice(price);
        amenity.setSlotType(slotType);
        amenity.setSlotDurationMinutes(slotDuration);
        amenity.setDescription(description);
        amenity.setAvailable(available);
        amenity.setCreatedAt(timestamp);
        amenity.setUpdatedAt(timestamp);
        
        amenityRepository.save(amenity);
        System.out.println("[DataSeeder]   - Created: " + name + " (" + id + ")");
    }
}

