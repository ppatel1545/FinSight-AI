package com.finsight.backend.controller;

import com.finsight.backend.dto.*;
import com.finsight.backend.model.User;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.TransactionService;
import com.finsight.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserService userService;

    // INCOMES CRUD
    @PostMapping("/incomes")
    public ResponseEntity<ApiResponse<TransactionResponse>> createIncome(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        TransactionResponse response = transactionService.createIncome(request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Income logged successfully", response));
    }

    @PutMapping("/incomes/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateIncome(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        TransactionResponse response = transactionService.updateIncome(id, request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Income updated successfully", response));
    }

    @DeleteMapping("/incomes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIncome(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        transactionService.deleteIncome(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Income deleted successfully"));
    }

    // EXPENSES CRUD
    @PostMapping("/expenses")
    public ResponseEntity<ApiResponse<TransactionResponse>> createExpense(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        TransactionResponse response = transactionService.createExpense(request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Expense logged successfully", response));
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        TransactionResponse response = transactionService.updateExpense(id, request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Expense updated successfully", response));
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        transactionService.deleteExpense(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Expense deleted successfully"));
    }

    // COMBINED TRANSACTIONS (Chronological history list)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getCombinedTransactions(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        Page<TransactionResponse> transactions = transactionService.getCombinedTransactions(
                user, categoryId, startDate, endDate, search, PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(true, "Transactions retrieved successfully", transactions));
    }

    // SUMMARY METRICS (aggregated values)
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<SummaryResponse>> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.getUserById(userDetails.getId());
        SummaryResponse summary = transactionService.getSummary(user, startDate, endDate);
        return ResponseEntity.ok(new ApiResponse<>(true, "Financial summary retrieved successfully", summary));
    }
}
