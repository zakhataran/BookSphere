package org.project.service;

import org.project.dto.ChatMessageDto;
import org.project.dto.UserReadDto;

import java.util.List;
import java.util.UUID;

public interface ChatMessagesService {

    ChatMessageDto saveMessage(ChatMessageDto chatMessageDto);

    List<ChatMessageDto> getChatHistory(UUID senderId, UUID recipientId);

    List<UserReadDto> getRecentConversations(UUID userId);
}