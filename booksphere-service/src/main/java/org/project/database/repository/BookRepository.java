package org.project.database.repository;

import org.project.database.entity.Book;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {

    List<Book> findBooksByUserId(UUID userId);

    @Query("SELECT b FROM Book b WHERE " +
            "LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%')) OR " +
            "LOWER(b.authorFirstName) LIKE LOWER(CONCAT('%', :author, '%')) OR " +
            "LOWER(b.authorSecondName) LIKE LOWER(CONCAT('%', :author, '%')) OR " +
            "LOWER(CONCAT(b.authorFirstName, ' ', b.authorSecondName)) LIKE LOWER(CONCAT('%', :author, '%'))")
    List<Book> searchByTitleOrAuthor(@Param("title")String title, @Param("author") String author);

}