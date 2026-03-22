package com.mysociety.user.repository;

import com.mysociety.user.model.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, String> {
    
    List<Amenity> findByAvailable(boolean available);
    
    default List<Amenity> findAllAvailable() {
        return findByAvailable(true);
    }
}

