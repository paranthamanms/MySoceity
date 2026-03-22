package com.mysociety.user.service;

import com.mysociety.user.model.PostComment;
import com.mysociety.user.repository.PostCommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PostCommentService {
    
    @Autowired
    private PostCommentRepository repository;
    
    public PostComment createComment(PostComment comment) {
        if (comment.getId() == null || comment.getId().isEmpty()) {
            comment.setId(UUID.randomUUID().toString());
        }
        long now = System.currentTimeMillis();
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);
        comment.setActive(true);
        comment.setLikesCount(0);
        return repository.save(comment);
    }
    
    public List<PostComment> getCommentsByPostId(String postId) {
        return repository.findByPostIdAndActiveOrderByCreatedAtAsc(postId, true);
    }
    
    public long getCommentCount(String postId) {
        return repository.countByPostIdAndActive(postId, true);
    }
    
    public List<PostComment> getRepliesByParentCommentId(String parentCommentId) {
        return repository.findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);
    }
    
    public PostComment updateComment(String id, PostComment updatedComment) {
        return repository.findById(id)
            .map(comment -> {
                comment.setCommentText(updatedComment.getCommentText());
                comment.setUpdatedAt(System.currentTimeMillis());
                return repository.save(comment);
            })
            .orElse(null);
    }
    
    public boolean deleteComment(String id) {
        return repository.findById(id)
            .map(comment -> {
                comment.setActive(false);
                comment.setUpdatedAt(System.currentTimeMillis());
                repository.save(comment);
                return true;
            })
            .orElse(false);
    }
    
    public PostComment likeComment(String id) {
        return repository.findById(id)
            .map(comment -> {
                comment.setLikesCount(comment.getLikesCount() + 1);
                comment.setUpdatedAt(System.currentTimeMillis());
                return repository.save(comment);
            })
            .orElse(null);
    }
}

