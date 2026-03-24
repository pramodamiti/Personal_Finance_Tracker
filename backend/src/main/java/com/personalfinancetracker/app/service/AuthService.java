package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.config.RateLimitConfig;
import com.personalfinancetracker.app.dto.CommonDtos.*;
import com.personalfinancetracker.app.entity.Category;
import com.personalfinancetracker.app.entity.CategoryType;
import com.personalfinancetracker.app.entity.RefreshToken;
import com.personalfinancetracker.app.entity.User;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.mapper.AppMapper;
import com.personalfinancetracker.app.repository.CategoryRepository;
import com.personalfinancetracker.app.repository.RefreshTokenRepository;
import com.personalfinancetracker.app.repository.UserRepository;
import com.personalfinancetracker.app.security.JwtService;
import io.github.bucket4j.Bucket;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AppMapper mapper;
    private final RateLimitConfig rateLimitConfig;
    private final long refreshExpiration;

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       CategoryRepository categoryRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService, AppMapper mapper,
                       RateLimitConfig rateLimitConfig,
                       @Value("${REFRESH_TOKEN_EXPIRATION:1209600000}") long refreshExpiration) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.mapper = mapper;
        this.rateLimitConfig = rateLimitConfig;
        this.refreshExpiration = refreshExpiration;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) throw new ApiException("Email already in use");
        User user = new User();
        user.setEmail(request.email().toLowerCase());
        user.setDisplayName(request.displayName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);
        seedDefaultCategories(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        consume(rateLimitConfig.resolve("login:" + request.email().toLowerCase(), 10));
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmailIgnoreCase(request.email()).orElseThrow();
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.refreshToken()).filter(t -> !t.isRevoked() && t.getExpiresAt().isAfter(OffsetDateTime.now())).orElseThrow(() -> new ApiException("Invalid refresh token"));
        return issueTokens(loadManagedUser(token.getUser().getId()));
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> { token.setRevoked(true); refreshTokenRepository.save(token); });
    }

    public UserResponse me(User user) {
        return mapper.toUser(user);
    }

    private AuthResponse issueTokens(User user) {
        refreshTokenRepository.findByUserAndRevokedFalse(user).forEach(existing -> existing.setRevoked(true));
        String access = jwtService.generateToken(user.getId(), user.getEmail());
        RefreshToken refresh = new RefreshToken();
        refresh.setUser(user);
        refresh.setToken(UUID.randomUUID().toString());
        refresh.setExpiresAt(OffsetDateTime.now().plusNanos(refreshExpiration * 1_000_000));
        refreshTokenRepository.save(refresh);
        return new AuthResponse(access, refresh.getToken(), mapper.toUser(user));
    }

    private User loadManagedUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ApiException("User not found"));
    }

    private void seedDefaultCategories(User user) {
        List.of(defaultCategory(user, "Salary", CategoryType.INCOME, "briefcase", "#16a34a"),
                defaultCategory(user, "Freelance", CategoryType.INCOME, "wallet", "#0ea5e9"),
                defaultCategory(user, "Food", CategoryType.EXPENSE, "utensils", "#ef4444"),
                defaultCategory(user, "Transport", CategoryType.EXPENSE, "car", "#f59e0b"),
                defaultCategory(user, "Housing", CategoryType.EXPENSE, "home", "#6366f1"),
                defaultCategory(user, "Utilities", CategoryType.EXPENSE, "bolt", "#8b5cf6")).forEach(categoryRepository::save);
    }

    private Category defaultCategory(User user, String name, CategoryType type, String icon, String color) {
        Category category = new Category();
        category.setUser(user);
        category.setName(name);
        category.setType(type);
        category.setIcon(icon);
        category.setColor(color);
        return category;
    }

    private void consume(Bucket bucket) {
        if (!bucket.tryConsume(1)) throw new ApiException("Too many requests. Please try again later.");
    }
}
