package com.finsight.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class CurrencyServiceTest {

    private CurrencyService currencyService;

    @BeforeEach
    void setUp() {
        currencyService = new CurrencyService();
    }

    @Test
    void testConvert_WithNullAmount() {
        BigDecimal result = currencyService.convert(null, "USD", "INR");
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void testConvert_WithNullOrSameCurrency() {
        BigDecimal amount = new BigDecimal("100.00");

        // Same currency
        BigDecimal resSame = currencyService.convert(amount, "USD", "USD");
        assertEquals(amount, resSame);

        // Null fromCurrency
        BigDecimal resNullFrom = currencyService.convert(amount, null, "USD");
        assertEquals(amount, resNullFrom);

        // Null toCurrency
        BigDecimal resNullTo = currencyService.convert(amount, "USD", null);
        assertEquals(amount, resNullTo);
    }

    @Test
    void testConvert_UsdToInr() {
        BigDecimal amount = new BigDecimal("10.00");
        // $10 USD * 83.0 (INR rate) = 830.0000 INR (scale of 4)
        BigDecimal expected = new BigDecimal("830.0000");
        BigDecimal result = currencyService.convert(amount, "USD", "INR");
        assertEquals(expected, result);
    }

    @Test
    void testConvert_InrToUsd() {
        BigDecimal amount = new BigDecimal("830.00");
        // 830 / 83.0 = 10.0000 USD (scale of 4)
        BigDecimal expected = new BigDecimal("10.0000");
        BigDecimal result = currencyService.convert(amount, "INR", "USD");
        assertEquals(expected, result);
    }

    @Test
    void testConvert_InrToEur() {
        BigDecimal amount = new BigDecimal("830.00");
        // 830 INR / 83.0 = 10 USD
        // 10 USD * 0.92 = 9.2000 EUR
        BigDecimal expected = new BigDecimal("9.2000");
        BigDecimal result = currencyService.convert(amount, "INR", "EUR");
        assertEquals(expected, result);
    }

    @Test
    void testConvert_CaseInsensitiveAndUnmapped() {
        BigDecimal amount = new BigDecimal("10.00");
        // "usd" to "inr" should be case insensitive
        BigDecimal resLower = currencyService.convert(amount, "usd", "inr");
        assertEquals(new BigDecimal("830.0000"), resLower);

        // Unmapped currency like "XYZ" should default to 1.0
        BigDecimal resUnmapped = currencyService.convert(amount, "XYZ", "USD");
        assertEquals(amount.setScale(4, RoundingMode.HALF_UP), resUnmapped);
    }
}
