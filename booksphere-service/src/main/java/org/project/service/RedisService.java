package org.project.service;

import java.time.Duration;

public interface RedisService {

    void saveVerificationCode(String email, String code);

    boolean verifyAndClear(String email, String code);

    boolean tryAcquire(String key, int limit, Duration window);
}