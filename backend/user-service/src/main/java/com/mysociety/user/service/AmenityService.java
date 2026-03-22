package com.mysociety.user.service;

import com.mysociety.user.model.Amenity;
import com.mysociety.user.model.AmenityBooking;
import com.mysociety.user.repository.AmenityRepository;
import com.mysociety.user.repository.AmenityBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class AmenityService {
    
    @Autowired
    private AmenityRepository amenityRepository;
    
    @Autowired
    private AmenityBookingRepository bookingRepository;

    public List<Amenity> getAllAmenities() {
        return amenityRepository.findAllAvailable();
    }

    public Amenity getAmenityById(String id) throws Exception {
        return amenityRepository.findById(id)
                .orElseThrow(() -> new Exception("Amenity not found"));
    }

    public AmenityBooking createBooking(AmenityBooking booking) throws Exception {
        // Check if slot is available
        if (!bookingRepository.isSlotAvailable(booking.getAmenityId(), 
                                               booking.getBookingDate(), 
                                               booking.getTimeSlot())) {
            throw new Exception("Time slot already booked");
        }

        // Verify amenity exists
        Amenity amenity = amenityRepository.findById(booking.getAmenityId())
                .orElseThrow(() -> new Exception("Amenity not found"));

        if (!amenity.isAvailable()) {
            throw new Exception("Amenity is not available");
        }

        if (booking.getId() == null || booking.getId().isEmpty()) {
            booking.setId(java.util.UUID.randomUUID().toString());
        }
        booking.setAmenityName(amenity.getName());
        booking.setCreatedAt(System.currentTimeMillis());
        booking.setUpdatedAt(System.currentTimeMillis());
        booking.setPaymentStatus("PENDING");

        return bookingRepository.save(booking);
    }

    public AmenityBooking updateBookingPaymentStatus(String bookingId, String paymentStatus, String paymentId) throws Exception {
        AmenityBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new Exception("Booking not found"));

        booking.setPaymentStatus(paymentStatus);
        booking.setPaymentId(paymentId);
        booking.setUpdatedAt(System.currentTimeMillis());

        return bookingRepository.save(booking);
    }

    public List<AmenityBooking> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<AmenityBooking> getAmenityBookings(String amenityId) {
        return bookingRepository.findByAmenityId(amenityId);
    }

    public Map<String, List<String>> getAvailableSlots(String amenityId, String date) throws Exception {
        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new Exception("Amenity not found"));

        List<AmenityBooking> existingBookings = bookingRepository.findByDateAndAmenity(date, amenityId);
        
        Map<String, List<String>> response = new HashMap<>();
        // Generate time slots based on amenity type
        // This is a simplified version
        response.put("availableSlots", generateTimeSlots(amenity.getSlotType(), existingBookings));
        
        return response;
    }

    private List<String> generateTimeSlots(String slotType, List<AmenityBooking> existingBookings) {
        // Simplified slot generation - extend this based on requirements
        List<String> slots = new java.util.ArrayList<>();
        
        if ("HOURLY".equals(slotType)) {
            for (int i = 6; i <= 22; i++) {
                String slot = String.format("%02d:00 - %02d:00", i, i + 1);
                boolean isBooked = existingBookings.stream()
                        .anyMatch(b -> b.getTimeSlot().equals(slot) && 
                                      !"FAILED".equals(b.getPaymentStatus()));
                if (!isBooked) {
                    slots.add(slot);
                }
            }
        }
        
        return slots;
    }

    public void cancelBooking(String bookingId) throws Exception {
        AmenityBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new Exception("Booking not found"));

        booking.setPaymentStatus("REFUNDED");
        booking.setUpdatedAt(System.currentTimeMillis());
        bookingRepository.save(booking);
    }
}

