package org.project.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.project.service.RedisService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisServiceImpl implements RedisService {

    private final StringRedisTemplate redisTemplate;
    private final PasswordEncoder passwordEncoder;

    private static final String KEY_PREFIX = "verification:";

    @Value("${spring.redis.verification.ttl-minutes}")
    private long TTL;

    @Override
    public void saveVerificationCode(String email, String code) {
        String key = KEY_PREFIX + email;
        String hashedCode = passwordEncoder.encode(code);

        Duration ttlDuration = Duration.ofMinutes(TTL);

        redisTemplate.opsForValue().set(key, hashedCode, ttlDuration);
    }

    @Override
    public boolean verifyAndClear(String email, String code) {
        String key = KEY_PREFIX + email;
        String hashedCode = redisTemplate.opsForValue().get(key);

        if (hashedCode == null) {
            return false;
        }

        if (passwordEncoder.matches(code, hashedCode)) {
            redisTemplate.delete(key);
            log.info("Email {}, was verified", email);
            return true;
        }

        return false;
    }
}