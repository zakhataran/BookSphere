package org.project.dto;

import java.util.UUID;

public record UserReadDto(
        UUID userId,
        String username,
        String fullName
) {}