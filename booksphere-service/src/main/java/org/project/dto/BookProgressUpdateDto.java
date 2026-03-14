package org.project.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BookProgressUpdateDto(
        @NotNull
        @Min(1)
        Integer currentPage
) {}