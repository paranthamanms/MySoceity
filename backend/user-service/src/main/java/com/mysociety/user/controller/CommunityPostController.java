package com.mysociety.user.controller;

import com.mysociety.user.model.CommunityPost;
import com.mysociety.user.service.CommunityPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/posts/community")
@CrossOrigin(origins = "*")
public class CommunityPostController {
    
    @Autowired
    private CommunityPostService communityPostService;

    /**
     * Create new community post
     */
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody CommunityPost post) {
        try {
            CommunityPost created = communityPostService.createPost(post);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all community posts (with optional filters)
     */
    @GetMapping
    public ResponseEntity<List<CommunityPost>> getAllPosts(
            @RequestParam(required = false) String societyName,
            @RequestParam(required = false) String category) {
        try {
            List<CommunityPost> posts;
            if (societyName != null && !societyName.isEmpty()) {
                posts = communityPostService.getPostsBySociety(societyName);
            } else if (category != null && !category.isEmpty()) {
                posts = communityPostService.getPostsByCategory(category);
            } else {
                posts = communityPostService.getAllPosts();
            }
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get post by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable String id) {
        try {
            CommunityPost post = communityPostService.getPostById(id);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update post
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable String id, 
            @RequestBody CommunityPost post) {
        try {
            CommunityPost updated = communityPostService.updatePost(id, post);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Like a post
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable String id) {
        try {
            CommunityPost liked = communityPostService.likePost(id);
            return ResponseEntity.ok(liked);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete post
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id) {
        try {
            communityPostService.deletePost(id);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

