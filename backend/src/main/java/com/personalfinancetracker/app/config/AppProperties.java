package com.personalfinancetracker.app.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private final Cors cors = new Cors();
    private final Scheduling scheduling = new Scheduling();
    private final Observability observability = new Observability();

    public Cors getCors() {
        return cors;
    }

    public Scheduling getScheduling() {
        return scheduling;
    }

    public Observability getObservability() {
        return observability;
    }

    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>(List.of("http://localhost:5173"));
        private List<String> allowedOriginPatterns = new ArrayList<>();

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }

        public List<String> getAllowedOriginPatterns() {
            return allowedOriginPatterns;
        }

        public void setAllowedOriginPatterns(List<String> allowedOriginPatterns) {
            this.allowedOriginPatterns = allowedOriginPatterns;
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
}
