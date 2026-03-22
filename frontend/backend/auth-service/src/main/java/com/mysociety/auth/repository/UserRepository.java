package com.NammaSociety.auth.repository;

import com.NammaSociety.auth.model.User;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-memory repository for User data
 * This serves as a placeholder for future database integration
 */
@Repository
public class UserRepository {
    private final Map<String, User> users = new ConcurrentHashMap<>();

    public User save(User user) {
        System.out.println("[UserRepository.save] Saving user: " + user.getUsername());
        System.out.println("[UserRepository.save] User ID: " + user.getId());
        System.out.println("[UserRepository.save] Current repo size before save: " + users.size());
        
        if (user.getId() == null) {
            user.setId(java.util.UUID.randomUUID().toString());
            user.setCreatedAt(System.currentTimeMillis());
            System.out.println("[UserRepository.save] New user - generated ID: " + user.getId());
        }
        user.setUpdatedAt(System.currentTimeMillis());
        
        users.put(user.getId(), user);
        System.out.println("[UserRepository.save] User saved to map with ID key: " + user.getId());
        System.out.println("[UserRepository.save] Repository size after save: " + users.size());
        System.out.println("[UserRepository.save] All usernames in repo: " + users.values().stream().map(u -> u.getUsername()).collect(Collectors.toList()));
        
        return user;
    }

    public Optional<User> findById(String id) {
        return Optional.ofNullable(users.get(id));
    }

    public Optional<User> findByUsername(String username) {
        System.out.println("\n[UserRepository.findByUsername] Searching for username: " + username);
        System.out.println("[UserRepository.findByUsername] Total users in map: " + users.size());
        System.out.println("[UserRepository.findByUsername] User IDs in map: " + users.keySet());
        System.out.println("[UserRepository.findByUsername] Usernames in map: " + users.values().stream().map(User::getUsername).collect(Collectors.toList()));
        
        Optional<User> result = users.values().stream()
                .filter(u -> u.getUsername().equals(username))
                .findFirst();
        
        if (result.isPresent()) {
            System.out.println("[UserRepository.findByUsername] âœ“ User found!");
        } else {
            System.out.println("[UserRepository.findByUsername] âœ— User NOT found!");
        }
        return result;
    }

    public Optional<User> findByEmail(String email) {
        return users.values().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst();
    }

    public List<User> findAll() {
        return new ArrayList<>(users.values());
    }

    public void deleteById(String id) {
        users.remove(id);
    }

    public boolean existsByUsername(String username) {
        return users.values().stream()
                .anyMatch(u -> u.getUsername().equals(username));
    }

    public boolean existsByEmail(String email) {
        return users.values().stream()
                .anyMatch(u -> u.getEmail().equals(email));
    }
}

