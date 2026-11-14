package org.project.service;

import java.util.UUID;

public interface BookEmbeddingService {

    void generateFor(UUID bookId);

    void backfillMissing();
}