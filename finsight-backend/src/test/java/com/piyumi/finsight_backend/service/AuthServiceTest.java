package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.AuthResponse;
import com.piyumi.finsight_backend.dto.LoginRequest;
import com.piyumi.finsight_backend.dto.RegisterRequest;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.UserRepository;
import com.piyumi.finsight_backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    // ---------- register ----------

    @Test
    void register_createsUserAndReturnsToken() {
        var request = new RegisterRequest("piyumi@test.com", "password123", "Piyumi");
        when(userRepository.existsByEmail("piyumi@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(jwtService.generateToken("piyumi@test.com")).thenReturn("fake-jwt");

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("fake-jwt");
        assertThat(response.email()).isEqualTo("piyumi@test.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_rejectsDuplicateEmail() {
        var request = new RegisterRequest("piyumi@test.com", "password123", "Piyumi");
        when(userRepository.existsByEmail("piyumi@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_hashesPasswordBeforeSaving() {
        var request = new RegisterRequest("piyumi@test.com", "password123", "Piyumi");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(jwtService.generateToken(anyString())).thenReturn("fake-jwt");

        authService.register(request);

        verify(userRepository).save(argThat(user ->
                user.getPassword().equals("hashed-password")
                        && !user.getPassword().equals("password123")));
    }

    // ---------- login ----------

    @Test
    void login_returnsTokenForValidCredentials() {
        var request = new LoginRequest("piyumi@test.com", "password123");
        var user = User.builder().email("piyumi@test.com").password("hashed").fullName("Piyumi").build();
        when(userRepository.findByEmail("piyumi@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtService.generateToken("piyumi@test.com")).thenReturn("fake-jwt");

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("fake-jwt");
    }

    @Test
    void login_rejectsUnknownEmail() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@test.com", "whatever")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    void login_rejectsWrongPassword() {
        var user = User.builder().email("piyumi@test.com").password("hashed").build();
        when(userRepository.findByEmail("piyumi@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("piyumi@test.com", "wrongpass")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid email or password");
    }
}