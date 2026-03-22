package com.NammaSociety.user.service;

import com.NammaSociety.user.model.Society;
import com.NammaSociety.user.repository.SocietyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

@Service
public class SocietyService {
    
    @Autowired
    private SocietyRepository societyRepository;

    public Society createSociety(Society society) throws Exception {
        if (societyRepository.existsByName(society.getName())) {
            throw new Exception("Society with name '" + society.getName() + "' already exists");
        }
        // Generate UUID if ID is not provided
        if (society.getId() == null || society.getId().isEmpty()) {
            society.setId(UUID.randomUUID().toString());
        }
        society.setCreatedAt(System.currentTimeMillis());
        society.setUpdatedAt(System.currentTimeMillis());
        society.setActive(true);
        return societyRepository.save(society);
    }

    public Society updateSociety(String id, Society society) throws Exception {
        Optional<Society> existing = societyRepository.findById(id);
        if (!existing.isPresent()) {
            throw new Exception("Society not found");
        }
        
        // Check if renaming and another society with same name exists
        if (!society.getName().equals(existing.get().getName()) && 
            societyRepository.existsByName(society.getName())) {
            throw new Exception("Society with name '" + society.getName() + "' already exists");
        }
        
        Society updated = existing.get();
        updated.setName(society.getName());
        updated.setStreet(society.getStreet());
        updated.setArea(society.getArea());
        updated.setCity(society.getCity());
        updated.setState(society.getState());
        updated.setCountry(society.getCountry());
        updated.setPincode(society.getPincode());
        updated.setTotalTowers(society.getTotalTowers());
        updated.setTotalFlats(society.getTotalFlats());
        updated.setActive(society.isActive());
        updated.setUpdatedAt(System.currentTimeMillis());
        
        return societyRepository.save(updated);
    }

    public Society getSocietyById(String id) throws Exception {
        Optional<Society> society = societyRepository.findById(id);
        if (!society.isPresent()) {
            throw new Exception("Society not found");
        }
        return society.get();
    }

    public List<Society> getAllSocieties() {
        return societyRepository.findAll();
    }

    public List<Society> getActiveSocieties() {
        return societyRepository.findAllActive();
    }

    public void deleteSociety(String id) throws Exception {
        Optional<Society> society = societyRepository.findById(id);
        if (!society.isPresent()) {
            throw new Exception("Society not found");
        }
        societyRepository.delete(society.get());
    }

    public Map<String, Object> processBulkUpload(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
            String line;
            int rowNum = 0;

            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (rowNum == 1) continue; // Skip header

                try {
                    String[] fields = line.split(",");
                    if (fields.length < 3) {
                        errors.add("Row " + rowNum + ": Invalid number of fields");
                        failureCount++;
                        continue;
                    }

                    Society society = new Society();
                    society.setId(UUID.randomUUID().toString()); // Generate unique ID
                    society.setName(fields[0].trim());
                    society.setCity(fields[1].trim());
                    society.setState(fields[2].trim());
                    society.setCountry(fields.length > 3 ? fields[3].trim() : "");
                    society.setStreet(fields.length > 4 ? fields[4].trim() : "");
                    society.setArea(fields.length > 5 ? fields[5].trim() : "");
                    society.setPincode(fields.length > 6 ? fields[6].trim() : "");
                    society.setTotalTowers(fields.length > 7 ? Integer.parseInt(fields[7].trim()) : 0);
                    society.setTotalFlats(fields.length > 8 ? Integer.parseInt(fields[8].trim()) : 0);
                    society.setCreatedAt(System.currentTimeMillis());
                    society.setUpdatedAt(System.currentTimeMillis());
                    society.setActive(true);

                    if (societyRepository.existsByName(society.getName())) {
                        errors.add("Row " + rowNum + ": Society '" + society.getName() + "' already exists");
                        failureCount++;
                        continue;
                    }

                    societyRepository.save(society);
                    successCount++;
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                    failureCount++;
                }
            }

            reader.close();

            result.put("success", failureCount == 0);
            result.put("message", "Bulk upload completed");
            result.put("successCount", successCount);
            result.put("failureCount", failureCount);
            result.put("errors", errors);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error processing file: " + e.getMessage());
            result.put("successCount", 0);
            result.put("failureCount", 0);
            result.put("errors", Arrays.asList(e.getMessage()));
        }

        return result;
    }
}

