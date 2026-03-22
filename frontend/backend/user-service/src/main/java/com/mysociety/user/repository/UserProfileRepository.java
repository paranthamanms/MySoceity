package com.NammaSociety.user.repository;

import com.NammaSociety.user.model.UserProfile;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory repository for UserProfile data
 * This serves as a placeholder for future database integration
 */
@Repository
public class UserProfileRepository {
    private final Map<String, UserProfile> profiles = new ConcurrentHashMap<>();

    public UserProfile save(UserProfile profile) {
        if (profile.getCreatedAt() == 0) {
            profile.setCreatedAt(System.currentTimeMillis());
        }
        profile.setUpdatedAt(System.currentTimeMillis());
        profiles.put(profile.getUserId(), profile);
        return profile;
    }

    public Optional<UserProfile> findById(String userId) {
        return Optional.ofNullable(profiles.get(userId));
    }

    public Optional<UserProfile> findByUsername(String username) {
        return profiles.values().stream()
                .filter(p -> p.getUsername().equals(username))
                .findFirst();
    }

    public List<UserProfile> findAll() {
        return new ArrayList<>(profiles.values());
    }

    public void deleteById(String userId) {
        profiles.remove(userId);
    }

    public boolean existsById(String userId) {
        return profiles.containsKey(userId);
    }
}

