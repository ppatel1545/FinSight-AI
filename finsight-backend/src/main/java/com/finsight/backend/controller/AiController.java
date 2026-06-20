package com.finsight.backend.controller;

import com.finsight.backend.dto.*;
import com.finsight.backend.model.User;
import com.finsight.backend.security.UserDetailsImpl;
import com.finsight.backend.service.AiService;
import com.finsight.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    @Autowired
    private AiService aiService;

    @Autowired
    private UserService userService;

    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<AiParseResponse>> parseTransaction(
            @Valid @RequestBody AiParseRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to AI parse transaction text for user ID={}", userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        AiParseResponse parsed = aiService.parseTransaction(request.getText(), user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Transaction text parsed successfully", parsed));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<AiInsightsResponse>> getFinancialInsights(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received to generate AI financial insights for user ID={}", userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        AiInsightsResponse insights = aiService.getFinancialInsights(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Financial insights generated successfully", insights));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chatWithAssistant(
            @Valid @RequestBody AiChatRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        log.info("Request received for AI assistant chat for user ID={}", userDetails.getId());
        User user = userService.getUserById(userDetails.getId());
        AiChatResponse response = aiService.chatWithAssistant(request.getMessage(), request.getHistory(), user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assistant response received", response));
    }
}
