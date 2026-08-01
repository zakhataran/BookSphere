package org.project.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageDto(
        UUID senderId,
        UUID recipientId,
        String content,
        LocalDateTime timestamp
) {}