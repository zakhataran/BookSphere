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

    @Query(value = "SELECT * FROM book_sphere.book b " +
            "WHERE b.id NOT IN :excludeIds " +
            "AND b.embedding IS NOT NULL " +
            "ORDER BY b.embedding <=> CAST(:vectorStr AS vector) " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Book> findRecommendations(@Param("vectorStr") String vectorStr,
                                   @Param("excludeIds") List<UUID> excludeIds,
                                   @Param("limit") int limit);

    @Query("select b.id from Book b where b.embedding is null")
    List<UUID> findIdsWithoutEmbedding();
}