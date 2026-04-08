package com.personalfinancetracker.app;

import com.microsoft.applicationinsights.attach.ApplicationInsights;
import com.personalfinancetracker.app.config.AppProperties;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan(basePackageClasses = AppProperties.class)
public class PersonalFinanceTrackerApplication {
    public static void main(String[] args) {
        attachApplicationInsightsIfConfigured();
        SpringApplication application = new SpringApplication(PersonalFinanceTrackerApplication.class);
        application.setDefaultProperties(resolveHostedDatabaseDefaults());
        application.run(args);
    }

    private static void attachApplicationInsightsIfConfigured() {
        String connectionString = System.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING");
        if (connectionString == null || connectionString.isBlank()) {
            return;
        }

        try {
            ApplicationInsights.attach();
        } catch (RuntimeException ex) {
            System.err.println("Application Insights auto-attach failed: " + ex.getMessage());
        }
    }

    private static Map<String, Object> resolveHostedDatabaseDefaults() {
        Map<String, Object> defaults = new HashMap<>();
        String jdbcUrl = System.getenv("SPRING_DATASOURCE_URL");
        String hostedDatabaseUrl = System.getenv("DATABASE_URL");
        if (jdbcUrl != null && !jdbcUrl.isBlank()) {
            return defaults;
        }
        if (hostedDatabaseUrl == null || hostedDatabaseUrl.isBlank()) {
            return defaults;
        }

        HostedDatabaseConfig config = HostedDatabaseConfig.from(hostedDatabaseUrl);
        if (config == null) {
            System.err.println("DATABASE_URL is set but could not be parsed. Expected postgres:// or postgresql://");
            return defaults;
        }

        defaults.put("spring.datasource.url", config.jdbcUrl());
        if (isBlank(System.getenv("SPRING_DATASOURCE_USERNAME")) && !config.username().isBlank()) {
            defaults.put("spring.datasource.username", config.username());
        }
        if (isBlank(System.getenv("SPRING_DATASOURCE_PASSWORD")) && !config.password().isBlank()) {
            defaults.put("spring.datasource.password", config.password());
        }
        return defaults;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record HostedDatabaseConfig(String jdbcUrl, String username, String password) {
        private static HostedDatabaseConfig from(String rawUrl) {
            try {
                URI uri = new URI(rawUrl);
                String scheme = uri.getScheme();
                if (scheme == null || (!scheme.equalsIgnoreCase("postgresql") && !scheme.equalsIgnoreCase("postgres"))) {
                    return null;
                }

                String databasePath = uri.getPath();
                if (databasePath == null || databasePath.isBlank() || "/".equals(databasePath)) {
                    return null;
                }

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(uri.getHost());
                if (uri.getPort() > 0) {
                    jdbcUrl.append(':').append(uri.getPort());
                }
                jdbcUrl.append(databasePath);
                if (uri.getRawQuery() != null && !uri.getRawQuery().isBlank()) {
                    jdbcUrl.append('?').append(uri.getRawQuery());
                }

                String username = "";
                String password = "";
                String userInfo = uri.getRawUserInfo();
                if (userInfo != null && !userInfo.isBlank()) {
                    String[] credentials = userInfo.split(":", 2);
                    username = decode(credentials[0]);
                    if (credentials.length > 1) {
                        password = decode(credentials[1]);
                    }
                }

                return new HostedDatabaseConfig(jdbcUrl.toString(), username, password);
            } catch (URISyntaxException ex) {
                return null;
            }
        }

        private static String decode(String value) {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        }
    }
}
