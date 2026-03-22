package com.NammaSociety.user.service;

import com.NammaSociety.user.model.UserProfile;
import com.NammaSociety.user.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.UUID;

@Service
public class UserProfileService {

    private UserProfileRepository profileRepository;
    private RestTemplate restTemplate;

    @Autowired
    public UserProfileService(UserProfileRepository profileRepository, RestTemplate restTemplate) {
        this.profileRepository = profileRepository;
        this.restTemplate = restTemplate;
    }

    public UserProfile createProfile(UserProfile profile) {
        // Auto-generate userId if not provided
        if (profile.getUserId() == null || profile.getUserId().isEmpty()) {
            profile.setUserId(UUID.randomUUID().toString());
        }
        
        if (profile.getCreatedAt() == 0) {
            profile.setCreatedAt(System.currentTimeMillis());
        }
        
        if (profile.getUpdatedAt() == 0) {
            profile.setUpdatedAt(System.currentTimeMillis());
        }
        
        return profileRepository.save(profile);
    }

    public UserProfile getProfileById(String userId) throws Exception {
        return profileRepository.findById(userId)
                .orElseThrow(() -> new Exception("User profile not found"));
    }

    public UserProfile updateProfile(String userId, UserProfile profile) throws Exception {
        UserProfile existing = profileRepository.findById(userId)
                .orElseThrow(() -> new Exception("User profile not found"));

        if (profile.getPhoneNumber() != null) existing.setPhoneNumber(profile.getPhoneNumber());
        if (profile.getAddress() != null) existing.setAddress(profile.getAddress());
        if (profile.getProfilePhotoUrl() != null) existing.setProfilePhotoUrl(profile.getProfilePhotoUrl());

        return profileRepository.save(existing);
    }

    public List<UserProfile> getAllProfiles() {
        return profileRepository.findAll();
    }

    public void deleteProfile(String userId) throws Exception {
        if (!profileRepository.existsById(userId)) {
            throw new Exception("User profile not found");
        }
        profileRepository.deleteById(userId);
    }

    public UserProfile getUserByUsername(String username) throws Exception {
        return profileRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("User not found"));
    }

    public Map<String, Object> processBulkUpload(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isFirstLine = true;
            String[] headers = null;

            while ((line = reader.readLine()) != null) {
                if (isFirstLine) {
                    // Parse header
                    headers = line.split(",");
                    isFirstLine = false;
                    continue;
                }

                try {
                    // Parse CSV line
                    String[] values = parseCSVLine(line);
                    
                    if (values.length < headers.length) {
                        failureCount++;
                        errors.add("Line " + (successCount + failureCount + 1) + ": Insufficient columns");
                        continue;
                    }

                    // Create UserProfile from CSV data
                    UserProfile profile = new UserProfile();
                    
                    // Map CSV columns to UserProfile fields
                    for (int i = 0; i < headers.length; i++) {
                        String header = headers[i].trim().toLowerCase();
                        String value = values[i].trim();

                        if (header.equals("societyname")) {
                            profile.setSocietyName(value);
                        } else if (header.equals("username")) {
                            profile.setUsername(value);
                        } else if (header.equals("email")) {
                            profile.setEmail(value);
                        } else if (header.equals("usertype")) {
                            profile.setUserType(value);
                        } else if (header.equals("ownertype")) {
                            profile.setOwnerType(value);
                        } else if (header.equals("towernumber")) {
                            profile.setTowerNumber(value);
                        } else if (header.equals("flatnumber")) {
                            profile.setFlatNumber(value);
                        }
                    }

                    // Validate required fields
                    if (profile.getUsername() == null || profile.getUsername().isEmpty()) {
                        failureCount++;
                        errors.add("Line " + (successCount + failureCount + 1) + ": Username is required");
                        continue;
                    }

                    if (profile.getEmail() == null || profile.getEmail().isEmpty()) {
                        failureCount++;
                        errors.add("Line " + (successCount + failureCount + 1) + ": Email is required");
                        continue;
                    }

                    // Check if user already exists
                    try {
                        getUserByUsername(profile.getUsername());
                        failureCount++;
                        errors.add("Line " + (successCount + failureCount + 1) + ": User '" + profile.getUsername() + "' already exists");
                        continue;
                    } catch (Exception e) {
                        // User doesn't exist, which is good
                    }

                    // Set additional fields
                    profile.setUserId(UUID.randomUUID().toString());
                    profile.setActive(true);
                    profile.setCreatedAt(System.currentTimeMillis());
                    profile.setUpdatedAt(System.currentTimeMillis());

                    // Save user in user-service
                    profileRepository.save(profile);
                    
                    // Also create in auth-service for login capability
                    try {
                        Map<String, Object> authRequest = new HashMap<>();
                        authRequest.put("username", profile.getUsername());
                        authRequest.put("email", profile.getEmail());
                        authRequest.put("password", "NammaSociety@123"); // Default password
                        authRequest.put("userType", profile.getUserType());
                        authRequest.put("ownerType", profile.getOwnerType());
                        authRequest.put("towerNumber", profile.getTowerNumber());
                        authRequest.put("flatNumber", profile.getFlatNumber());
                        authRequest.put("societyName", profile.getSocietyName());
                        
                        restTemplate.postForObject(
                            "http://localhost:8001/api/auth/admin/create-user",
                            authRequest,
                            Map.class
                        );
                    } catch (Exception authEx) {
                        System.err.println("[BulkUpload] Warning: Failed to create user in auth-service: " + authEx.getMessage());
                        // Continue anyway - user is created in user-service
                    }
                    
                    successCount++;

                } catch (Exception e) {
                    failureCount++;
                    errors.add("Line " + (successCount + failureCount + 1) + ": " + e.getMessage());
                }
            }

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error reading file: " + e.getMessage());
            result.put("successCount", 0);
            result.put("failureCount", 0);
            result.put("errors", errors);
            return result;
        }

        result.put("success", failureCount == 0);
        result.put("message", "Bulk upload completed. " + successCount + " users created, " + failureCount + " failed.");
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("errors", errors);

        return result;
    }

    private String[] parseCSVLine(String line) {
        // Simple CSV parser that handles quoted values
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentValue = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(currentValue.toString());
                currentValue = new StringBuilder();
            } else {
                currentValue.append(c);
            }
        }

        result.add(currentValue.toString());
        return result.toArray(new String[0]);
    }
}

