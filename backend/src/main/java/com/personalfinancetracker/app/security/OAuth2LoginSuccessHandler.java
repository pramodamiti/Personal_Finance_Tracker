package com.personalfinancetracker.app.security;

import com.personalfinancetracker.app.config.AppProperties;
import com.personalfinancetracker.app.dto.CommonDtos.AuthResponse;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final AuthService authService;
    private final AppProperties appProperties;

    public OAuth2LoginSuccessHandler(AuthService authService, AppProperties appProperties) {
        this.authService = authService;
        this.appProperties = appProperties;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String googleSubject = stringAttribute(oAuth2User, "sub");
            String email = stringAttribute(oAuth2User, "email");
            if (!booleanAttribute(oAuth2User, "email_verified", true)) {
                throw new ApiException("Google email must be verified before sign-in.");
            }

            AuthResponse authResponse = authService.loginWithGoogle(
                    googleSubject,
                    email,
                    firstNonBlank(stringAttribute(oAuth2User, "name"), stringAttribute(oAuth2User, "given_name"), email));

            clearAuthenticationAttributes(request);
            getRedirectStrategy().sendRedirect(request, response, buildSuccessRedirect(authResponse));
        } catch (Exception ex) {
            clearAuthenticationAttributes(request);
            getRedirectStrategy().sendRedirect(request, response, buildFailureRedirect(ex.getMessage()));
        }
    }

    private String buildSuccessRedirect(AuthResponse authResponse) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("accessToken", authResponse.accessToken());
        params.put("refreshToken", authResponse.refreshToken());
        params.put("userId", authResponse.user().id().toString());
        params.put("email", authResponse.user().email());
        params.put("displayName", authResponse.user().displayName());
        params.put("googleLinked", String.valueOf(authResponse.user().googleLinked()));
        return callbackUrl(params);
    }

    private String buildFailureRedirect(String message) {
        return callbackUrl(Map.of("error", firstNonBlank(message, "Google sign-in failed.")));
    }

    private String callbackUrl(Map<String, String> params) {
        String fragment = params.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
        return normalizedFrontendUrl() + "/oauth/callback#" + fragment;
    }

    private String normalizedFrontendUrl() {
        String frontendUrl = appProperties.getFrontendUrl();
        if (frontendUrl == null || frontendUrl.isBlank()) {
            return "http://localhost:1455";
        }
        return frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    private String stringAttribute(OAuth2User user, String key) {
        Object value = user.getAttributes().get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private boolean booleanAttribute(OAuth2User user, String key, boolean fallback) {
        Object value = user.getAttributes().get(key);
        if (value == null) {
            return fallback;
        }
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
