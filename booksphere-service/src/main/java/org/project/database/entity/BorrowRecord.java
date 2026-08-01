package org.project.database.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.project.database.entity.enums.BorrowStatus;
import org.springframework.scheduling.annotation.Async;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(schema = "book_sphere", name = "borrow_record")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BorrowRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "book_id", nullable = false)
    UUID bookId;

    @Column(name = "borrower_id", nullable = false)
    UUID borrowerId;

    @Column(name = "owner_id", nullable = false)
    UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    BorrowStatus status;

    @Column(name = "requested_days", nullable = false)
    Integer requestedDays;

    @Column(name = "modified_at")
    LocalDateTime modifiedAt;

    @Column(name = "expires_at")
    LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}