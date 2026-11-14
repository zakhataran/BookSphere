package org.project.service.impl;

import groovy.util.logging.Slf4j;
import lombok.RequiredArgsConstructor;
import org.project.database.entity.Book;
import org.project.database.entity.Category;
import org.project.database.repository.BookRepository;
import org.project.service.AiService;
import org.project.service.BookEmbeddingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@lombok.extern.slf4j.Slf4j
@Slf4j
@Service
@RequiredArgsConstructor
public class BookEmbeddingServiceImpl implements BookEmbeddingService {

    private final BookRepository bookRepository;
    private final AiService aiService;
    private final TransactionTemplate tx;

    @Override
    public void generateFor(UUID bookId) {
        String text = tx.execute(status -> bookRepository.findById(bookId)
                .map(this::buildText)
                .orElse(null));

        if (text == null) {
            return;
        }

        try {
            float[] embedding = aiService.generatedEmbedding(text);

            tx.executeWithoutResult(status -> bookRepository.findById(bookId).ifPresent(book -> {
                book.setEmbedding(embedding);
                bookRepository.save(book);
            }));
        } catch (Exception e) {
            log.warn("Embedding generation failed for book {}", bookId, e);
        }
    }

    @Override
    public void backfillMissing() {
        List<UUID> ids = bookRepository.findIdsWithoutEmbedding();
        log.info("Embedding backfill started: {} books", ids.size());
        ids.forEach(this::generateFor);
        log.info("Embedding backfill finished");
    }

    private String buildText(Book book) {
        String categories = book.getCategories().stream()
                .map(Category::getName)
                .collect(Collectors.joining(", "));

        StringBuilder sb = new StringBuilder()
                .append("Title: ").append(book.getTitle())
                .append(". Author: ").append(book.getAuthorFirstName()).append(' ').append(book.getAuthorSecondName())
                .append(". Categories: ").append(categories).append('.');

        if (book.getDescription() != null && !book.getDescription().isBlank()) {
            sb.append(" Description: ").append(book.getDescription());
        }

        return sb.toString();
    }
}