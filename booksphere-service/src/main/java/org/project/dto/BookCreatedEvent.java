package org.project.dto;

import org.springframework.context.ApplicationEvent;

import java.util.UUID;

public record BookCreatedEvent(
        UUID bookId
){}