package org.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.project.validation.ValidPassword;

public record UserCreateDto(
        @NotBlank
        String username,

        @Email
        @NotBlank
        String email,

        @NotBlank
        @ValidPassword
        String password,

        @NotBlank
        String firstName,

        @NotBlank
        String lastName
) {}