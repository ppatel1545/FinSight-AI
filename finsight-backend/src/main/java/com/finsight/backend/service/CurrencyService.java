package com.finsight.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Slf4j
@Service
public class CurrencyService {

    // Preset static exchange rates relative to 1 USD
    private static final Map<String, BigDecimal> USD_EXCHANGE_RATES = Map.of(
            "USD", BigDecimal.ONE,
            "INR", new BigDecimal("83.0"),
            "EUR", new BigDecimal("0.92"),
            "GBP", new BigDecimal("0.79"),
            "JPY", new BigDecimal("155.0"),
            "CAD", new BigDecimal("1.37"),
            "AUD", new BigDecimal("1.51"),
            "CHF", new BigDecimal("0.90"),
            "CNY", new BigDecimal("7.24"),
            "AED", new BigDecimal("3.67")
    );

    /**
     * Converts a monetary amount from one currency to another.
     *
     * @param amount       the amount to convert
     * @param fromCurrency the source currency code (e.g. "INR")
     * @param toCurrency   the target currency code (e.g. "USD")
     * @return the converted amount, rounded to 4 decimal places
     */
    public BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        if (fromCurrency == null || toCurrency == null || fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }

        BigDecimal fromRate = USD_EXCHANGE_RATES.getOrDefault(fromCurrency.toUpperCase(), BigDecimal.ONE);
        BigDecimal toRate = USD_EXCHANGE_RATES.getOrDefault(toCurrency.toUpperCase(), BigDecimal.ONE);

        log.trace("Converting {} from {} (rate: {}) to {} (rate: {})", amount, fromCurrency, fromRate, toCurrency, toRate);

        // amount in USD = amount / fromRate
        BigDecimal amountInUsd = amount.divide(fromRate, 6, RoundingMode.HALF_UP);
        // converted amount = amountInUsd * toRate
        BigDecimal result = amountInUsd.multiply(toRate);

        // Scale to 4 decimal places for database/financial precision
        return result.setScale(4, RoundingMode.HALF_UP);
    }
}
