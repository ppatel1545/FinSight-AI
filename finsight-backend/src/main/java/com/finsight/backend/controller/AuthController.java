package com.finsight.backend.controller;

import com.finsight.backend.dto.*;
import com.finsight.backend.exception.TokenRefreshException;
import com.finsight.backend.model.RefreshToken;
import com.finsight.backend.security.JwtUtils;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.RefreshTokenService;
import com.finsight.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Request received to authenticate user: email={}", loginRequest.getEmail());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        String jwt = jwtUtils.generateJwtToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        JwtResponse jwtResponse = new JwtResponse(
                jwt,
                refreshToken.getToken(),
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles
        );

        log.info("Authentication successful for email={}. Generated JWT and refresh token.", loginRequest.getEmail());
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", jwtResponse));
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        log.info("Request received to register new user: username={}, email={}", signUpRequest.getUsername(), signUpRequest.getEmail());
        try {
            userService.registerUser(signUpRequest.getUsername(), signUpRequest.getEmail(), signUpRequest.getPassword());
            log.info("User registered successfully: username={}", signUpRequest.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(true, "User registered successfully!"));
        } catch (IllegalArgumentException e) {
            log.warn("Registration failed for user '{}': {}", signUpRequest.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    @PostMapping("/refreshtoken")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        log.info("Request received to rotate/refresh token");

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtils.generateTokenFromEmail(user.getEmail());
                    RefreshToken rotatedRefreshToken = refreshTokenService.createRefreshToken(user.getId());
                    TokenRefreshResponse response = new TokenRefreshResponse(token, rotatedRefreshToken.getToken());
                    log.info("Refresh token successfully verified and rotated for user ID: {}", user.getId());
                    return ResponseEntity.ok(new ApiResponse<>(true, "Token refreshed successfully", response));
                })
                .orElseThrow(() -> {
                    log.warn("Refresh token rotation failed: Token {} not found in database", requestRefreshToken);
                    return new TokenRefreshException(requestRefreshToken, "Refresh token is not in database!");
                });
    }
}
