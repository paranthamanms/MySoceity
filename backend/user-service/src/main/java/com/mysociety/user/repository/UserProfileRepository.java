package com.mysociety.user.repository;

import com.mysociety.user.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

/**
 * JPA repository for UserProfile database persistence
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, String> {
    Optional<UserProfile> findByUsername(String username);
    List<UserProfile> findByUserType(String userType);
    List<UserProfile> findBySocietyName(String societyName);
    boolean existsByUsername(String username);
}

