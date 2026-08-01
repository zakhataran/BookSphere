package org.project.database.repository;

import org.project.database.entity.ChatMessages;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessagesRepository extends JpaRepository<ChatMessages, UUID> {

    @Query("SELECT m FROM ChatMessages m WHERE " +
            "(m.senderId = :user1 AND m.recipientId = :user2) OR " +
            "(m.senderId = :user2 AND m.recipientId = :user1) " +
            "ORDER BY m.timestamp ASC")
    List<ChatMessages> findChatHistory(@Param("user1") UUID user1, @Param("user2") UUID user2);

    @Query("SELECT DISTINCT CASE WHEN m.senderId = :userId THEN m.recipientId ELSE m.senderId END " +
            "FROM ChatMessages m WHERE m.senderId = :userId OR m.recipientId = :userId")
    List<UUID> findInterlocutorIds(@Param("userId") UUID userId);
}