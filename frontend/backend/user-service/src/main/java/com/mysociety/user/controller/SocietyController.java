package com.NammaSociety.user.controller;

import com.NammaSociety.user.model.Society;
import com.NammaSociety.user.service.SocietyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api/societies")
@CrossOrigin(origins = "*")
public class SocietyController {
    
    @Autowired
    private SocietyService societyService;

    /**
     * Get all societies
     */
    @GetMapping
    public ResponseEntity<List<Society>> getAllSocieties() {
        try {
            List<Society> societies = societyService.getAllSocieties();
            return ResponseEntity.ok(societies);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get all active societies
     */
    @GetMapping("/active")
    public ResponseEntity<List<Society>> getActiveSocieties() {
        try {
            List<Society> societies = societyService.getActiveSocieties();
            return ResponseEntity.ok(societies);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get society by id
     */
    @GetMapping("/{id}")
    public ResponseEntity<Society> getSocietyById(@PathVariable String id) {
        try {
            Society society = societyService.getSocietyById(id);
            return ResponseEntity.ok(society);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(null);
        }
    }

    /**
     * Create a new society
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSociety(@RequestBody Society society) {
        Map<String, Object> response = new HashMap<>();
        try {
            Society created = societyService.createSociety(society);
            response.put("success", true);
            response.put("message", "Society created successfully");
            response.put("data", created);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    /**
     * Update society
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSociety(@PathVariable String id, @RequestBody Society society) {
        Map<String, Object> response = new HashMap<>();
        try {
            Society updated = societyService.updateSociety(id, society);
            response.put("success", true);
            response.put("message", "Society updated successfully");
            response.put("data", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    /**
     * Delete society
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSociety(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        try {
            societyService.deleteSociety(id);
            response.put("success", true);
            response.put("message", "Society deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    /**
     * Bulk upload societies from CSV
     * CSV format: name,city,state,country,street,area,pincode,totalTowers,totalFlats
     */
    @PostMapping("/bulk-upload")
    public ResponseEntity<Map<String, Object>> bulkUploadSocieties(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!file.getOriginalFilename().endsWith(".csv")) {
                response.put("success", false);
                response.put("message", "Please upload a CSV file");
                return ResponseEntity.status(400).body(response);
            }

            Map<String, Object> uploadResult = societyService.processBulkUpload(file);
            
            response.put("success", (boolean) uploadResult.get("success"));
            response.put("message", uploadResult.get("message"));
            response.put("successCount", uploadResult.get("successCount"));
            response.put("failureCount", uploadResult.get("failureCount"));
            response.put("errors", uploadResult.get("errors"));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Bulk upload failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}

