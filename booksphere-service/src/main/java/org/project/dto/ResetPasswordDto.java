package org.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResetPasswordDto(
        @NotBlank @Email String email,
        @NotBlank String code,
        @NotBlank String newPassword,
        @NotBlank String confirmPassword
) {}