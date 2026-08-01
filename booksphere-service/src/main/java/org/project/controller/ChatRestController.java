package org.project.controller;

import lombok.RequiredArgsConstructor;
import org.project.config.SecurityConfig;
import org.project.database.entity.User;
import org.project.database.repository.ChatMessagesRepository;
import org.project.database.repository.UserRepository;
import org.project.dto.ChatMessageDto;
import org.project.dto.UserReadDto;
import org.project.exceptions.UserNotFoundException;
import org.project.service.ChatMessagesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatMessagesService chatMessagesService;
    private final SecurityConfig securityConfig;
    private final UserRepository userRepository;

    @GetMapping("/history/{recipientId}")
    public ResponseEntity<List<ChatMessageDto>> getChatHistory(@PathVariable UUID recipientId) {
        String email = securityConfig.getSecurityContext();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException("User with email " + " not found"));

        List<ChatMessageDto> history = chatMessagesService.getChatHistory(currentUser.getId(), recipientId);

        return ResponseEntity.ok(history);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<UserReadDto>> getRecentConversations() {
        String email = securityConfig.getSecurityContext();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<UserReadDto> conversations = chatMessagesService.getRecentConversations(currentUser.getId());
        return ResponseEntity.ok(conversations);
    }
}