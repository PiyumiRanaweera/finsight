package com.piyumi.finsight_backend;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthFlowIntegrationTest extends IntegrationTestBase {

    @Autowired
    private TestRestTemplate rest;

    private static String token;

    @Test
    @Order(1)
    void register_createsUserAndReturnsToken() {
        var body = Map.of(
                "email", "integration@test.com",
                "password", "password123",
                "fullName", "Integration Tester");

        ResponseEntity<Map> response =
                rest.postForEntity("/api/auth/register", body, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).containsKey("token");
        token = (String) response.getBody().get("token");
    }

    @Test
    @Order(2)
    void register_duplicateEmailReturns409() {
        var body = Map.of(
                "email", "integration@test.com",
                "password", "password123",
                "fullName", "Copycat");

        ResponseEntity<Map> response =
                rest.postForEntity("/api/auth/register", body, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().get("error")).isEqualTo("CONFLICT");
    }

    @Test
    @Order(3)
    void protectedEndpoint_rejectsRequestWithoutToken() {
        ResponseEntity<String> response =
                rest.getForEntity("/api/me", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @Order(4)
    void protectedEndpoint_acceptsValidToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<Map> response = rest.exchange(
                "/api/me", HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("email")).isEqualTo("integration@test.com");
    }

    @Test
    @Order(5)
    void fullFlow_createCategoryAndTransaction() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        // Create a category
        ResponseEntity<Map> catResponse = rest.exchange(
                "/api/categories", HttpMethod.POST,
                new HttpEntity<>(Map.of("name", "Testing"), headers), Map.class);
        assertThat(catResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Integer categoryId = (Integer) catResponse.getBody().get("id");

        // Create a transaction in it
        var tx = Map.of(
                "amount", 2500.00,
                "type", "EXPENSE",
                "description", "Integration test expense",
                "transactionDate", "2026-07-12",
                "categoryId", categoryId);
        ResponseEntity<Map> txResponse = rest.exchange(
                "/api/transactions", HttpMethod.POST,
                new HttpEntity<>(tx, headers), Map.class);
        assertThat(txResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(txResponse.getBody().get("categoryName")).isEqualTo("Testing");
    }
}