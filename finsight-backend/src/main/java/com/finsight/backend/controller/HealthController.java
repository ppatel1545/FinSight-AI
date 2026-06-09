package com.finsight.backend.controller;

import com.finsight.backend.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> details = new HashMap<>();
        details.put("status", "UP");
        
        boolean dbConnected = false;
        String dbError = null;
        
        if (dataSource != null) {
            try (Connection connection = dataSource.getConnection()) {
                dbConnected = connection.isValid(2);
            } catch (Exception e) {
                dbError = e.getMessage();
            }
        } else {
            dbError = "DataSource is not configured";
        }
        
        details.put("databaseConnected", dbConnected);
        if (dbError != null) {
            details.put("databaseError", dbError);
        }
        
        if (dbConnected) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Service is healthy", details));
        } else {
            return ResponseEntity.status(503).body(new ApiResponse<>(false, "Database connection failed", details));
        }
    }
}
