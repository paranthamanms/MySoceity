package com.mysociety.user.controller;

import com.mysociety.user.model.Announcement;
import com.mysociety.user.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/posts/announcements")
@CrossOrigin(origins = "*")
public class AnnouncementController {
    
    @Autowired
    private AnnouncementService announcementService;

    /**
     * Create new announcement
     */
    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody Announcement announcement) {
        try {
            Announcement created = announcementService.createAnnouncement(announcement);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all announcements
     */
    @GetMapping
    public ResponseEntity<List<Announcement>> getAllAnnouncements(
            @RequestParam(required = false) String societyName) {
        try {
            List<Announcement> announcements;
            if (societyName != null && !societyName.isEmpty()) {
                announcements = announcementService.getAnnouncementsBySociety(societyName);
            } else {
                announcements = announcementService.getAllAnnouncements();
            }
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get announcement by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAnnouncementById(@PathVariable String id) {
        try {
            Announcement announcement = announcementService.getAnnouncementById(id);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update announcement
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(
            @PathVariable String id, 
            @RequestBody Announcement announcement) {
        try {
            Announcement updated = announcementService.updateAnnouncement(id, announcement);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete announcement
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable String id) {
        try {
            announcementService.deleteAnnouncement(id);
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

