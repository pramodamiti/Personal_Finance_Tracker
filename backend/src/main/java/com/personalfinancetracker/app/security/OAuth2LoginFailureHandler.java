package com.personalfinancetracker.app.security;

import com.personalfinancetracker.app.config.AppProperties;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {
    private final AppProperties appProperties;

    public OAuth2LoginFailureHandler(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException, ServletException {
        getRedirectStrategy().sendRedirect(request, response, normalizedFrontendUrl() + "/oauth/callback#error=" + encode(firstNonBlank(exception.getMessage(), "Google sign-in failed.")));
    }

    private String normalizedFrontendUrl() {
        String frontendUrl = appProperties.getFrontendUrl();
        if (frontendUrl == null || frontendUrl.isBlank()) {
            return "http://localhost:1455";
        }
        return frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
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
