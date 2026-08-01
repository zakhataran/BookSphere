package org.project.service.impl;

import lombok.RequiredArgsConstructor;
import org.project.config.SecurityConfig;
import org.project.database.entity.Book;
import org.project.database.entity.BorrowRecord;
import org.project.database.entity.User;
import org.project.database.entity.enums.BorrowStatus;
import org.project.database.repository.BookRepository;
import org.project.database.repository.BorrowRecordRepository;
import org.project.database.repository.UserRepository;
import org.project.dto.BorrowRecordDto;
import org.project.exceptions.BookNotFoundException;
import org.project.exceptions.UserNotFoundException;
import org.project.service.BorrowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BorrowServiceImpl implements BorrowService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final SecurityConfig securityConfig;

    @Override
    @Transactional
    public BorrowRecordDto requestBook(UUID bookId, Integer requestDays) {
        User currentUser = getCurrentUser();
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));

        boolean hasActiveRequest = borrowRecordRepository.findByBookIdAndBorrowerIdAndStatusIn(
                bookId,
                currentUser.getId(),
                List.of(BorrowStatus.PENDING, BorrowStatus.APPROVED)
        ).isPresent();

        if (hasActiveRequest) {
            throw new IllegalArgumentException("You already have a pending or active request for this book");
        }

        BorrowRecord record = BorrowRecord.builder()
                .bookId(book.getId())
                .borrowerId(currentUser.getId())
                .ownerId(book.getUser().getId())
                .status(BorrowStatus.PENDING)
                .requestedDays(requestDays)
                .build();

        BorrowRecord save = borrowRecordRepository.save(record);

        return new BorrowRecordDto(save.getId(), save.getBookId(), save.getBorrowerId(), save.getStatus(), save.getRequestedDays(), save.getExpiresAt(), LocalDateTime.now());
    }

    @Override
    @Transactional
    public void approveRequest(UUID recordId) {
        User currentUser = getCurrentUser();
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Record not found"));

        if (!record.getOwnerId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Only the owner can approve this request");
        }

        if (record.getStatus() != BorrowStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING request can be approved");
        }

        record.setStatus(BorrowStatus.PENDING);
        record.setModifiedAt(LocalDateTime.now());
        record.setExpiresAt(LocalDateTime.now().plusDays(record.getRequestedDays()));

        borrowRecordRepository.save(record);
    }

    @Override
    public void rejectRequest(UUID recordId) {
        User currentUser = getCurrentUser();
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Record not found"));

        if (!record.getOwnerId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Only the owner can approve this request");
        }

        record.setStatus(BorrowStatus.REJECTED);
        record.setModifiedAt(LocalDateTime.now());
        borrowRecordRepository.save(record);
    }

    // TODO: список запросов входящих и выходящих (или все сразу) одним методом и под нее страницу в чатах

    private User getCurrentUser() {
        String email = securityConfig.getSecurityContext();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
}