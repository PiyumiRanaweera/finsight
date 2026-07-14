package com.piyumi.finsight_backend.dto;

public record AuthResponse(String token, String refreshToken, String email, String fullName) {}