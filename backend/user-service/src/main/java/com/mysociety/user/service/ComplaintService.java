package com.mysociety.user.service;

import com.mysociety.user.model.Complaint;
import com.mysociety.user.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ComplaintService {
    
    @Autowired
    private ComplaintRepository complaintRepository;

    public Complaint createComplaint(Complaint complaint) {
        if (complaint.getId() == null || complaint.getId().isEmpty()) {
            complaint.setId(java.util.UUID.randomUUID().toString());
        }
        complaint.setCreatedAt(System.currentTimeMillis());
        complaint.setUpdatedAt(System.currentTimeMillis());
        complaint.setStatus("OPEN");
        return complaintRepository.save(complaint);
    }

    public Complaint updateComplaint(String id, Complaint complaint) throws Exception {
        Complaint existing = complaintRepository.findById(id)
                .orElseThrow(() -> new Exception("Complaint not found"));
        
        existing.setTitle(complaint.getTitle());
        existing.setDescription(complaint.getDescription());
        existing.setCategory(complaint.getCategory());
        existing.setStatus(complaint.getStatus());
        existing.setAssignedTo(complaint.getAssignedTo());
        
        if ("RESOLVED".equals(complaint.getStatus()) || "CLOSED".equals(complaint.getStatus())) {
            existing.setResolvedAt(System.currentTimeMillis());
        }
        
        existing.setUpdatedAt(System.currentTimeMillis());
        
        return complaintRepository.save(existing);
    }

    public Complaint getComplaintById(String id) throws Exception {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new Exception("Complaint not found"));
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public List<Complaint> getComplaintsBySociety(String societyName) {
        return complaintRepository.findBySocietyName(societyName);
    }

    public List<Complaint> getComplaintsByStatus(String status) {
        return complaintRepository.findByStatus(status);
    }

    public void deleteComplaint(String id) throws Exception {
        if (!complaintRepository.findById(id).isPresent()) {
            throw new Exception("Complaint not found");
        }
        complaintRepository.deleteById(id);
    }
}

