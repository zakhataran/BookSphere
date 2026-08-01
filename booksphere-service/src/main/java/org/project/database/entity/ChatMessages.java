package org.project.database.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(schema = "book_sphere", name = "chat_messages")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessages {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "sender_id", nullable = false)
    UUID senderId;

    @Column(name = "recipient_id", nullable = false)
    UUID recipientId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    String content;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    LocalDateTime timestamp;
}