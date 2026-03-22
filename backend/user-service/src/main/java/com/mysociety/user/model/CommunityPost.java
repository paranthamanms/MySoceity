package com.mysociety.user.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "community_posts")
public class CommunityPost implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "society_name", nullable = false, length = 255)
    private String societyName;
    
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "category", length = 50)
    private String category; // EVENT, SALE, HELP_WANTED, GENERAL
    
    @Column(name = "author_id", length = 50)
    private String authorId;
    
    @Column(name = "author_name", length = 255)
    private String authorName;
    
    @ElementCollection
    @CollectionTable(name = "community_post_images", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "image_url", length = 500)
    private List<String> imageUrls;
    
    @Column(name = "likes_count", nullable = false)
    private int likesCount;
    
    @Column(name = "comments_count", nullable = false)
    private int commentsCount;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;
    
    @Column(name = "active", nullable = false)
    private boolean active;

    // Transient fields for notification preferences (not stored in DB)
    @Transient
    private boolean sendEmail;
    
    @Transient
    private boolean sendSMS;

    public CommunityPost() {
        this.imageUrls = new ArrayList<>();
        this.sendEmail = false;
        this.sendSMS = false;
    }

    public CommunityPost(String id, String societyName, String title, String content,
                        String category, String authorId, String authorName,
                        List<String> imageUrls, int likesCount, int commentsCount,
                        long createdAt, long updatedAt, boolean active) {
        this.id = id;
        this.societyName = societyName;
        this.title = title;
        this.content = content;
        this.category = category;
        this.authorId = authorId;
        this.authorName = authorName;
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        this.likesCount = likesCount;
        this.commentsCount = commentsCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.active = active;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSocietyName() { return societyName; }
    public void setSocietyName(String societyName) { this.societyName = societyName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }

    public int getCommentsCount() { return commentsCount; }
    public void setCommentsCount(int commentsCount) { this.commentsCount = commentsCount; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isSendEmail() { return sendEmail; }
    public void setSendEmail(boolean sendEmail) { this.sendEmail = sendEmail; }

    public boolean isSendSMS() { return sendSMS; }
    public void setSendSMS(boolean sendSMS) { this.sendSMS = sendSMS; }
}

