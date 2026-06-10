package com.finsight.backend.controller;

import com.finsight.backend.dto.ApiResponse;
import com.finsight.backend.dto.UserDto;
import com.finsight.backend.model.User;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        UserDto userDto = new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getProfilePicture(),
                roles
        );

        return ResponseEntity.ok(new ApiResponse<>(true, "Profile retrieved successfully", userDto));
    }
}
