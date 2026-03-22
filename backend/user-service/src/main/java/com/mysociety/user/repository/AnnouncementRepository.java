package com.mysociety.user.repository;

import com.mysociety.user.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, String> {
    
    List<Announcement> findBySocietyNameIgnoreCaseAndActiveOrderByCreatedAtDesc(String societyName, boolean active);
    
    List<Announcement> findByActiveOrderByCreatedAtDesc(boolean active);
    
    default List<Announcement> findBySocietyName(String societyName) {
        return findBySocietyNameIgnoreCaseAndActiveOrderByCreatedAtDesc(societyName, true);
    }
    
    default List<Announcement> findAllActive() {
        return findByActiveOrderByCreatedAtDesc(true);
    }
}

