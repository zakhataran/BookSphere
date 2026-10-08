package org.project.dto;

import jakarta.validation.constraints.NotBlank;
import org.project.validation.ValidPassword;

public record ChangePasswordDto(
        @NotBlank
        String oldPassword,

        @NotBlank
        @ValidPassword
        String newPassword
) {}