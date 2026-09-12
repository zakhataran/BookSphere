package org.project.dto;

import org.project.database.entity.enums.BorrowStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record BorrowRequestViewDto(
        UUID recordId,
        UUID bookId,
        String bookTitle,
        String bookImageUrl,
        UUID otherUserId,
        String otherUserFullName,
        String otherUserAvatarUrl,
        BorrowStatus status,
        Integer requestedDays,
        LocalDateTime expiresAt,
        LocalDateTime createdAt
) {}