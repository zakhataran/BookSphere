package org.project.database.repository;

import io.lettuce.core.dynamic.annotation.Param;
import org.project.database.entity.BorrowRecord;
import org.project.database.entity.enums.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, UUID> {

    List<BorrowRecord> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Optional<BorrowRecord> findByBookIdAndBorrowerIdAndStatusIn(UUID bookId, UUID borrowerId, List<BorrowStatus> statuses);

    @Query("SELECT b FROM BorrowRecord b WHERE b.bookId = :bookId AND b.borrowerId = :borrowerId AND b.status = 'APPROVED'")
    Optional<BorrowRecord> findActiveBorrow(@Param("bookId") UUID bookId, @Param("borrowerId") UUID borrowerId);
}