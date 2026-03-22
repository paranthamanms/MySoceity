package com.mysociety.user.controller;

import com.mysociety.user.model.PostComment;
import com.mysociety.user.service.PostCommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostCommentController {
    
    @Autowired
    private PostCommentService service;
    
    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable String postId, @RequestBody PostComment comment) {
        try {
            comment.setPostId(postId);
            PostComment created = service.createComment(comment);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{postId}/comments")
    public ResponseEntity<?> getComments(@PathVariable String postId) {
        try {
            List<PostComment> comments = service.getCommentsByPostId(postId);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{postId}/comments/count")
    public ResponseEntity<?> getCommentCount(@PathVariable String postId) {
        try {
            long count = service.getCommentCount(postId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/comments/{parentCommentId}/replies")
    public ResponseEntity<?> getReplies(@PathVariable String parentCommentId) {
        try {
            List<PostComment> replies = service.getRepliesByParentCommentId(parentCommentId);
            return ResponseEntity.ok(replies);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable String commentId, @RequestBody PostComment comment) {
        try {
            PostComment updated = service.updateComment(commentId, comment);
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
    
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> likeComment(@PathVariable String commentId) {
        try {
            PostComment liked = service.likeComment(commentId);
            if (liked != null) {
                return ResponseEntity.ok(liked);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

