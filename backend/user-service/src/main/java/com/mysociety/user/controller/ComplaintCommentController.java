package com.mysociety.user.controller;

import com.mysociety.user.model.ComplaintComment;
import com.mysociety.user.service.ComplaintCommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintCommentController {
    
    @Autowired
    private ComplaintCommentService service;
    
    @PostMapping("/{complaintId}/comments")
    public ResponseEntity<?> addComment(@PathVariable String complaintId, @RequestBody ComplaintComment comment) {
        try {
            comment.setComplaintId(complaintId);
            ComplaintComment created = service.createComment(comment);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{complaintId}/comments")
    public ResponseEntity<?> getComments(@PathVariable String complaintId) {
        try {
            List<ComplaintComment> comments = service.getCommentsByComplaintId(complaintId);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{complaintId}/comments/count")
    public ResponseEntity<?> getCommentCount(@PathVariable String complaintId) {
        try {
            long count = service.getCommentCount(complaintId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable String commentId, @RequestBody ComplaintComment comment) {
        try {
            ComplaintComment updated = service.updateComment(commentId, comment);
            if (updated != null) {
                return ResponseEntity.ok(updated);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable String commentId) {
        try {
            boolean deleted = service.deleteComment(commentId);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

