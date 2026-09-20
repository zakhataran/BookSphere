package org.project.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.project.dto.ChatMessageDto;
import org.project.service.ChatMessagesService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessagesService chatMessagesService;

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDto chatMessage, Principal principal) {
        UUID senderId = UUID.fromString(principal.getName());

        ChatMessageDto safeMessage = new ChatMessageDto(
                senderId,
                chatMessage.recipientId(),
                chatMessage.content(),
                null
        );

        log.info("Received message from {} to {}", senderId, safeMessage);

        ChatMessageDto savedMessage = chatMessagesService.saveMessage(chatMessage);

        messagingTemplate.convertAndSendToUser(
                savedMessage.recipientId().toString(),
                "/queue/messages",
                savedMessage
        );

        messagingTemplate.convertAndSendToUser(
                savedMessage.senderId().toString(),
                "/queue/messages",
                savedMessage
        );
    }
}