package com.finsight.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finsight.backend.dto.*;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AiService {

    @Value("${finsight.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${finsight.ai.gemini.model:gemini-2.5-flash}")
    private String modelName;

    @Value("${finsight.ai.gemini.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiUrl;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private BudgetService budgetService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Parse natural language transaction into structured properties.
     */
    public AiParseResponse parseTransaction(String text, User user) {
        log.info("Parsing transaction text for user {}: '{}'", user.getUsername(), text);
        
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Gemini API key is missing. Cannot parse transaction.");
            throw new IllegalStateException("AI integration is disabled: GEMINI_API_KEY environment variable is not set.");
        }

        List<Category> categories = categoryRepository.findByUserOrIsCustomFalse(user);
        StringBuilder categoriesText = new StringBuilder();
        for (Category cat : categories) {
            categoriesText.append("- ").append(cat.getName()).append(" (Type: ").append(cat.getType().name()).append(")\n");
        }

        String prompt = String.format(
            "You are a financial transaction parsing assistant.\n" +
            "Your task is to parse a text description of a financial transaction and extract key details: amount, currency, category name, transaction type, and short description.\n\n" +
            "Available categories are:\n%s\n" +
            "Rules:\n" +
            "1. Extract the transaction amount as a positive number.\n" +
            "2. Extract the currency code. If not specified or not in this list [USD, INR, EUR, GBP, JPY, CAD, AUD, CHF, CNY, AED], default to USD.\n" +
            "3. Identify the matching category name from the list above. It must match one of the available categories exactly. If none of the categories match, choose the best matching one.\n" +
            "4. Determine the transaction type: \"INCOME\" or \"EXPENSE\" (e.g. Swiggy order is EXPENSE, salary payout is INCOME).\n" +
            "5. Extract a short, clean description of the transaction (e.g. Swiggy order, salary).\n\n" +
            "Input text to parse: \"%s\"\n\n" +
            "You MUST respond ONLY with a valid JSON object matching this schema:\n" +
            "{\n" +
            "  \"amount\": number,\n" +
            "  \"currency\": \"string\",\n" +
            "  \"categoryName\": \"string\",\n" +
            "  \"type\": \"string\",\n" +
            "  \"description\": \"string\"\n" +
            "}\n" +
            "Do not include any other text or markdown formatting. Just return the JSON.",
            categoriesText, text
        );

        try {
            String rawJson = callGemini(prompt, null, true);
            JsonNode root = objectMapper.readTree(rawJson);
            
            BigDecimal amount = new BigDecimal(root.path("amount").asText("0.00"));
            String currency = root.path("currency").asText("USD").toUpperCase();
            String categoryName = root.path("categoryName").asText("Shopping");
            String type = root.path("type").asText("EXPENSE").toUpperCase();
            String description = root.path("description").asText("");

            // Find matching category ID
            Optional<Category> matchedCategory = categories.stream()
                .filter(c -> c.getName().equalsIgnoreCase(categoryName))
                .findFirst();

            Long categoryId = null;
            String finalCategoryName = categoryName;
            if (matchedCategory.isPresent()) {
                categoryId = matchedCategory.get().getId();
                finalCategoryName = matchedCategory.get().getName();
            } else {
                // Try fallback logic
                Optional<Category> fallback = categories.stream()
                    .filter(c -> c.getType().name().equalsIgnoreCase(type))
                    .findFirst();
                if (fallback.isPresent()) {
                    categoryId = fallback.get().getId();
                    finalCategoryName = fallback.get().getName();
                }
            }

            return new AiParseResponse(amount, currency, categoryId, finalCategoryName, type, description);
        } catch (Exception e) {
            log.error("Error calling Gemini API for transaction parsing", e);
            throw new RuntimeException("AI Parsing failed: " + e.getMessage());
        }
    }

    /**
     * Generate financial insights and recommendations based on current month's summaries, budgets, and transactions.
     */
    public AiInsightsResponse getFinancialInsights(User user) {
        log.info("Generating financial insights for user: {}", user.getUsername());

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Gemini API key is missing. Returning placeholder insights.");
            return new AiInsightsResponse(List.of(
                "Gemini API key is not configured in the backend environment. Set the GEMINI_API_KEY environment variable to enable smart financial recommendations."
            ));
        }

        LocalDate now = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end = now.withDayOfMonth(now.lengthOfMonth());
        String currentMonthYearStr = YearMonth.now().toString();

        SummaryResponse summary = transactionService.getSummary(user, start, end);
        List<BudgetResponse> budgets = budgetService.getBudgets(currentMonthYearStr, user);
        List<TransactionResponse> recentTransactions = transactionService.getCombinedTransactions(
                user, null, null, null, null, org.springframework.data.domain.PageRequest.of(0, 5)).getContent();

        StringBuilder budgetContext = new StringBuilder();
        for (BudgetResponse b : budgets) {
            budgetContext.append("- ").append(b.getCategory().getName())
                .append(": Limit $").append(b.getLimitAmount())
                .append(", Spent $").append(b.getSpentAmount())
                .append(", Remaining $").append(b.getRemainingAmount())
                .append(" (Status: ").append(b.getThresholdStatus()).append(")\n");
        }

        StringBuilder transContext = new StringBuilder();
        for (TransactionResponse t : recentTransactions) {
            transContext.append("- ").append(t.getDate()).append(": ")
                .append(t.getType()).append(" ").append(t.getCurrency()).append(" ").append(t.getAmount())
                .append(" (Category: ").append(t.getCategory().getName()).append(") - ")
                .append(t.getDescription() != null ? t.getDescription() : "No Description").append("\n");
        }

        String prompt = String.format(
            "You are a professional financial advisor.\n" +
            "Analyze the user's financial data for this month and provide 3 to 5 concise, actionable, and personalized insights or recommendations.\n" +
            "Keep each bullet point short, punchy, and highly relevant. Mention specific numbers, percentages, or budgets when possible.\n\n" +
            "Financial context for this month:\n" +
            "- Total Income: $%s USD\n" +
            "- Total Expense: $%s USD\n" +
            "- Net Savings: $%s USD\n\n" +
            "Active budgets:\n%s\n" +
            "Recent transactions:\n%s\n" +
            "Respond with a JSON object containing a list of strings named \"insights\":\n" +
            "{\n" +
            "  \"insights\": [\n" +
            "    \"Insight 1...\",\n" +
            "    \"Insight 2...\",\n" +
            "    \"Insight 3...\"\n" +
            "  ]\n" +
            "}\n" +
            "Do not include any other text or markdown formatting. Just return the JSON.",
            summary.getTotalIncome(), summary.getTotalExpense(), summary.getNetSavings(),
            budgetContext.isEmpty() ? "No budgets set." : budgetContext.toString(),
            transContext.isEmpty() ? "No recent transactions." : transContext.toString()
        );

        try {
            String rawJson = callGemini(prompt, null, true);
            JsonNode root = objectMapper.readTree(rawJson);
            List<String> insights = new ArrayList<>();
            JsonNode insightsNode = root.path("insights");
            if (insightsNode.isArray()) {
                for (JsonNode node : insightsNode) {
                    insights.add(node.asText());
                }
            }
            if (insights.isEmpty()) {
                insights.add("Keep tracking your expenditures! Your budgets and savings look stable for this month.");
            }
            return new AiInsightsResponse(insights);
        } catch (Exception e) {
            log.error("Error generating insights", e);
            return new AiInsightsResponse(List.of(
                "Unable to compute AI Insights currently. Please check transaction history and try again later."
            ));
        }
    }

    /**
     * Stateful chat endpoint providing conversational query resolution using system instructions.
     */
    public AiChatResponse chatWithAssistant(String message, List<ChatMessageDto> history, User user) {
        log.info("Chat requested for user: {}", user.getUsername());

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Gemini API key is missing. Returning fallback assistant reply.");
            return new AiChatResponse(
                "Hello! I am your FinSight AI financial assistant. I'm ready to help, but my intelligence is currently inactive because the **GEMINI_API_KEY** environment variable has not been configured in the backend. Please set the API key to start chatting!"
            );
        }

        LocalDate now = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end = now.withDayOfMonth(now.lengthOfMonth());
        String currentMonthYearStr = YearMonth.now().toString();

        SummaryResponse summary = transactionService.getSummary(user, start, end);
        List<BudgetResponse> budgets = budgetService.getBudgets(currentMonthYearStr, user);
        List<TransactionResponse> recentTransactions = transactionService.getCombinedTransactions(
                user, null, null, null, null, org.springframework.data.domain.PageRequest.of(0, 5)).getContent();

        StringBuilder budgetContext = new StringBuilder();
        for (BudgetResponse b : budgets) {
            budgetContext.append("- ").append(b.getCategory().getName())
                .append(": Limit $").append(b.getLimitAmount())
                .append(", Spent $").append(b.getSpentAmount())
                .append(", Remaining $").append(b.getRemainingAmount())
                .append(" (Status: ").append(b.getThresholdStatus()).append(")\n");
        }

        StringBuilder transContext = new StringBuilder();
        for (TransactionResponse t : recentTransactions) {
            transContext.append("- ").append(t.getDate()).append(": ")
                .append(t.getType()).append(" ").append(t.getCurrency()).append(" ").append(t.getAmount())
                .append(" (Category: ").append(t.getCategory().getName()).append(") - ")
                .append(t.getDescription() != null ? t.getDescription() : "No Description").append("\n");
        }

        String systemInstruction = String.format(
            "You are FinSight AI, a helpful, professional, and friendly personal finance chat assistant.\n" +
            "You assist the user in tracking transactions, analyzing budgets, and managing their finances.\n" +
            "You have access to the user's current financial profile. Always refer to this context when answering user questions. If the user asks about their spending, budgets, categories, or recent transactions, use this data to provide precise, accurate answers.\n\n" +
            "Current Date: %s\n" +
            "Base Currency: USD (all dashboard aggregations and budgets are tracked in USD)\n\n" +
            "Financial Summary for This Month:\n" +
            "- Total Income: $%s USD\n" +
            "- Total Expenses: $%s USD\n" +
            "- Net Savings: $%s USD\n\n" +
            "Active Budgets:\n%s\n" +
            "Recent Transactions:\n%s\n" +
            "Instructions:\n" +
            "1. Be concise, friendly, and helpful.\n" +
            "2. Provide precise figures when answering financial questions using the provided context.\n" +
            "3. Keep answers relatively short so they fit nicely in a chat interface.\n" +
            "4. If asked to do something you cannot do (like delete a transaction or modify a budget), explain that you are a read-only assistant, but guide them on how to do it manually in the interface.",
            now, summary.getTotalIncome(), summary.getTotalExpense(), summary.getNetSavings(),
            budgetContext.isEmpty() ? "No budgets set." : budgetContext.toString(),
            transContext.isEmpty() ? "No recent transactions logged." : transContext.toString()
        );

        try {
            String reply = callGemini(message, history, false, systemInstruction);
            return new AiChatResponse(reply);
        } catch (Exception e) {
            log.error("Error in AI Chat service call", e);
            return new AiChatResponse("I encountered an issue processing that. Please try asking again.");
        }
    }

    private String callGemini(String message, List<ChatMessageDto> history, boolean requireJson) throws Exception {
        return callGemini(message, history, requireJson, null);
    }

    /**
     * Performs direct REST invocation to Google Gemini API.
     */
    private String callGemini(String message, List<ChatMessageDto> history, boolean requireJson, String systemInstruction) throws Exception {
        String endpoint = String.format("%s/%s:generateContent?key=%s", apiUrl, modelName, apiKey);

        Map<String, Object> requestBody = new HashMap<>();

        // Map conversation history + current message to "contents"
        List<Map<String, Object>> contents = new ArrayList<>();
        
        if (history != null && !history.isEmpty()) {
            for (ChatMessageDto chat : history) {
                Map<String, Object> turn = new HashMap<>();
                // Gemini role mapping: "user" maps to "user", "assistant"/"model" maps to "model"
                String geminiRole = chat.getRole().equalsIgnoreCase("user") ? "user" : "model";
                turn.put("role", geminiRole);
                turn.put("parts", List.of(Map.of("text", chat.getMessage())));
                contents.add(turn);
            }
        }

        // Add current turn (if there is no history, or this is a single message prompt like parsing/insights)
        // If history is present, the message represents the new query
        Map<String, Object> currentTurn = new HashMap<>();
        currentTurn.put("role", "user");
        currentTurn.put("parts", List.of(Map.of("text", message)));
        contents.add(currentTurn);

        requestBody.put("contents", contents);

        // Inject System Instruction if present
        if (systemInstruction != null && !systemInstruction.trim().isEmpty()) {
            requestBody.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemInstruction))
            ));
        }

        // Enforce JSON Output formatting
        if (requireJson) {
            requestBody.put("generationConfig", Map.of("responseMimeType", "application/json"));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.debug("Sending request to Gemini API model: {}", modelName);
        ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
        
        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new RuntimeException("Gemini API call failed with status: " + response.getStatusCode());
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        
        if (textNode.isMissingNode() || textNode.asText().isEmpty()) {
            log.error("Empty text response from Gemini. Full body: {}", response.getBody());
            throw new RuntimeException("Received empty text candidate from Gemini API.");
        }

        return textNode.asText();
    }
}
