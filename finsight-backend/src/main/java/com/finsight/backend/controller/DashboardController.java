package com.finsight.backend.controller;

import com.finsight.backend.dto.ApiResponse;
import com.finsight.backend.dto.DashboardResponse;
import com.finsight.backend.model.User;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.DashboardService;
import com.finsight.backend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboardData(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to fetch dashboard aggregator data for user ID={}", userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        DashboardResponse response = dashboardService.getDashboardData(user);
        log.debug("Successfully aggregated dashboard data for user ID={}", userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard data retrieved successfully", response));
    }
}
