package org.project.dto;

public record ReadBookDto(
        String bookUrl,
        Integer bookMarkPage
) {}