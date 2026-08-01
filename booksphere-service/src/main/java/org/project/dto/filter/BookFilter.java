package org.project.dto.filter;

import java.util.List;

public record BookFilter (
        String query,
        List<Long> categoryIds,
        Boolean isAscOrder,
        String sortBy
) {}