package com.mysociety.user.controller;

import com.mysociety.user.model.Complaint;
import com.mysociety.user.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/posts/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {
    
    @Autowired
    private ComplaintService complaintService;

    /**
     * Create new complaint
     */
    @PostMapping
    public ResponseEntity<?> createComplaint(@RequestBody Complaint complaint) {
        try {
            Complaint created = complaintService.createComplaint(complaint);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all complaints (with optional filters)
     */
    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints(
            @RequestParam(required = false) String societyName,
            @RequestParam(required = false) String status) {
        try {
            List<Complaint> complaints;
            if (societyName != null && !societyName.isEmpty()) {
                complaints = complaintService.getComplaintsBySociety(societyName);
            } else if (status != null && !status.isEmpty()) {
                complaints = complaintService.getComplaintsByStatus(status);
            } else {
                complaints = complaintService.getAllComplaints();
            }
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get complaint by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable String id) {
        try {
            Complaint complaint = complaintService.getComplaintById(id);
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update complaint
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateComplaint(
            @PathVariable String id, 
            @RequestBody Complaint complaint) {
        try {
            Complaint updated = complaintService.updateComplaint(id, complaint);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete complaint
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComplaint(@PathVariable String id) {
        try {
            complaintService.deleteComplaint(id);
            return ResponseEntity.ok(Map.of("message", "Complaint deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

