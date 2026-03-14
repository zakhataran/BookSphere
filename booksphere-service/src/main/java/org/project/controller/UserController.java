package org.project.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.project.config.SecurityConfig;
import org.project.dto.*;
import org.project.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final SecurityConfig securityConfig;

    @PutMapping("/user-change")
    @ResponseStatus(HttpStatus.OK)
    public void changePersonalData(@RequestBody @Valid UserEditDto userEditDto) {
        userService.changePersonalData(userEditDto);
    }

    @PostMapping("/verification/send")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void sendVerificationMail() {
        String userEmail = securityConfig.getSecurityContext();
        userService.sendVerificationMail(userEmail);
    }

    @PostMapping("/verification/handle")
    @ResponseStatus(HttpStatus.OK)
    public void handleUserVerification(@RequestParam("code") String code) {
        userService.handleUserVerification(code);
    }

    @PostMapping("/password")
    public ResponseEntity<LoginResponse> changePassword(@RequestBody @Valid ChangePasswordDto changePasswordDto) {
        LoginResponse response = userService.changePassword(changePasswordDto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete-account")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@RequestBody @Valid UserDeleteDto userDeleteDto) {
        userService.deleteAccount(userDeleteDto);
    }

    @GetMapping("/profile")
    public ResponseEntity<PrivateProfileDto> getPersonalProfile() {
        PrivateProfileDto userReadDto = userService.getPersonalProfile();
        return ResponseEntity.ok(userReadDto);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicProfileDto> getUserProfile(@PathVariable("userId") UUID userId) {
        PublicProfileDto userReadDto = userService.getUserProfile(userId);
        return ResponseEntity.ok(userReadDto);
    }

    @GetMapping("/search")
    public ResponseEntity<PageDto<UserReadDto>> searchUser(@RequestParam("username") String username,
                                                        @RequestParam(name = "page", defaultValue = "0") int page,
                                                        @RequestParam(name = "size", defaultValue = "10") int size) {
        PageDto<UserReadDto> users = userService.searchUser(username, page, size);
        return ResponseEntity.ok(users);
    }
}