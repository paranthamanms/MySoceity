package com.mysociety.user.repository;

import com.mysociety.user.model.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, String> {
    
    List<CommunityPost> findBySocietyNameIgnoreCaseAndActiveOrderByCreatedAtDesc(String societyName, boolean active);
    
    List<CommunityPost> findByCategoryIgnoreCaseAndActiveOrderByCreatedAtDesc(String category, boolean active);
    
    default List<CommunityPost> findBySocietyName(String societyName) {
        return findBySocietyNameIgnoreCaseAndActiveOrderByCreatedAtDesc(societyName, true);
    }
    
    default List<CommunityPost> findByCategory(String category) {
        return findByCategoryIgnoreCaseAndActiveOrderByCreatedAtDesc(category, true);
    }
}

