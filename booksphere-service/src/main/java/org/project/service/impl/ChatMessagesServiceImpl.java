package org.project.service.impl;

import lombok.RequiredArgsConstructor;
import org.project.database.entity.ChatMessages;
import org.project.database.repository.ChatMessagesRepository;
import org.project.database.repository.UserRepository;
import org.project.dto.ChatMessageDto;
import org.project.dto.UserReadDto;
import org.project.service.ChatMessagesService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatMessagesServiceImpl implements ChatMessagesService {

    private final ChatMessagesRepository chatMessagesRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ChatMessageDto saveMessage(ChatMessageDto chatMessageDto) {
        if (!userRepository.existsById(chatMessageDto.recipientId())) {
            throw new UsernameNotFoundException("Recipient with id " + chatMessageDto.recipientId() + " was not found");
        }

        ChatMessages message = ChatMessages.builder()
                .senderId(chatMessageDto.senderId())
                .recipientId(chatMessageDto.recipientId())
                .content(chatMessageDto.content())
                .build();

        ChatMessages savedMessage = chatMessagesRepository.save(message);

        return new ChatMessageDto(
                savedMessage.getSenderId(),
                savedMessage.getRecipientId(),
                savedMessage.getContent(),
                savedMessage.getTimestamp()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getChatHistory(UUID senderId, UUID recipientId) {
        List<ChatMessages> history = chatMessagesRepository.findChatHistory(senderId, recipientId);

        return history.stream()
                .map(msg -> new ChatMessageDto(
                        msg.getSenderId(),
                        msg.getRecipientId(),
                        msg.getContent(),
                        msg.getTimestamp()
                )).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserReadDto> getRecentConversations(UUID userId) {
        List<UUID> interlocutorsIds = chatMessagesRepository.findInterlocutorIds(userId);

        if (interlocutorsIds.isEmpty()) {
            return List.of();
        }

        return userRepository.findAllById(interlocutorsIds).stream()
                .map(user -> new UserReadDto(
                        user.getId(),
                        user.getUsername(),
                        user.getFirstName() + " " + user.getLastName(),
                        user.getAvatarUrl()
                ))
                .toList();
    }
}