package com.finsight.backend.service;

import com.finsight.backend.exception.TokenRefreshException;
import com.finsight.backend.model.RefreshToken;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.RefreshTokenRepository;
import com.finsight.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class RefreshTokenService {
    @Value("${finsight.jwt.refresh-expiration-ms}")
    private Long refreshTokenDurationMs;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    public Optional<RefreshToken> findByToken(String token) {
        log.debug("Looking up refresh token in database");
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        log.debug("Creating refresh token for user ID: {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> {
            log.error("Failed to create refresh token: user ID {} not found", userId);
            return new RuntimeException("User not found");
        });
        
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElseGet(() -> {
                    log.debug("Creating new refresh token record for user ID: {}", userId);
                    RefreshToken token = new RefreshToken();
                    token.setUser(user);
                    return token;
                });
        
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));

        RefreshToken savedToken = refreshTokenRepository.save(refreshToken);
        log.debug("Refresh token successfully saved in database for user ID: {}", userId);
        return savedToken;
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        log.debug("Verifying expiration of refresh token");
        if (token.getExpiryDate().isBefore(Instant.now())) {
            log.warn("Refresh token has expired, deleting from database: token={}", token.getToken());
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException(token.getToken(), "Refresh token was expired. Please make a new signin request");
        }
        log.debug("Refresh token is valid");
        return token;
    }

    @Transactional
    public int deleteByUserId(Long userId) {
        log.debug("Deleting refresh tokens associated with user ID: {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> {
            log.error("Failed to delete refresh token: user ID {} not found", userId);
            return new RuntimeException("User not found");
        });
        int deletedCount = refreshTokenRepository.deleteByUser(user);
        log.debug("Deleted {} refresh tokens for user ID: {}", deletedCount, userId);
        return deletedCount;
    }
}
