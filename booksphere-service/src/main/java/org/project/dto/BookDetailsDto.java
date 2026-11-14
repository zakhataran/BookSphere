package org.project.dto;

import java.util.List;
import java.util.UUID;

public record BookDetailsDto(
        UUID bookId,
        String title,
        String authorFullName,
        List<CategoryReadDto> categories,
        String description,
        String imageUrl,
        UUID uploaderId,
        String uploaderUsername,
        String uploaderAvatarUrl
) {}