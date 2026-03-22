package com.mysociety.user.controller;

import com.mysociety.user.model.Amenity;
import com.mysociety.user.model.AmenityBooking;
import com.mysociety.user.service.AmenityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/amenities")
@CrossOrigin(origins = "*")
public class AmenityController {
    
    @Autowired
    private AmenityService amenityService;

    /**
     * Get all available amenities
     */
    @GetMapping
    public ResponseEntity<List<Amenity>> getAllAmenities() {
        try {
            List<Amenity> amenities = amenityService.getAllAmenities();
            return ResponseEntity.ok(amenities);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get amenity by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAmenityById(@PathVariable String id) {
        try {
            Amenity amenity = amenityService.getAmenityById(id);
            return ResponseEntity.ok(amenity);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get available slots for an amenity on a specific date
     */
    @GetMapping("/{id}/slots")
    public ResponseEntity<?> getAvailableSlots(
            @PathVariable String id,
            @RequestParam String date) {
        try {
            Map<String, List<String>> slots = amenityService.getAvailableSlots(id, date);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create new booking
     */
    @PostMapping("/book")
    public ResponseEntity<?> createBooking(@RequestBody AmenityBooking booking) {
        try {
            AmenityBooking created = amenityService.createBooking(booking);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update booking payment status (callback from payment gateway)
     */
    @PutMapping("/bookings/{id}/payment")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable String id,
            @RequestParam String status,
            @RequestParam(required = false) String paymentId) {
        try {
            AmenityBooking updated = amenityService.updateBookingPaymentStatus(id, status, paymentId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get user's bookings
     */
    @GetMapping("/bookings/user/{userId}")
    public ResponseEntity<List<AmenityBooking>> getUserBookings(@PathVariable String userId) {
        try {
            List<AmenityBooking> bookings = amenityService.getUserBookings(userId);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get bookings for an amenity
     */
    @GetMapping("/{id}/bookings")
    public ResponseEntity<List<AmenityBooking>> getAmenityBookings(@PathVariable String id) {
        try {
            List<AmenityBooking> bookings = amenityService.getAmenityBookings(id);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Cancel booking
     */
    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable String id) {
        try {
            amenityService.cancelBooking(id);
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

