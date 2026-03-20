package com.personalfinancetracker.app.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class RateLimitConfig {
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Bucket resolve(String key, long capacity) {
        return buckets.computeIfAbsent(key + ":" + capacity,
                ignored -> Bucket.builder().addLimit(Bandwidth.simple(capacity, Duration.ofMinutes(10))).build());
    }
}
