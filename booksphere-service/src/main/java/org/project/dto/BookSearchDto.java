package org.project.dto;

import java.util.List;
import java.util.UUID;

public record BookSearchDto(
        UUID bookId,
        String title,
        String author,
        String imageUrl,
        List<CategoryReadDto> categories,
        String uploaderUsername
) {}