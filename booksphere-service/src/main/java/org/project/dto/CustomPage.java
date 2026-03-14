package org.project.dto;

public record CustomPage(
        Long totalElements,
        int totalPage,
        int page,
        int size
) {}