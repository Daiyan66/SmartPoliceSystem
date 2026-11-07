package com.smartpolice.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    @Value("${smartpolice.rate-limiting.login-tokens-per-minute:10}")
    private long loginTokensPerMinute;

    @Value("${smartpolice.rate-limiting.sos-tokens-per-minute:5}")
    private long sosTokensPerMinute;

    @Value("${smartpolice.rate-limiting.public-tokens-per-minute:30}")
    private long publicTokensPerMinute;

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> sosBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    public boolean tryConsumeLogin(String clientIp) {
        Bucket bucket = loginBuckets.computeIfAbsent(clientIp, k -> createBucket(loginTokensPerMinute));
        return bucket.tryConsume(1);
    }

    public boolean tryConsumeSos(String clientIp) {
        Bucket bucket = sosBuckets.computeIfAbsent(clientIp, k -> createBucket(sosTokensPerMinute));
        return bucket.tryConsume(1);
    }

    public boolean tryConsumeGeneral(String clientIp) {
        Bucket bucket = generalBuckets.computeIfAbsent(clientIp, k -> createBucket(publicTokensPerMinute));
        return bucket.tryConsume(1);
    }

    private Bucket createBucket(long tokensPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(tokensPerMinute)
                .refillGreedy(tokensPerMinute, Duration.ofMinutes(1))
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
