package org.project.dto;

import org.project.database.entity.enums.ReadingStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record MyLibraryDto(
        UUID bookId,
        String title,
        String authorFullName,
        String imageUrl,
        String categoryName,
        ReadingStatus readingStatus,
        Integer bookMarkPage,
        BigDecimal readPercentage
) {}