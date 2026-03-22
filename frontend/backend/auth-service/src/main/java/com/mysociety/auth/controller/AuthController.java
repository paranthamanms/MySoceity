package com.NammaSociety.auth.controller;

import com.NammaSociety.auth.model.AuthResponse;
import com.NammaSociety.auth.model.LoginRequest;
import com.NammaSociety.auth.model.RegisterRequest;
import com.NammaSociety.auth.model.User;
import com.NammaSociety.auth.service.AuditLogClient;
import com.NammaSociety.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuditLogClient auditLogClient;

    @Autowired
    public AuthController(AuthService authService, AuditLogClient auditLogClient) {
        this.authService = authService;
        this.auditLogClient = auditLogClient;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request,
                                                 HttpServletRequest httpRequest) {
        try {
            User user = authService.register(request);
            String token = authService.generateToken(user.getUsername(), user.getId());

            auditLogClient.logAction(
                "REGISTER",
                user.getId(),
                user.getUsername(),
                "User registration successful",
                getClientIp(httpRequest),
                "User type: " + user.getUserType()
            );

            AuthResponse response = new AuthResponse();
            response.setSuccess(true);
            response.setMessage("Registration successful");
            response.setToken(token);
            response.setUser(user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            auditLogClient.logAction(
                "SYSTEM_ERROR",
                null,
                request.getUsername(),
                "Registration failed",
                getClientIp(httpRequest),
                e.getMessage()
            );
            AuthResponse response = new AuthResponse();
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        try {
            User user = authService.login(request);
            String token = authService.generateToken(user.getUsername(), user.getId());

            auditLogClient.logAction(
                "LOGIN",
                user.getId(),
                user.getUsername(),
                "User login successful",
                getClientIp(httpRequest),
                "Dashboard access granted"
            );

            AuthResponse response = new AuthResponse();
            response.setSuccess(true);
            response.setMessage("Login successful");
            response.setToken(token);
            response.setUser(user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            auditLogClient.logAction(
                "SYSTEM_ERROR",
                null,
                request.getUsername(),
                "Login failed",
                getClientIp(httpRequest),
                e.getMessage()
            );
            AuthResponse response = new AuthResponse();
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.put("valid", false);
            response.put("message", "Invalid token format");
            return ResponseEntity.badRequest().body(response);
        }

        String token = authHeader.substring(7);
        boolean isValid = authService.validateToken(token);

        if (isValid) {
            String username = authService.getUsernameFromToken(token);
            String userId = authService.getUserIdFromToken(token);
            response.put("valid", true);
            response.put("username", username);
            response.put("userId", userId);
            return ResponseEntity.ok(response);
        } else {
            response.put("valid", false);
            response.put("message", "Invalid or expired token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest httpRequest) {
        Map<String, Object> response = new HashMap<>();
        String username = "unknown";
        String userId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            username = authService.getUsernameFromToken(token);
            userId = authService.getUserIdFromToken(token);
        }

        auditLogClient.logAction(
            "LOGOUT",
            userId,
            username,
            "User logout",
            getClientIp(httpRequest),
            "Session ended"
        );
        response.put("success", true);
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }

    /**
     * Check if user password needs to be reset (for first-time admin login)
     */
    @PostMapping("/check-password-reset")
    public ResponseEntity<Map<String, Object>> checkPasswordReset(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("success", false);
                response.put("message", "Invalid token");
                return ResponseEntity.badRequest().body(response);
            }

            String token = authHeader.substring(7);
            String username = authService.getUsernameFromToken(token);
            User user = authService.getUserByUsername(username);

            if (user != null && user.isDefaultPassword()) {
                response.put("success", true);
                response.put("requiresPasswordReset", true);
                response.put("message", "Password reset required");
                return ResponseEntity.ok(response);
            }

            response.put("success", true);
            response.put("requiresPasswordReset", false);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error checking password status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Change password (for users with default password)
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("success", false);
                response.put("message", "Invalid token");
                return ResponseEntity.badRequest().body(response);
            }

            String token = authHeader.substring(7);
            String username = authService.getUsernameFromToken(token);
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");

            if (currentPassword == null || newPassword == null || confirmPassword == null) {
                response.put("success", false);
                response.put("message", "All password fields are required");
                return ResponseEntity.badRequest().body(response);
            }

            if (!newPassword.equals(confirmPassword)) {
                response.put("success", false);
                response.put("message", "New passwords do not match");
                return ResponseEntity.badRequest().body(response);
            }

            if (newPassword.length() < 6) {
                response.put("success", false);
                response.put("message", "New password must be at least 6 characters");
                return ResponseEntity.badRequest().body(response);
            }

            User user = authService.getUserByUsername(username);
            if (user == null) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.notFound().build();
            }

            // Verify current password
            if (!authService.verifyPassword(currentPassword, user.getPassword())) {
                response.put("success", false);
                response.put("message", "Current password is incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Update password
            authService.updatePassword(username, newPassword);

            // Mark default password flag as false
            user.setDefaultPassword(false);
            user.setUpdatedAt(System.currentTimeMillis());
            authService.updateUser(user);

            auditLogClient.logAction(
                "PASSWORD_CHANGE",
                user.getId(),
                user.getUsername(),
                "Password changed successfully",
                getClientIp(httpRequest),
                "Default password updated"
            );

            response.put("success", true);
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            auditLogClient.logAction(
                "SYSTEM_ERROR",
                null,
                "unknown",
                "Password change failed",
                getClientIp(httpRequest),
                e.getMessage()
            );
            response.put("success", false);
            response.put("message", "Error changing password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Create user from admin dashboard (for user-service to call)
     */
    @PostMapping("/admin/create-user")
    public ResponseEntity<Map<String, Object>> adminCreateUser(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = new User();
            user.setUsername((String) request.get("username"));
            user.setEmail((String) request.get("email"));
            user.setPassword((String) request.get("password"));
            user.setUserType((String) request.get("userType"));
            user.setOwnerType((String) request.get("ownerType"));
            user.setTowerNumber((String) request.get("towerNumber"));
            user.setFlatNumber((String) request.get("flatNumber"));
            user.setSocietyName((String) request.get("societyName"));
            user.setActive(true);
            user.setRole("USER");
            user.setDefaultPassword(true); // Force password change on first login for admin-created users
            user.setCreatedAt(System.currentTimeMillis());
            user.setUpdatedAt(System.currentTimeMillis());

            User createdUser = authService.registerUser(user);
            
            response.put("success", true);
            response.put("message", "User created successfully in auth service");
            response.put("userId", createdUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Update user status (active/inactive) from user-service
     */
    @PatchMapping("/users/{username}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(@PathVariable String username, @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = authService.getUserByUsername(username);
            if (user == null) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(404).body(response);
            }
            
            boolean isActive = (boolean) request.get("active");
            user.setActive(isActive);
            user.setUpdatedAt(System.currentTimeMillis());
            
            User updated = authService.updateUser(user);
            
            response.put("success", true);
            response.put("message", "User status updated successfully");
            response.put("data", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "Auth Service is running");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin-check")
    public ResponseEntity<Map<String, Object>> checkAdminUser() {
        Map<String, Object> response = new HashMap<>();
        try {
            User adminUser = authService.getUserByUsername("admin");
            if (adminUser != null) {
                response.put("adminExists", true);
                response.put("adminUsername", adminUser.getUsername());
                response.put("adminEmail", adminUser.getEmail());
                response.put("adminRole", adminUser.getRole());
                response.put("requiresPasswordReset", adminUser.isDefaultPassword());
                response.put("message", "Admin user exists and is ready for login");
            } else {
                response.put("adminExists", false);
                response.put("message", "Admin user not found - initialization may have failed");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Error checking admin user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/debug/all-users")
    public ResponseEntity<Map<String, Object>> debugGetAllUsers() {
        Map<String, Object> response = new HashMap<>();
        try {
            response.put("success", true);
            response.put("message", "All users in system");
            response.put("users", authService.getAllUsers());
            response.put("totalCount", authService.getAllUsers().size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error fetching users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/debug/test-login")
    public ResponseEntity<Map<String, Object>> debugTestLogin(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();
        System.out.println("\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
        System.out.println("â•‘         DEBUG TEST LOGIN ENDPOINT                            â•‘");
        System.out.println("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n");
        
        try {
            System.out.println("[DEBUG-LOGIN] Received login request:");
            System.out.println("[DEBUG-LOGIN]   Username: " + request.getUsername());
            System.out.println("[DEBUG-LOGIN]   Password: " + request.getPassword());
            
            User user = authService.login(request);
            String token = authService.generateToken(user.getUsername(), user.getId());
            
            response.put("success", true);
            response.put("message", "Debug login successful");
            response.put("token", token);
            response.put("user", user);
            
            System.out.println("[DEBUG-LOGIN] âœ“ Login successful!\n");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("[DEBUG-LOGIN] âœ— Login failed!");
            System.out.println("[DEBUG-LOGIN] Error: " + e.getMessage());
            System.out.println();
            
            response.put("success", false);
            response.put("message", "Debug login failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}

