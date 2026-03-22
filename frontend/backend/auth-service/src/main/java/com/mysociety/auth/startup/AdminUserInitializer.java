package com.NammaSociety.auth.startup;

import com.NammaSociety.auth.model.User;
import com.NammaSociety.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class AdminUserInitializer implements CommandLineRunner {

    @Autowired
    private AuthService authService;

    @Override
    public void run(String... args) throws Exception {
        createDefaultAdminUser();
    }

    /**
     * Create default admin user if it doesn't exist
     */
    private void createDefaultAdminUser() {
        try {
            // Check if admin user already exists
            System.out.println("\n[AdminInit] Checking for existing admin user...");
            User existingAdmin = authService.getUserByUsername("admin");
            if (existingAdmin != null) {
                System.out.println("[AdminInit] Admin user found! Details:");
                System.out.println("  - ID: " + existingAdmin.getId());
                System.out.println("  - Username: " + existingAdmin.getUsername());
                System.out.println("  - Email: " + existingAdmin.getEmail());
                System.out.println("  - Role: " + existingAdmin.getRole());
                System.out.println("  - Active: " + existingAdmin.isActive());
                System.out.println("  - Password set: " + (existingAdmin.getPassword() != null ? "YES" : "NO"));
                System.out.println("  - Default password: " + existingAdmin.isDefaultPassword());
                System.out.println("[AdminInit] Skipping creation - user already exists.\n");
                return;
            }

            System.out.println("[AdminInit] No admin found. Creating new admin user...");

            // Create default admin user
            User adminUser = new User();
            adminUser.setId(UUID.randomUUID().toString());
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@NammaSociety.local");
            adminUser.setPassword("admin@123");
            adminUser.setUserType("admin");
            adminUser.setOwnerType(null);
            adminUser.setTowerNumber("ADMIN");
            adminUser.setFlatNumber("00");
            adminUser.setActive(true);
            adminUser.setRole("ADMIN");
            adminUser.setDefaultPassword(true);
            adminUser.setCreatedAt(System.currentTimeMillis());
            adminUser.setUpdatedAt(System.currentTimeMillis());

            System.out.println("[AdminInit] Calling authService.registerUser()...");
            // Save admin user (password will be encoded by registerUser method)
            User savedAdmin = authService.registerUser(adminUser);
            
            System.out.println("[AdminInit] Admin user saved successfully!");
            System.out.println("[AdminInit] Saved ID: " + savedAdmin.getId());
            System.out.println("[AdminInit] Password encoded: " + (savedAdmin.getPassword() != null && !savedAdmin.getPassword().isEmpty() ? "YES" : "NO"));
            System.out.println("[AdminInit] Verifying user can be retrieved...");

            System.out.println("\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
            System.out.println("â•‘  âœ“ DEFAULT ADMIN USER CREATED SUCCESSFULLY              â•‘");
            System.out.println("â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£");
            System.out.println("â•‘                                                      â•‘");
            System.out.println("â•‘  USERNAME:  admin                                    â•‘");
            System.out.println("â•‘  PASSWORD:  admin@123                                â•‘");
            System.out.println("â•‘  EMAIL:     admin@NammaSociety.local                    â•‘");
            System.out.println("â•‘  ROLE:      ADMIN                                    â•‘");
            System.out.println("â•‘                                                      â•‘");
            System.out.println("â•‘  LOGIN URL: http://localhost:50777                  â•‘");
            System.out.println("â•‘                                                      â•‘");
            System.out.println("â•‘  ON FIRST LOGIN:                                     â•‘");
            System.out.println("â•‘  â€¢ Password reset will be REQUIRED                   â•‘");
            System.out.println("â•‘  â€¢ Choose a strong password (8+ characters)          â•‘");
            System.out.println("â•‘  â€¢ Then access Admin Console from Dashboard          â•‘");
            System.out.println("â•‘                                                      â•‘");
            System.out.println("â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n");

        } catch (Exception e) {
            System.err.println("\n[ERROR] Failed to create admin user!");
            System.err.println("Exception Type: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            System.err.println("\nPossible Causes:");
            System.err.println("  - Admin user already exists from previous startup");
            System.err.println("  - Username 'admin' already in database");
            System.err.println("  - Email 'admin@NammaSociety.local' already in database");
            System.err.println("  - Password encoder not properly configured\n");
            System.err.println("Quick Fix:");
            System.err.println("  1. Check if admin exists: http://localhost:8001/api/auth/admin-check");
            System.err.println("  2. List all users: http://localhost:8001/api/auth/debug/all-users");
            System.err.println("  3. Try login: admin / admin@123\n");
            System.err.println("Full Error:\n");
            e.printStackTrace();
        }
    }
}

