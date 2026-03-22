package com.NammaSociety.auth.service;

import com.NammaSociety.auth.model.User;
import com.NammaSociety.auth.model.LoginRequest;
import com.NammaSociety.auth.model.RegisterRequest;
import com.NammaSociety.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AuthService {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public User register(RegisterRequest request) throws Exception {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new Exception("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new Exception("Email already exists");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new Exception("Passwords do not match");
        }

        User user = new User();
        user.setId(java.util.UUID.randomUUID().toString()); // Generate UUID for new user
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setUserType(request.getUserType());
        user.setOwnerType(request.getOwnerType());
        user.setTowerNumber(request.getTowerNumber());
        user.setFlatNumber(request.getFlatNumber());
        user.setActive(true);
        user.setRole("USER"); // Default role for regular users
        user.setDefaultPassword(false); // Regular users set their own password
        user.setCreatedAt(System.currentTimeMillis());
        user.setUpdatedAt(System.currentTimeMillis());

        return userRepository.save(user);
    }

    public User login(LoginRequest request) throws Exception {
        System.out.println("\n[AuthService.login] Login attempt for username: " + request.getUsername());
        
        // Check all users in repo
        List<User> allUsers = userRepository.findAll();
        System.out.println("[AuthService.login] Total users in repository: " + allUsers.size());
        for (User u : allUsers) {
            System.out.println("[AuthService.login]   - User: " + u.getUsername() + " (ID: " + u.getId() + ")");
        }
        
        // Try to find the user
        System.out.println("[AuthService.login] Searching for user: " + request.getUsername());
        var userOptional = userRepository.findByUsername(request.getUsername());
        
        if (!userOptional.isPresent()) {
            System.out.println("[AuthService.login] ERROR: User not found in repository!");
            throw new Exception("User not found");
        }
        
        User user = userOptional.get();
        System.out.println("[AuthService.login] User found: " + user.getUsername());
        System.out.println("[AuthService.login] Password in DB (encoded): " + (user.getPassword() != null ? user.getPassword().substring(0, Math.min(20, user.getPassword().length())) + "..." : "NULL"));
        System.out.println("[AuthService.login] Password from request: " + request.getPassword());
        System.out.println("[AuthService.login] Verifying password...");

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            System.out.println("[AuthService.login] ERROR: Password mismatch!");
            throw new Exception("Invalid credentials");
        }

        // Check if user is active
        if (!user.isActive()) {
            System.out.println("[AuthService.login] ERROR: User account is deactivated!");
            throw new Exception("User account is deactivated. Please contact administrator.");
        }

        // Ensure societyName is populated for security users
        if ((user.getUserType() != null && user.getUserType().equalsIgnoreCase("SECURITY")) && (user.getSocietyName() == null || user.getSocietyName().isEmpty())) {
            // Try to fetch society name from DB or assign default
            // Example: fetch by flat/tower or other logic as needed
            // For now, assign a placeholder or fetch from another source
                String societyName = userRepository.findById(user.getId())
                    .map(User::getSocietyName)
                    .orElse("Unknown Society");
                user.setSocietyName(societyName);
                System.out.println("[AuthService.login] Society name set for security user: " + societyName);
        }

        System.out.println("[AuthService.login] Password verified! User is active. Login successful.\n");
        return user;
    }

    public String generateToken(String username, String userId) {
        return jwtTokenProvider.generateToken(username, userId);
    }

    public boolean validateToken(String token) {
        return jwtTokenProvider.validateToken(token);
    }

    public String getUsernameFromToken(String token) {
        return jwtTokenProvider.getUsernameFromToken(token);
    }

    public String getUserIdFromToken(String token) {
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    public User getUserById(String id) throws Exception {
        return userRepository.findById(id)
                .orElseThrow(() -> new Exception("User not found"));
    }

    /**
     * Get user by username
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    /**
     * Verify if password matches encoded password
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    /**
     * Update user password
     */
    public void updatePassword(String username, String newPassword) throws Exception {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(System.currentTimeMillis());
        userRepository.save(user);
    }

    /**
     * Update user information
     */
    public User updateUser(User user) {
        user.setUpdatedAt(System.currentTimeMillis());
        return userRepository.save(user);
    }

    /**
     * Register a user (used by admin initializer)
     */
    public User registerUser(User user) throws Exception {
        System.out.println("\n[AuthService.registerUser] Registering user: " + user.getUsername());
        System.out.println("[AuthService.registerUser] Email: " + user.getEmail());
        System.out.println("[AuthService.registerUser] Role: " + user.getRole());
        
        if (userRepository.existsByUsername(user.getUsername())) {
            System.out.println("[AuthService.registerUser] ERROR: Username already exists!");
            throw new Exception("Username already exists");
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            System.out.println("[AuthService.registerUser] ERROR: Email already exists!");
            throw new Exception("Email already exists");
        }

        // Generate UUID if not already set
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId(java.util.UUID.randomUUID().toString());
        }

        System.out.println("[AuthService.registerUser] Encoding password...");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        System.out.println("[AuthService.registerUser] Password encoded (first 20 chars): " + user.getPassword().substring(0, 20) + "...");
        
        user.setRole(user.getRole() != null ? user.getRole() : "USER");
        
        System.out.println("[AuthService.registerUser] Saving user to repository...");
        User savedUser = userRepository.save(user);
        System.out.println("[AuthService.registerUser] User saved successfully!");
        System.out.println("[AuthService.registerUser] Saved user ID: " + savedUser.getId());
        System.out.println("[AuthService.registerUser] Saved user username: " + savedUser.getUsername());
        System.out.println("[AuthService.registerUser] Verifying user can be retrieved...");
        
        User verifyUser = userRepository.findByUsername(user.getUsername()).orElse(null);
        if (verifyUser != null) {
            System.out.println("[AuthService.registerUser] âœ“ User verified in repository!");
        } else {
            System.out.println("[AuthService.registerUser] âœ— ERROR: User not found after save!");
        }
        
        System.out.println();
        return savedUser;
    }

    /**
     * Get all users (for debugging)
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}

