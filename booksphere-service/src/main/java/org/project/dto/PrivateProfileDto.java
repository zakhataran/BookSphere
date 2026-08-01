package org.project.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PrivateProfileDto(
        UUID id,
        String username,
        String email,
        String fullName,
        Boolean isVerified,
        String avatarUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}