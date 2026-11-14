package org.project.dto;

import java.util.List;

public record AiBookAnalysisResponseDto(
        String title,
        String authorFirstName,
        String authorSecondName,
        String description,
        List<Long> categoryIds
) {}