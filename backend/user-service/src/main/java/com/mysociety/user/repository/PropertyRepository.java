package com.mysociety.user.repository;

import com.mysociety.user.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, String> {
    
    List<Property> findByTypeIgnoreCaseAndAvailableOrderByCreatedAtDesc(String type, boolean available);
    
    List<Property> findBySocietyNameIgnoreCaseAndAvailableOrderByCreatedAtDesc(String societyName, boolean available);
    
    List<Property> findByOwnerIdOrderByCreatedAtDesc(String ownerId);
    
    default List<Property> findByType(String type) {
        return findByTypeIgnoreCaseAndAvailableOrderByCreatedAtDesc(type, true);
    }
    
    default List<Property> findBySocietyName(String societyName) {
        return findBySocietyNameIgnoreCaseAndAvailableOrderByCreatedAtDesc(societyName, true);
    }
    
    default List<Property> findByOwnerId(String ownerId) {
        return findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }
}

