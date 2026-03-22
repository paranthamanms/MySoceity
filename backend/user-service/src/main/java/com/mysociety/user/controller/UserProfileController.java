package com.mysociety.user.controller;

import com.mysociety.user.model.UserProfile;
import com.mysociety.user.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class UserProfileController {

    private UserProfileService profileService;
    private RestTemplate restTemplate;

    @Autowired
    public UserProfileController(UserProfileService profileService, RestTemplate restTemplate) {
        this.profileService = profileService;
        this.restTemplate = restTemplate;
    }

    // User Profile endpoints at /api/users
    @PostMapping("/api/users")
    public ResponseEntity<UserProfile> createProfile(@RequestBody UserProfile profile) {
        try {
            // First create in user-service
            UserProfile created = profileService.createProfile(profile);
            
            // Then create in auth-service for login capability
            // Build the request for auth-service
            Map<String, Object> authRequest = new HashMap<>();
            authRequest.put("username", created.getUsername());
            authRequest.put("email", created.getEmail());
            authRequest.put("password", "NammaSociety@123"); // Default password for admin-created users
            authRequest.put("userType", created.getUserType());
            authRequest.put("ownerType", created.getOwnerType());
            authRequest.put("towerNumber", created.getTowerNumber());
            authRequest.put("flatNumber", created.getFlatNumber());
            authRequest.put("societyName", created.getSocietyName());
            
            try {
                // Call auth-service to create user for login
                restTemplate.postForObject(
                    "http://localhost:8001/api/auth/admin/create-user",
                    authRequest,
                    Map.class
                );
                System.out.println("[UserProfileController] User created successfully in both services: " + created.getUsername());
            } catch (Exception authEx) {
                System.err.println("[UserProfileController] Warning: Failed to create user in auth-service: " + authEx.getMessage());
                // Continue anyway - user is created in user-service at least
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            System.err.println("[UserProfileController] Error creating user profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/api/users/{userId}")
    public ResponseEntity<UserProfile> getProfile(@PathVariable String userId) {
        try {
            UserProfile profile = profileService.getProfileById(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/api/users/{userId}")
    public ResponseEntity<UserProfile> updateProfile(@PathVariable String userId, @RequestBody UserProfile profile) {
        try {
            UserProfile updated = profileService.updateProfile(userId, profile);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/api/users/{userId}")
    public ResponseEntity<Map<String, Object>> deleteProfile(@PathVariable String userId) {
        try {
            profileService.deleteProfile(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/api/users")
    public ResponseEntity<List<UserProfile>> getAllProfiles() {
        List<UserProfile> profiles = profileService.getAllProfiles();
        return ResponseEntity.ok(profiles);
    }

    /**
     * Get users by society name, optionally filtered by tower
     * This endpoint is for normal users to view their society directory
     */
    @GetMapping("/api/users/society/{societyName}")
    public ResponseEntity<List<UserProfile>> getUsersBySociety(
            @PathVariable String societyName,
            @RequestParam(required = false) String tower) {
        try {
            List<UserProfile> profiles = profileService.getUsersBySociety(societyName);
            
            // Filter by tower if provided
            if (tower != null && !tower.isEmpty()) {
                profiles = profiles.stream()
                    .filter(p -> tower.equals(p.getTowerNumber()))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            return ResponseEntity.ok(profiles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/api/users/username/{username}")
    public ResponseEntity<UserProfile> getUserByUsername(@PathVariable String username) {
        try {
            UserProfile profile = profileService.getUserByUsername(username);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/api/users/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "User Service is running");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/api/users/{userId}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(@PathVariable String userId, @RequestBody Map<String, String> request) {
        try {
            String newStatus = request.get("status");
            UserProfile profile = profileService.getProfileById(userId);
            
            // Set active based on the status
            boolean isActive = newStatus.equalsIgnoreCase("active");
            profile.setActive(isActive);
            
            UserProfile updated = profileService.updateProfile(userId, profile);
            
            // Also sync status with auth-service
            try {
                Map<String, Object> authRequest = new HashMap<>();
                authRequest.put("active", isActive);
                
                restTemplate.patchForObject(
                    "http://localhost:8001/api/auth/users/" + profile.getUsername() + "/status",
                    authRequest,
                    Map.class
                );
            } catch (Exception e) {
                System.err.println("Warning: Could not sync user status with auth-service: " + e.getMessage());
                // Continue - we've updated in user-service
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User status updated successfully");
            response.put("data", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error updating user status: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // Bulk upload endpoint at /api/user/bulk-upload
    @PostMapping("/api/user/bulk-upload")
    public ResponseEntity<Map<String, Object>> bulkUploadUsers(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            if (!file.getOriginalFilename().endsWith(".csv")) {
                response.put("success", false);
                response.put("message", "Please upload a CSV file");
                return ResponseEntity.badRequest().body(response);
            }

            // Parse CSV and create users
            Map<String, Object> uploadResult = profileService.processBulkUpload(file);
            
            response.put("success", (boolean) uploadResult.get("success"));
            response.put("message", uploadResult.get("message"));
            response.put("successCount", uploadResult.get("successCount"));
            response.put("failureCount", uploadResult.get("failureCount"));
            response.put("errors", uploadResult.get("errors"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Bulk upload failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

