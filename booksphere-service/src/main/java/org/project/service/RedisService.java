package org.project.service;

public interface RedisService {

    void saveVerificationCode(String email, String code);

    boolean verifyAndClear(String email, String code);
}