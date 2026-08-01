package org.project.service.impl;

import jakarta.ws.rs.ClientErrorException;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.project.config.SecurityConfig;
import org.project.database.entity.User;
import org.project.database.repository.UserRepository;
import org.project.dto.*;
import org.project.exceptions.AuthLoginException;
import org.project.exceptions.KeycloakBadRequestException;
import org.project.exceptions.MailSendException;
import org.project.exceptions.UserNotFoundException;
import org.project.mapper.UserMapper;
import org.project.service.AuthService;
import org.project.service.MinioService;
import org.project.service.RedisService;
import org.project.service.UserService;
import org.project.util.CodeGeneratorUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    @Value("${spring.keycloak.rest.realm}")
    private String realm;

    private final UserRepository userRepository;
    private final SecurityConfig securityConfig;
    private final UserMapper userMapper;
    private final Keycloak keycloak;
    private final JavaMailSender mailSender;
    private final CodeGeneratorUtils codeGeneratorUtils;
    private final RedisService redisService;
    private final AuthService authService;
    private final MinioService minioService;

    @Override
    @Transactional
    public void changePersonalData(UserEditDto userEditDto) {
        String userEmail = securityConfig.getSecurityContext();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User with email: " + userEmail + " not found"));

        UserResource userResource = keycloak.realm(realm).users().get(user.getId().toString());
        UserRepresentation userRepresentation = userResource.toRepresentation();

        boolean hasAnyDataChanged = false;

        if (!user.getFirstName().equals(userEditDto.firstName())) {
            user.setFirstName(userEditDto.firstName());
            userRepresentation.setFirstName(userEditDto.firstName());
            hasAnyDataChanged = true;
        }

        if (!user.getLastName().equals(userEditDto.lastName())) {
            user.setLastName(userEditDto.lastName());
            userRepresentation.setLastName(userEditDto.lastName());
            hasAnyDataChanged = true;
        }

        if (hasAnyDataChanged) {
            try {
                userResource.update(userRepresentation);
            } catch (ClientErrorException e) {
                log.error("Failed to update Keycloak credentials: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.CONFLICT, "New username or email is already in use by another account");
            }

            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    @Override
    @Transactional
    public void uploadAvatar(ImageUploadDto imageUploadDto) {
        minioService.uploadImage(imageUploadDto);
    }

    @Override
    @Async
    public void sendVerificationMail(String userEmail) {
        String code = codeGeneratorUtils.generateCode();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(userEmail);
            message.setSubject("Verify BookSphere account");
            message.setText("Your code is:\n" + code + "\n\nThis code is valid during 2 minutes");

            mailSender.send(message);
            redisService.saveVerificationCode(userEmail, code);
            log.info("Verification mail sent to {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send verification mail to {}", userEmail);
            throw new MailSendException("Failed to initiate email verification\n" + e);
        }
    }

    @Override
    @SneakyThrows
    @Transactional
    public void handleUserVerification(String code) {
        String userEmail = securityConfig.getSecurityContext();
        boolean isCodeValid = redisService.verifyAndClear(userEmail, code);

        if (!isCodeValid) {
            log.warn("Verification failed for user {}: Invalid or expired code", userEmail);
            throw new IllegalAccessException("Invalid or expired verification code");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User with email: " + userEmail + " not found"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            log.warn("User {} is already verified", user.getUsername());
             throw new RuntimeException("User " + user.getUsername() + " is already verified");
        }

        user.setIsVerified(Boolean.TRUE);
        userRepository.save(user);

        log.info("User {} successfully verified", user.getUsername());
    }

    @Override
    public LoginResponse changePassword(ChangePasswordDto changePasswordDto) {
        String userEmail = securityConfig.getSecurityContext();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User with email: " + userEmail + " not found"));

        String oldPassword = changePasswordDto.oldPassword();
        String newPassword = changePasswordDto.newPassword();

        if (oldPassword.equals(newPassword)) {
            throw new IllegalArgumentException("New password cannot be the same as tha old password");
        }

        if (authService.isPasswordValid(userEmail, oldPassword)) {
            throw new AuthLoginException("The old password provided is incorrect");
        }

        try {
            UserResource userResource = keycloak.realm(realm).users().get(user.getId().toString());

            CredentialRepresentation passwordCredential = new CredentialRepresentation();
            passwordCredential.setTemporary(Boolean.FALSE);
            passwordCredential.setType(CredentialRepresentation.PASSWORD);
            passwordCredential.setValue(newPassword);

            userResource.resetPassword(passwordCredential);

            log.info("Password successfully changed for user: {}", user.getUsername());
        } catch (Exception e) {
            log.error("Failed to change password in Keycloak: {}", e.getMessage());
            throw new KeycloakBadRequestException("Failed to update password in Keycloak");
        }

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        LoginDto loginDto = new LoginDto(userEmail, newPassword);
        return authService.login(loginDto);
    }

    @Override
    @Async
    public void initiatePasswordReset(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email: " + email + " not found"));

        String code = codeGeneratorUtils.generateCode();

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Reset your BookSphere Password");
            message.setText("You password reset code is:\n" + code + "\n\nThis code is valid for 2 minutes.");

            mailSender.send(message);
            redisService.saveVerificationCode(email, code);

            log.info("Password reset email sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset mail to {}", email);
            throw new MailSendException("Failed to initiate password reset\n" + e);
        }
    }

    @Override
    public void resetPassword(ResetPasswordDto resetPasswordDto) {
        if (!resetPasswordDto.newPassword().equals(resetPasswordDto.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        boolean isCodeValid = redisService.verifyAndClear(resetPasswordDto.email(), resetPasswordDto.code());
        if (!isCodeValid) {
            log.warn("Password reset failed for {}: Invalid or expired code", resetPasswordDto.email());
            throw new IllegalArgumentException("Invalid or expired code");
        }

        User user = userRepository.findByEmail(resetPasswordDto.email())
                .orElseThrow(() -> new UserNotFoundException("User with email: " + resetPasswordDto.email() + " not found"));

        try {
            UserResource userResource = keycloak.realm(realm).users().get(user.getId().toString());
            CredentialRepresentation passwordCredential = new CredentialRepresentation();
            passwordCredential.setTemporary(Boolean.FALSE);
            passwordCredential.setType(CredentialRepresentation.PASSWORD);
            passwordCredential.setValue(resetPasswordDto.newPassword());

            userResource.resetPassword(passwordCredential);

            log.info("Password successfully reset for user: {}", user.getUsername());
        } catch (Exception e) {
            log.error("Failed to reset password in Keycloak: {}", e.getMessage());
            throw new KeycloakBadRequestException("Failed to reset password in Keycloak");
        }

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteAccount(UserDeleteDto userDeleteDto) {
        String userEmail = securityConfig.getSecurityContext();
        String password = userDeleteDto.password();

        if (authService.isPasswordValid(userEmail, password)) {
            log.warn("Account deletion failed for user {}: Incorrect password provided", userEmail);
            throw new IllegalArgumentException("Incorrect password provided");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User with email: " + userEmail + " not found"));

        try {
            UserResource userResource = keycloak.realm(realm).users().get(user.getId().toString());
            userResource.remove();
            log.info("Keycloak account successfully deleted for user {}", user.getUsername());
        } catch (ClientErrorException e) {
            if (e.getResponse().getStatus() == 404) {
                log.warn("Keycloak user ID {} not found", user.getId());
            } else {
                log.error("Failed to delete Keycloak account for user ID: {}", user.getId());
                throw new KeycloakBadRequestException("Failed to delete Keycloak account");
            }
        }

        userRepository.delete(user);
        log.info("Local account successfully deleted for {}", userEmail);
    }

    @Override
    public PrivateProfileDto getPersonalProfile() {
        String userEmail = securityConfig.getSecurityContext();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User with email: " + userEmail + " not found"));

        return userMapper.toPrivateProfileDto(user);
    }

    @Override
    public PublicProfileDto getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with ID: " + userId + " not found"));

        return userMapper.toPublicProfileDto(user);
    }

    @Override
    public PageDto<UserReadDto> searchUser(String query, int page, int size) {
        String userEmail = securityConfig.getSecurityContext();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User with email: " + userEmail + " not found"));


        Page<User> users = userRepository.searchUsers(user.getId(), query, PageRequest.of(page, size));

        return new PageDto<>(
                userMapper.toUserReadDto(users.getContent()),
                new CustomPage(users.getTotalElements(), users.getTotalPages(), users.getNumber(), users.getSize())
        );
    }
}