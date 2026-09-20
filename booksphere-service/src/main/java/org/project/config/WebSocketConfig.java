package org.project.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.Nullable;
import org.project.database.entity.User;
import org.project.database.repository.UserRepository;
import org.project.exceptions.KeycloakBadRequestException;
import org.project.exceptions.UserNotFoundException;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.Collections;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final UserRepository userRepository;
    private final JwtDecoder jwtDecoder;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Nullable
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
                    return message;
                }

                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    log.warn("Websocket CONNECT rejected: missing Authorization header");
                    throw new IllegalArgumentException("Authorization header is required");
                }

                String token = authHeader. substring(7);
                try {
                    Jwt jwt = jwtDecoder.decode(token);
                    String email = jwt.getClaimAsString("email");
                    if (email == null) {
                        throw new IllegalArgumentException("JWT does not contain email claim");
                    }

                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new UserNotFoundException("User not found"));

                    UsernamePasswordAuthenticationToken principal = new UsernamePasswordAuthenticationToken(
                            user.getId().toString(),
                            null,
                            Collections.emptyList()
                    );

                    accessor.setUser(principal);
                    return message;
                } catch (Exception e) {
                    log.warn("Invalid token for websocket connection: {}", e.getMessage());
                    throw new IllegalArgumentException("Invalid or expired token");
                }
            }
        });
    }
}