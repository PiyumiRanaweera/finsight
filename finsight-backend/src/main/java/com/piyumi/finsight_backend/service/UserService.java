package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.ChangePasswordRequest;
import com.piyumi.finsight_backend.dto.UpdateProfileRequest;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.TransactionRepository;
import com.piyumi.finsight_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> getProfile(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        long txCount = transactionRepository.findByUserEmailOrderByTransactionDateDesc(email).size();
        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "memberSince", user.getCreatedAt().toLocalDate().toString(),
                "transactionCount", txCount
        );
    }

    public Map<String, Object> updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setFullName(request.fullName());
        userRepository.save(user);
        return getProfile(email);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from the current one");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}