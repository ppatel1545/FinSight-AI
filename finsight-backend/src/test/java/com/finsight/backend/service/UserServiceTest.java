package com.finsight.backend.service;

import com.finsight.backend.exception.ResourceNotFoundException;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder encoder;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("hashedPassword");
    }

    @Test
    void testGenerateResetToken_UserNotFound() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                userService.generateResetToken("notfound@example.com"));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testGenerateResetToken_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        String token = userService.generateResetToken("test@example.com");

        assertNotNull(token);
        assertEquals(6, token.length());
        assertEquals(token, user.getResetToken());
        assertNotNull(user.getResetTokenExpiry());
        assertTrue(user.getResetTokenExpiry().isAfter(LocalDateTime.now()));
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testResetPassword_UserNotFound() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                userService.resetPassword("notfound@example.com", "123456", "newPassword"));
    }

    @Test
    void testResetPassword_InvalidToken() {
        user.setResetToken("123456");
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                userService.resetPassword("test@example.com", "wrongcode", "newPassword"));

        assertEquals("Invalid password reset token!", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testResetPassword_TokenExpired() {
        user.setResetToken("123456");
        user.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1)); // Expired 1 min ago
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                userService.resetPassword("test@example.com", "123456", "newPassword"));

        assertEquals("Password reset token has expired!", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testResetPassword_Success() {
        user.setResetToken("123456");
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(encoder.encode("newPassword")).thenReturn("newHashedPassword");
        when(userRepository.save(user)).thenReturn(user);

        userService.resetPassword("test@example.com", "123456", "newPassword");

        assertNull(user.getResetToken());
        assertNull(user.getResetTokenExpiry());
        assertEquals("newHashedPassword", user.getPassword());
        verify(userRepository, times(1)).save(user);
    }
}
