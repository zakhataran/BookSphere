package org.project.dto;

import java.util.List;

public record PageDto<T>(
        List<T> content,
        CustomPage customPage
)
{}