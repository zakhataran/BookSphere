package org.project.controller;


import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.project.config.SecurityConfig;
import org.project.dto.*;
import org.project.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
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

    @PutMapping(value = "/upload-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public void updateAvatar(@ModelAttribute @Valid ImageUploadDto imageUploadDto) {
        userService.uploadAvatar(imageUploadDto);
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

    @PostMapping("/change-password")
    public ResponseEntity<LoginResponse> changePassword(@RequestBody @Valid ChangePasswordDto changePasswordDto) {
        LoginResponse response = userService.changePassword(changePasswordDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/password-reset/initiate")
    public ResponseEntity<String> initiatePasswordReset(@RequestParam @Email @NotBlank(message = "Email cannot be empty") String email) {
        log.info("Received request to initiate password reset for: {}", email);
        userService.initiatePasswordReset(email);

        return ResponseEntity.ok("Verification code sent to email");
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<String> confirmPasswordReset(@Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        log.info("Received request to confirm password reset for: {}", resetPasswordDto.email());
        userService.resetPassword(resetPasswordDto);

        return ResponseEntity.ok("Password successfully reset");
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
    public ResponseEntity<PageDto<UserReadDto>> searchUser(@RequestParam("query") String query,
                                                        @RequestParam(name = "page", defaultValue = "0") int page,
                                                        @RequestParam(name = "size", defaultValue = "50") int size) {
        PageDto<UserReadDto> users = userService.searchUser(query, page, size);
        return ResponseEntity.ok(users);
    }
}