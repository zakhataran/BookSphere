package org.project.database.repository;

import org.project.database.entity.UserBookStatus;
import org.project.database.entity.embedded.UserBookStatusId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBookStatusRepository extends JpaRepository<UserBookStatus, UserBookStatusId> {

    @Query(value = "SELECT ubs FROM UserBookStatus ubs " +
    "WHERE ubs.user.id = :userId",

            countQuery = "SELECT COUNT(ubs) FROM UserBookStatus ubs " +
                    "WHERE ubs.user.id = :userId")
    Page<UserBookStatus> findUserLibraryWithDetails(@Param("userId") UUID userId, Pageable pageable);

    Optional<UserBookStatus> findUserBookStatusByUserIdAndBookId(UUID userId, UUID bookId);
}