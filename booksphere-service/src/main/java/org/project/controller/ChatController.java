package org.project.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.project.dto.ChatMessageDto;
import org.project.service.ChatMessagesService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessagesService chatMessagesService;

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDto chatMessage) {
        log.info("Received message from {} to {}", chatMessage.senderId(), chatMessage.recipientId());

        ChatMessageDto savedMessage = chatMessagesService.saveMessage(chatMessage);

        messagingTemplate.convertAndSendToUser(
                savedMessage.recipientId().toString(),
                "/queue/messages",
                chatMessage
        );
    }
}