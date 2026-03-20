package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.*;
import com.personalfinancetracker.app.entity.User;
import com.personalfinancetracker.app.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }
    @PostMapping("/register") public AuthResponse register(@Valid @RequestBody RegisterRequest request) { return authService.register(request); }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest request) { return authService.login(request); }
    @PostMapping("/refresh") public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) { return authService.refresh(request); }
    @PostMapping("/logout") public Map<String, String> logout(@RequestBody Map<String, String> payload) { authService.logout(payload.get("refreshToken")); return Map.of("message", "Logged out"); }
    @PostMapping("/forgot-password") public Map<String, String> forgot(@Valid @RequestBody ForgotPasswordRequest request) { authService.forgotPassword(request); return Map.of("message", "If the email exists, reset instructions have been sent."); }
    @PostMapping("/reset-password") public Map<String, String> reset(@Valid @RequestBody ResetPasswordRequest request) { authService.resetPassword(request); return Map.of("message", "Password reset successful"); }
    @GetMapping("/me") public UserResponse me(@AuthenticationPrincipal User user) { return authService.me(user); }
}
