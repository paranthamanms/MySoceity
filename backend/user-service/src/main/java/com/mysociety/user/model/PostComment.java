package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "post_comments")
public class PostComment implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "post_id", nullable = false, length = 50)
    private String postId;
    
    @Column(name = "author_id", length = 50)
    private String authorId;
    
    @Column(name = "author_name", nullable = false, length = 255)
    private String authorName;
    
    @Column(name = "author_role", length = 50)
    private String authorRole; // USER, SOCIETY_ADMIN, SUPER_ADMIN
    
    @Column(name = "comment_text", columnDefinition = "TEXT", nullable = false)
    private String commentText;
    
    @Column(name = "parent_comment_id", length = 50)
    private String parentCommentId; // For nested replies
    
    @Column(name = "likes_count", nullable = false)
    private int likesCount;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;
    
    @Column(name = "active", nullable = false)
    private boolean active;

    public PostComment() {}

    public PostComment(String id, String postId, String authorId, String authorName,
                      String authorRole, String commentText, String parentCommentId,
                      int likesCount, long createdAt, long updatedAt, boolean active) {
        this.id = id;
        this.postId = postId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorRole = authorRole;
        this.commentText = commentText;
        this.parentCommentId = parentCommentId;
        this.likesCount = likesCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.active = active;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public String getCommentText() { return commentText; }
    public void setCommentText(String commentText) { this.commentText = commentText; }

    public String getParentCommentId() { return parentCommentId; }
    public void setParentCommentId(String parentCommentId) { this.parentCommentId = parentCommentId; }

    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

