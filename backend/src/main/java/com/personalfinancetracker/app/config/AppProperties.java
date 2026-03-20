package com.personalfinancetracker.app.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private final Cors cors = new Cors();
    private final Security security = new Security();
    private final Scheduling scheduling = new Scheduling();
    private final Mail mail = new Mail();
    private final Observability observability = new Observability();

    public Cors getCors() {
        return cors;
    }

    public Security getSecurity() {
        return security;
    }

    public Scheduling getScheduling() {
        return scheduling;
    }

    public Mail getMail() {
        return mail;
    }

    public Observability getObservability() {
        return observability;
    }

    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>(List.of("http://localhost:5173"));

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class Security {
        private boolean logPasswordResetTokens;

        public boolean isLogPasswordResetTokens() {
            return logPasswordResetTokens;
        }

        public void setLogPasswordResetTokens(boolean logPasswordResetTokens) {
            this.logPasswordResetTokens = logPasswordResetTokens;
        }
    }

    public static class Scheduling {
        private String recurringCron = "0 0 * * * *";
        private String lockAtMostFor = "PT10M";
        private String lockAtLeastFor = "PT30S";

        public String getRecurringCron() {
            return recurringCron;
        }

        public void setRecurringCron(String recurringCron) {
            this.recurringCron = recurringCron;
        }

        public String getLockAtMostFor() {
            return lockAtMostFor;
        }

        public void setLockAtMostFor(String lockAtMostFor) {
            this.lockAtMostFor = lockAtMostFor;
        }

        public String getLockAtLeastFor() {
            return lockAtLeastFor;
        }

        public void setLockAtLeastFor(String lockAtLeastFor) {
            this.lockAtLeastFor = lockAtLeastFor;
        }
    }

    public static class Observability {
        private String correlationHeader = "X-Correlation-Id";

        public String getCorrelationHeader() {
            return correlationHeader;
        }

        public void setCorrelationHeader(String correlationHeader) {
            this.correlationHeader = correlationHeader;
        }
    }

    public static class Mail {
        private boolean dailyEnabled;
        private String dailyCron = "0 0 8 * * *";
        private String dailyZone = "UTC";
        private String from = "no-reply@finance-tracker.local";
        private int dailyActiveWithinDays = 30;

        public boolean isDailyEnabled() {
            return dailyEnabled;
        }

        public void setDailyEnabled(boolean dailyEnabled) {
            this.dailyEnabled = dailyEnabled;
        }

        public String getDailyCron() {
            return dailyCron;
        }

        public void setDailyCron(String dailyCron) {
            this.dailyCron = dailyCron;
        }

        public String getDailyZone() {
            return dailyZone;
        }

        public void setDailyZone(String dailyZone) {
            this.dailyZone = dailyZone;
        }

        public String getFrom() {
            return from;
        }

        public void setFrom(String from) {
            this.from = from;
        }

        public int getDailyActiveWithinDays() {
            return dailyActiveWithinDays;
        }

        public void setDailyActiveWithinDays(int dailyActiveWithinDays) {
            this.dailyActiveWithinDays = dailyActiveWithinDays;
        }
    }
}
