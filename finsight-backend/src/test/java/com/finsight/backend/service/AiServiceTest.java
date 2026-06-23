package com.finsight.backend.service;

import com.finsight.backend.dto.*;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.CategoryType;
import com.finsight.backend.model.User;
import com.finsight.backend.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TransactionService transactionService;

    @Mock
    private BudgetService budgetService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AiService aiService;

    private User user;
    private Category expenseCategory;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        expenseCategory = new Category("Food", CategoryType.EXPENSE, "#FF0000", "Utensils", false, null);
        expenseCategory.setId(10L);

        // Inject configuration variables
        ReflectionTestUtils.setField(aiService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(aiService, "modelName", "gemini-2.5-flash");
        ReflectionTestUtils.setField(aiService, "apiUrl", "http://test-api.com");
        ReflectionTestUtils.setField(aiService, "restTemplate", restTemplate);
    }

    @Test
    void testParseTransaction_MissingApiKey() {
        ReflectionTestUtils.setField(aiService, "apiKey", "");

        assertThrows(IllegalStateException.class, () ->
                aiService.parseTransaction("Swiggy 350 INR", user));
    }

    @Test
    void testParseTransaction_Success() {
        when(categoryRepository.findByUserOrIsCustomFalse(user))
                .thenReturn(Collections.singletonList(expenseCategory));

        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\n  \\\"amount\\\": 350,\\n  \\\"currency\\\": \\\"INR\\\",\\n  \\\"categoryName\\\": \\\"Food\\\",\\n  \\\"type\\\": \\\"EXPENSE\\\",\\n  \\\"description\\\": \\\"Swiggy order\\\"\\n}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockGeminiResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(responseEntity);

        AiParseResponse response = aiService.parseTransaction("Swiggy 350 INR", user);

        assertNotNull(response);
        assertEquals(new BigDecimal("350"), response.getAmount());
        assertEquals("INR", response.getCurrency());
        assertEquals(10L, response.getCategoryId());
        assertEquals("Food", response.getCategoryName());
        assertEquals("EXPENSE", response.getType());
        assertEquals("Swiggy order", response.getDescription());
    }

    @Test
    void testParseTransaction_CategoryFallback() {
        when(categoryRepository.findByUserOrIsCustomFalse(user))
                .thenReturn(Collections.singletonList(expenseCategory));

        // Let's return a category that doesn't match name, e.g., "Dining Out" instead of "Food".
        // Category list contains "Food" which is EXPENSE.
        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\n  \\\"amount\\\": 350,\\n  \\\"currency\\\": \\\"INR\\\",\\n  \\\"categoryName\\\": \\\"Dining Out\\\",\\n  \\\"type\\\": \\\"EXPENSE\\\",\\n  \\\"description\\\": \\\"Swiggy\\\"\\n}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockGeminiResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(responseEntity);

        AiParseResponse response = aiService.parseTransaction("Swiggy 350 INR", user);

        assertNotNull(response);
        assertEquals("Food", response.getCategoryName()); // Should default to the fallback category name (Food)
        assertEquals(10L, response.getCategoryId()); // Fallback EXPENSE category matching ID (Food)
    }

    @Test
    void testGetFinancialInsights_MissingApiKey() {
        ReflectionTestUtils.setField(aiService, "apiKey", "");

        AiInsightsResponse response = aiService.getFinancialInsights(user);

        assertNotNull(response);
        assertEquals(1, response.getInsights().size());
        assertTrue(response.getInsights().get(0).contains("API key is not configured"));
    }

    @Test
    void testGetFinancialInsights_Success() {
        SummaryResponse summary = new SummaryResponse(new BigDecimal("5000.00"), new BigDecimal("2000.00"), new BigDecimal("3000.00"));
        when(transactionService.getSummary(eq(user), any(LocalDate.class), any(LocalDate.class))).thenReturn(summary);
        when(budgetService.getBudgets(anyString(), eq(user))).thenReturn(Collections.emptyList());
        when(transactionService.getCombinedTransactions(eq(user), any(), any(), any(), any(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\n  \\\"insights\\\": [\\n    \\\"You saved $3000.00 this month!\\\",\\n    \\\"Good budget maintenance.\\\"\\n  ]\\n}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockGeminiResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(responseEntity);

        AiInsightsResponse response = aiService.getFinancialInsights(user);

        assertNotNull(response);
        assertEquals(2, response.getInsights().size());
        assertEquals("You saved $3000.00 this month!", response.getInsights().get(0));
    }

    @Test
    void testChatWithAssistant_MissingApiKey() {
        ReflectionTestUtils.setField(aiService, "apiKey", null);

        AiChatResponse response = aiService.chatWithAssistant("Hello", new ArrayList<>(), user);

        assertNotNull(response);
        assertTrue(response.getReply().contains("GEMINI_API_KEY"));
    }

    @Test
    void testChatWithAssistant_Success() {
        SummaryResponse summary = new SummaryResponse(new BigDecimal("5000.00"), new BigDecimal("2000.00"), new BigDecimal("3000.00"));
        when(transactionService.getSummary(eq(user), any(LocalDate.class), any(LocalDate.class))).thenReturn(summary);
        when(budgetService.getBudgets(anyString(), eq(user))).thenReturn(Collections.emptyList());
        when(transactionService.getCombinedTransactions(eq(user), any(), any(), any(), any(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        String mockGeminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"Hello, I am your finance helper. You have saved $3000.00 this month!\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockGeminiResponse, HttpStatus.OK);
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(responseEntity);

        AiChatResponse response = aiService.chatWithAssistant("Hello", new ArrayList<>(), user);

        assertNotNull(response);
        assertEquals("Hello, I am your finance helper. You have saved $3000.00 this month!", response.getReply());
    }
}
