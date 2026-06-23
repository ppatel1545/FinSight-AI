package com.finsight.backend.service;

import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.ERole;
import com.finsight.backend.model.Role;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.RoleRepository;
import com.finsight.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Transactional
    public User registerUser(String username, String email, String password) {
        log.debug("Processing request to register user: username={}, email={}", username, email);
        if (userRepository.existsByUsername(username)) {
            log.warn("Registration failed: Username '{}' is already taken!", username);
            throw new IllegalArgumentException("Username is already taken!");
        }

        if (userRepository.existsByEmail(email)) {
            log.warn("Registration failed: Email '{}' is already in use!", email);
            throw new IllegalArgumentException("Email is already in use!");
        }

        // Create new user's account
        User user = new User(username, email, encoder.encode(password));

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> {
                    log.error("Registration failed: Default User Role ROLE_USER is not found in database.");
                    return new RuntimeException("Error: Default User Role is not seeded in database.");
                });
        roles.add(userRole);

        user.setRoles(roles);
        User savedUser = userRepository.save(user);
        log.debug("User registered successfully with ID: {}, username: {}", savedUser.getId(), savedUser.getUsername());
        return savedUser;
    }

    public User getUserByEmail(String email) {
        log.debug("Retrieving user by email: {}", email);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User lookup failed: email '{}' not found", email);
                    return new ResourceNotFoundException("User not found with email: " + email);
                });
    }

    public User getUserById(Long id) {
        log.debug("Retrieving user by ID: {}", id);
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User lookup failed: ID {} not found", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });
    }

    @Transactional
    public String generateResetToken(String email) {
        log.debug("Generating password reset token for email: {}", email);
        User user = getUserByEmail(email);

        String token = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setResetToken(token);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));

        userRepository.save(user);
        log.debug("Generated reset token for user ID: {}, token={}", user.getId(), token);
        return token;
    }

    @Transactional
    public void resetPassword(String email, String token, String newPassword) {
        log.debug("Processing password reset attempt for email: {}", email);
        User user = getUserByEmail(email);

        if (user.getResetToken() == null || !user.getResetToken().equals(token)) {
            log.warn("Password reset failed for email {}: Invalid token", email);
            throw new IllegalArgumentException("Invalid password reset token!");
        }

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            log.warn("Password reset failed for email {}: Token expired", email);
            throw new IllegalArgumentException("Password reset token has expired!");
        }

        user.setPassword(encoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);

        userRepository.save(user);
        log.debug("Password reset successfully for email: {}", email);
    }
}
