package org.project.database.repository;

import org.project.database.entity.Book;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {

    List<Book> findBooksByUserId(UUID userId);

    List<Book> findBooksByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);

    Optional<Book> findBookById(UUID id);
}