package com.personalfinancetracker.app;

import com.microsoft.applicationinsights.attach.ApplicationInsights;
import com.personalfinancetracker.app.config.AppProperties;
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
        SpringApplication.run(PersonalFinanceTrackerApplication.class, args);
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
}
