package org.project.dto;

import java.util.UUID;

public record BookSearchDto(
        UUID bookId,
        String title,
        String author,
        String imageUrl
) {}