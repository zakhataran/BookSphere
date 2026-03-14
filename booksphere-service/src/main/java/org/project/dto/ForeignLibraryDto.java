package org.project.dto;

import org.project.database.entity.enums.ReadingStatus;

import java.util.UUID;

public record ForeignLibraryDto(
        UUID bookId,
        String title,
        String author,
        String imageUrl,
        String categoryName,
        ReadingStatus readStatus
) {}