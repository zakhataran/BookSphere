package org.project.dto;

import jakarta.validation.constraints.NotEmpty;

public record UserEditDto(
        @NotEmpty
        String firstName,
        @NotEmpty
        String lastName
) {}