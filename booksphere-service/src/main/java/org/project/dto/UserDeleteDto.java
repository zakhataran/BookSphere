package org.project.dto;

import jakarta.validation.constraints.NotBlank;

public record UserDeleteDto(
        @NotBlank
        String password
) {}