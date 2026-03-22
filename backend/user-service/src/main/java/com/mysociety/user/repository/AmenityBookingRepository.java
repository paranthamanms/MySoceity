package com.mysociety.user.repository;

import com.mysociety.user.model.AmenityBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AmenityBookingRepository extends JpaRepository<AmenityBooking, String> {
    
    List<AmenityBooking> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<AmenityBooking> findByAmenityIdOrderByCreatedAtDesc(String amenityId);
    
    List<AmenityBooking> findByBookingDateAndAmenityId(String date, String amenityId);
    
    @Query("SELECT CASE WHEN COUNT(b) = 0 THEN true ELSE false END FROM AmenityBooking b " +
           "WHERE b.amenityId = :amenityId AND b.bookingDate = :date AND b.timeSlot = :timeSlot " +
           "AND b.paymentStatus <> 'FAILED'")
    boolean isSlotAvailable(String amenityId, String date, String timeSlot);
    
    default List<AmenityBooking> findByUserId(String userId) {
        return findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    default List<AmenityBooking> findByAmenityId(String amenityId) {
        return findByAmenityIdOrderByCreatedAtDesc(amenityId);
    }
    
    default List<AmenityBooking> findByDateAndAmenity(String date, String amenityId) {
        return findByBookingDateAndAmenityId(date, amenityId);
    }
}

