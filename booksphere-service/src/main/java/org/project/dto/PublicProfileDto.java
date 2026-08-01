package org.project.dto;

import java.util.UUID;

public record PublicProfileDto(
        UUID id,
        String username,
        String fullName,
        String avatarUrl,
        Boolean isVerified
) {}