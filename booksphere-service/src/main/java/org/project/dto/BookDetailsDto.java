package org.project.dto;

import java.util.UUID;

public record BookDetailsDto(
        UUID bookId,
        String title,
        String authorFullName,
        String categoryName,
        String imageUrl,
        UUID uploaderId,
        String uploaderUsername,
        String uploaderAvatarUrl
) {}