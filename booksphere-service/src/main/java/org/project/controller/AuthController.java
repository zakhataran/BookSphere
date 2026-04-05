package org.project.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.project.dto.LoginDto;
import org.project.dto.LoginResponse;
import org.project.dto.UserCreateDto;
import org.project.dto.UserReadDto;
import org.project.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/registration")
    public ResponseEntity<UserReadDto> registration(@RequestBody @Valid UserCreateDto newUser) {
        UserReadDto user = authService.create(newUser);

        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginDto loginDto) {
        return ResponseEntity.ok(authService.login(loginDto));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponse> refreshToken(@RequestParam("refresh_token") String refreshToken) {
        LoginResponse response = authService.refresh(refreshToken);
        return ResponseEntity.ok(response);
    }
}