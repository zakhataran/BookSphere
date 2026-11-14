package org.project.dto;

import org.project.database.entity.enums.ReadingStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ForeignLibraryDto(
        UUID bookId,
        String title,
        String authorFullName,
        String imageUrl,
        List<CategoryReadDto> categories,
        ReadingStatus readingStatus,
        BigDecimal readPercentage
) {}