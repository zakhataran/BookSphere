package org.project.service;

import org.project.dto.LoginDto;
import org.project.dto.LoginResponse;
import org.project.dto.UserCreateDto;
import org.project.dto.UserReadDto;
import org.project.exceptions.KeycloakBadRequestException;

public interface AuthService {

    UserReadDto create(UserCreateDto userCreateDto) throws KeycloakBadRequestException;

    LoginResponse login(LoginDto loginDto);

    LoginResponse refresh(String refreshToken);

    boolean isPasswordValid(String email, String password);
}