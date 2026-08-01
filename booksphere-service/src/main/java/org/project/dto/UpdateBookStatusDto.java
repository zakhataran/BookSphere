package org.project.dto;

public record UpdateBookStatusDto(
        int currentPage,
        int readPercentage,
        String readingStatus
) {}