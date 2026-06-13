package com.finsight.backend.controller;

import com.finsight.backend.dto.ApiResponse;
import com.finsight.backend.dto.BudgetRequest;
import com.finsight.backend.dto.BudgetResponse;
import com.finsight.backend.model.User;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.BudgetService;
import com.finsight.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> saveBudget(
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to save budget: user ID={}, category ID={}, monthYear={}, limit={}", 
                userDetails.getId(), request.getCategoryId(), request.getMonthYear(), request.getLimitAmount());
        User user = userService.getUserById(userDetails.getId());
        BudgetResponse response = budgetService.saveBudget(request, user);
        log.info("Budget saved successfully: id={} for user ID={}", response.getId(), userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget saved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getBudgets(
            @RequestParam(required = false) String monthYear,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to fetch budgets: user ID={}, monthYear={}", userDetails.getId(), monthYear);
        User user = userService.getUserById(userDetails.getId());
        List<BudgetResponse> response = budgetService.getBudgets(monthYear, user);
        log.debug("Successfully retrieved {} budgets for user ID={}", response.size(), userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Budgets retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudgetById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to fetch budget: id={} for user ID={}", id, userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        BudgetResponse response = budgetService.getBudgetById(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudgetLimit(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Object limitObj = payload.get("limitAmount");
        if (limitObj == null) {
            throw new IllegalArgumentException("limitAmount is required");
        }

        BigDecimal limitAmount;
        try {
            limitAmount = new BigDecimal(limitObj.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("limitAmount must be a valid number");
        }

        if (limitAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("limitAmount must be a positive number");
        }

        log.info("Request received to update budget ID: {} limit to {} by user ID={}", id, limitAmount, userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        BudgetResponse response = budgetService.updateBudgetLimit(id, limitAmount, user);
        log.info("Budget ID: {} limit updated successfully for user ID={}", id, userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget limit updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to delete budget ID: {} for user ID={}", id, userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        budgetService.deleteBudget(id, user);
        log.info("Budget ID: {} deleted successfully for user ID={}", id, userDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget deleted successfully"));
    }
}
