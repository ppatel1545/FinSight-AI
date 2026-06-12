package com.finsight.backend.config;

import com.finsight.backend.model.ERole;
import com.finsight.backend.model.Role;
import com.finsight.backend.model.User;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.CategoryType;
import com.finsight.backend.repository.RoleRepository;
import com.finsight.backend.repository.UserRepository;
import com.finsight.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${finsight.admin.username}")
    private String adminUsername;

    @Value("${finsight.admin.email}")
    private String adminEmail;

    @Value("${finsight.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed default roles if they do not exist
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_USER)));
        
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_ADMIN)));

        // 2. Seed default admin user if not present
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setIsActive(true);

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);

            userRepository.save(admin);
            System.out.println(">> Seeded default admin account: " + adminEmail);
        }

        // 3. Seed default system categories if they do not exist
        seedDefaultCategory("Salary", CategoryType.INCOME, "#10b981", "Briefcase");
        seedDefaultCategory("Freelance", CategoryType.INCOME, "#06b6d4", "Laptop");
        seedDefaultCategory("Investments", CategoryType.INCOME, "#14b8a6", "TrendingUp");
        seedDefaultCategory("Other Income", CategoryType.INCOME, "#84cc16", "PlusCircle");

        seedDefaultCategory("Food & Dining", CategoryType.EXPENSE, "#f97316", "Utensils");
        seedDefaultCategory("Rent & Housing", CategoryType.EXPENSE, "#ef4444", "Home");
        seedDefaultCategory("Utilities", CategoryType.EXPENSE, "#eab308", "Zap");
        seedDefaultCategory("Transportation", CategoryType.EXPENSE, "#3b82f6", "Car");
        seedDefaultCategory("Entertainment", CategoryType.EXPENSE, "#a855f7", "Film");
        seedDefaultCategory("Medical & Health", CategoryType.EXPENSE, "#ec4899", "HeartPulse");
        seedDefaultCategory("Shopping", CategoryType.EXPENSE, "#6366f1", "ShoppingBag");
    }

    private void seedDefaultCategory(String name, CategoryType type, String colorCode, String iconName) {
        if (!categoryRepository.existsByNameAndTypeAndUserOrIsCustomFalse(name, type, null)) {
            Category category = new Category(name, type, colorCode, iconName, false, null);
            categoryRepository.save(category);
            System.out.println(">> Seeded default system category: " + name + " (" + type + ")");
        }
    }
}
