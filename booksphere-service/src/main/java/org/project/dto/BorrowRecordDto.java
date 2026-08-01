package org.project.dto;

import org.project.database.entity.enums.BorrowStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record BorrowRecordDto(
        UUID id,
        UUID bookId,
        UUID borrowerId,
        BorrowStatus status,
        Integer requestDays,
        LocalDateTime expiresAt,
        LocalDateTime modifiedAt
) {}