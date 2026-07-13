package com.piyumi.finsight_backend.controller;

import com.piyumi.finsight_backend.dto.ChangePasswordRequest;
import com.piyumi.finsight_backend.dto.UpdateProfileRequest;
import com.piyumi.finsight_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        return ResponseEntity.ok(userService.getProfile(auth.getName()));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(Authentication auth,
                                                             @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(auth.getName(), request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(Authentication auth,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(auth.getName(), request);
        return ResponseEntity.noContent().build();
    }
}