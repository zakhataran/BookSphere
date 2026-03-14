package org.project.dto;

public record FileMetadataDto(
        String title,
        String author,
        Integer numPages
) {}