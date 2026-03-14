package org.project.dto;

import java.time.LocalDateTime;

public record PrivateProfileDto(
        String username,
        String email,
        String firstName,
        String lastName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}