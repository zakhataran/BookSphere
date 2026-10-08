package org.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.project.validation.ValidPassword;

public record ResetPasswordDto(
        @NotBlank @Email String email,
        @NotBlank String code,
        @NotBlank @ValidPassword String newPassword,
        @NotBlank String confirmPassword
) {}