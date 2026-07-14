package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.AuthResponse;
import com.piyumi.finsight_backend.dto.LoginRequest;
import com.piyumi.finsight_backend.dto.RegisterRequest;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.UserRepository;
import com.piyumi.finsight_backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .build();
        userRepository.save(user);
        return new AuthResponse(
                jwtService.generateToken(user.getEmail()),
                refreshTokenService.create(user),
                user.getEmail(), user.getFullName());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return new AuthResponse(
                jwtService.generateToken(user.getEmail()),
                refreshTokenService.create(user),
                user.getEmail(), user.getFullName());
    }

    public AuthResponse refresh(String refreshTokenValue) {
        var newToken = refreshTokenService.validateAndRotate(refreshTokenValue);
        var user = newToken.getUser();
        return new AuthResponse(
                jwtService.generateToken(user.getEmail()),
                newToken.getToken(),
                user.getEmail(), user.getFullName());
    }

    public void logout(String email) {
        refreshTokenService.revokeAll(email);
    }
}