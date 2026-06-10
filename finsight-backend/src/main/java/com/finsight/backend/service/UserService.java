package com.finsight.backend.service;

import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.ERole;
import com.finsight.backend.model.Role;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.RoleRepository;
import com.finsight.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

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
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken!");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        // Create new user's account
        User user = new User(username, email, encoder.encode(password));

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Error: Default User Role is not seeded in database."));
        roles.add(userRole);

        user.setRoles(roles);
        return userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
