package org.project.event;

import lombok.RequiredArgsConstructor;
import org.project.dto.BookCreatedEvent;
import org.project.service.BookEmbeddingService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class BookEmbeddingListener {

    private final BookEmbeddingService embeddingService;

    @Value("${ai.backfill-embeddings-on-startup:false}")
    private boolean backfillOnStartup;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookCreated(BookCreatedEvent event) {
        embeddingService.generateFor(event.bookId());
    }

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        if (backfillOnStartup) {
            embeddingService.backfillMissing();
        }
    }
}