package com.mysociety.user.controller;

import com.mysociety.user.model.UserProfile;
import com.mysociety.user.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserProfileService profileService;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Create admin user (for Super Admin to create Society Admins or other Super Admins)
     */
    @PostMapping("/create-admin-user")
    public ResponseEntity<Map<String, Object>> createAdminUser(@RequestBody Map<String, Object> adminData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String societyName = (String) adminData.get("societyName");
            String username = (String) adminData.get("username");
            String email = (String) adminData.get("email");
            String password = (String) adminData.get("password");
            String role = (String) adminData.get("role");
            String userType = (String) adminData.get("userType");
            @SuppressWarnings("unchecked")
            List<String> permissions = (List<String>) adminData.get("permissions");

            // Validate required fields
            if (username == null || username.isEmpty() || 
                email == null || email.isEmpty() || 
                password == null || password.isEmpty()) {
                response.put("success", false);
                response.put("message", "Username, email, and password are required");
                return ResponseEntity.badRequest().body(response);
            }

            // Check if username already exists
            try {
                UserProfile existing = profileService.getUserByUsername(username);
                if (existing != null) {
                    response.put("success", false);
                    response.put("message", "Username already exists");
                    return ResponseEntity.badRequest().body(response);
                }
            } catch (Exception e) {
                // User doesn't exist, which is good
            }

            // Create UserProfile for admin
            UserProfile adminProfile = new UserProfile();
            adminProfile.setUsername(username);
            adminProfile.setEmail(email);
            adminProfile.setUserType(userType != null ? userType : "admin");
            adminProfile.setOwnerType(role != null ? role : "society-admin");
            adminProfile.setSocietyName(societyName != null ? societyName : "All Societies");
            adminProfile.setTowerNumber("Admin");
            adminProfile.setFlatNumber("Admin");
            adminProfile.setActive(true);
            
            // Create profile in user-service
            UserProfile createdProfile = profileService.createProfile(adminProfile);
            System.out.println("[AdminController] Admin profile created: " + createdProfile.getUsername());

            // Create authentication credentials in auth-service
            try {
                Map<String, Object> authRequest = new HashMap<>();
                authRequest.put("username", username);
                authRequest.put("email", email);
                authRequest.put("password", password);
                authRequest.put("userType", userType != null ? userType : "admin");
                authRequest.put("ownerType", role != null ? role : "society-admin");
                authRequest.put("societyName", societyName != null ? societyName : "All Societies");
                authRequest.put("towerNumber", "Admin");
                authRequest.put("flatNumber", "Admin");
                
                // Add role and permissions for admin users
                authRequest.put("role", role);
                authRequest.put("permissions", permissions);
                
                System.out.println("[AdminController] Calling auth-service to create admin user...");
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(authRequest, headers);
                
                Map<String, Object> authResponse = restTemplate.postForObject(
                    "http://localhost:8001/api/auth/admin/create-user",
                    requestEntity,
                    Map.class
                );
                
                System.out.println("[AdminController] Admin user created in auth-service: " + authResponse);
            } catch (Exception authEx) {
                System.err.println("[AdminController] Warning: Failed to create admin in auth-service: " + authEx.getMessage());
                authEx.printStackTrace();
                // Continue anyway - profile is created in user-service
            }

            response.put("success", true);
            response.put("message", "Admin user created successfully");
            response.put("data", createdProfile);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            System.err.println("[AdminController] Error creating admin user: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to create admin user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Create security user (for Admins to create Security Guard accounts)
     */
    @PostMapping("/create-security-user")
    public ResponseEntity<Map<String, Object>> createSecurityUser(@RequestBody Map<String, Object> securityData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String username = (String) securityData.get("username");
            String email = (String) securityData.get("email");
            String password = (String) securityData.get("password");
            String fullName = (String) securityData.get("fullName");
            String phoneNumber = (String) securityData.get("phoneNumber");
            String role = (String) securityData.get("role"); // Should be "SECURITY"
            String userType = (String) securityData.get("userType"); // Should be "security"
            String societyName = (String) securityData.get("societyName"); // Assigned society

            // Validate required fields
            if (username == null || username.isEmpty() || 
                password == null || password.isEmpty() ||
                societyName == null || societyName.isEmpty()) {
                response.put("success", false);
                response.put("message", "Username, password, and society name are required");
                return ResponseEntity.badRequest().body(response);
            }

            // Check if username already exists
            try {
                UserProfile existing = profileService.getUserByUsername(username);
                if (existing != null) {
                    response.put("success", false);
                    response.put("message", "Username already exists");
                    return ResponseEntity.badRequest().body(response);
                }
            } catch (Exception e) {
                // User doesn't exist, which is good
            }

            // Create UserProfile for security guard assigned to the specified society
            UserProfile securityProfile = new UserProfile();
            securityProfile.setUsername(username);
            securityProfile.setEmail(email != null ? email : username + "@security.local");
            securityProfile.setUserType("security");
            securityProfile.setOwnerType("security-guard");
            securityProfile.setSocietyName(societyName); // Use provided society name
            securityProfile.setTowerNumber("Security");
            securityProfile.setFlatNumber("Gate");
            securityProfile.setPhoneNumber(phoneNumber);
            securityProfile.setActive(true);
            
            // Create profile in user-service
            UserProfile createdProfile = profileService.createProfile(securityProfile);
            System.out.println("[AdminController] Security profile created for society: " + societyName + " - " + createdProfile.getUsername());

            // Create authentication credentials in auth-service
            try {
                Map<String, Object> authRequest = new HashMap<>();
                authRequest.put("username", username);
                authRequest.put("email", email != null ? email : username + "@security.local");
                authRequest.put("password", password);
                authRequest.put("userType", "security");
                authRequest.put("ownerType", "security-guard");
                authRequest.put("societyName", societyName); // Use provided society name
                authRequest.put("towerNumber", "Security");
                authRequest.put("flatNumber", "Gate");
                authRequest.put("role", "SECURITY");
                
                System.out.println("[AdminController] Calling auth-service to create security user for society: " + societyName);
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(authRequest, headers);
                
                Map<String, Object> authResponse = restTemplate.postForObject(
                    "http://localhost:8001/api/auth/admin/create-user",
                    requestEntity,
                    Map.class
                );
                
                System.out.println("[AdminController] Security user created in auth-service: " + authResponse);
            } catch (Exception authEx) {
                System.err.println("[AdminController] Warning: Failed to create security user in auth-service: " + authEx.getMessage());
                authEx.printStackTrace();
                // Continue anyway - profile is created in user-service
            }

            response.put("success", true);
            response.put("message", "Security user created successfully for society: " + societyName);
            response.put("data", createdProfile);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            System.err.println("[AdminController] Error creating security user: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Failed to create security user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get all admin users
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllAdminUsers() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<UserProfile> allProfiles = profileService.getAllProfiles();
            
            // Filter admin users (userType = 'admin' or 'superadmin')
            List<UserProfile> adminUsers = allProfiles.stream()
                .filter(profile -> "admin".equalsIgnoreCase(profile.getUserType()) || 
                                 "superadmin".equalsIgnoreCase(profile.getUserType()))
                .toList();
            
            response.put("success", true);
            response.put("data", adminUsers);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[AdminController] Error fetching admin users: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to fetch admin users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get all users (regular users, not just admins)
     * For super admin to view all system users
     */
    @GetMapping("/all-users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<UserProfile> allProfiles = profileService.getAllProfiles();
            
            response.put("success", true);
            response.put("data", allProfiles);
            response.put("count", allProfiles.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[AdminController] Error fetching all users: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to fetch users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete admin user
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, Object>> deleteAdminUser(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get user profile first
            UserProfile profile = profileService.getProfileById(userId);
            String username = profile.getUsername();
            
            // Delete from user-service
            profileService.deleteProfile(userId);
            
            // Delete from auth-service
            try {
                restTemplate.delete("http://localhost:8001/api/auth/users/" + username);
                System.out.println("[AdminController] Admin user deleted from auth-service: " + username);
            } catch (Exception authEx) {
                System.err.println("[AdminController] Warning: Failed to delete from auth-service: " + authEx.getMessage());
            }
            
            response.put("success", true);
            response.put("message", "Admin user deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[AdminController] Error deleting admin user: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to delete admin user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

