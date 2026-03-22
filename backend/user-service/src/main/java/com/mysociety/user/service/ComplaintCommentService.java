package com.mysociety.user.service;

import com.mysociety.user.model.ComplaintComment;
import com.mysociety.user.repository.ComplaintCommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ComplaintCommentService {
    
    @Autowired
    private ComplaintCommentRepository repository;
    
    public ComplaintComment createComment(ComplaintComment comment) {
        if (comment.getId() == null || comment.getId().isEmpty()) {
            comment.setId(UUID.randomUUID().toString());
        }
        long now = System.currentTimeMillis();
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);
        return repository.save(comment);
    }
    
    public List<ComplaintComment> getCommentsByComplaintId(String complaintId) {
        return repository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
    }
    
    public long getCommentCount(String complaintId) {
        return repository.countByComplaintId(complaintId);
    }
    
    public ComplaintComment updateComment(String id, ComplaintComment updatedComment) {
        return repository.findById(id)
            .map(comment -> {
                comment.setCommentText(updatedComment.getCommentText());
                comment.setUpdatedAt(System.currentTimeMillis());
                return repository.save(comment);
            })
            .orElse(null);
    }
    
    public boolean deleteComment(String id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}

