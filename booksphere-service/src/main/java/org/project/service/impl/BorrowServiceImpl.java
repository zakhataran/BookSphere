package org.project.service.impl;

import lombok.RequiredArgsConstructor;
import org.project.config.SecurityConfig;
import org.project.database.entity.Book;
import org.project.database.entity.BorrowRecord;
import org.project.database.entity.User;
import org.project.database.entity.UserBookStatus;
import org.project.database.entity.enums.BorrowStatus;
import org.project.database.entity.enums.ReadingStatus;
import org.project.database.repository.BookRepository;
import org.project.database.repository.BorrowRecordRepository;
import org.project.database.repository.UserBookStatusRepository;
import org.project.database.repository.UserRepository;
import org.project.dto.*;
import org.project.exceptions.BookNotFoundException;
import org.project.exceptions.UserNotFoundException;
import org.project.mapper.UserBookStatusMapper;
import org.project.service.BorrowService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final UserBookStatusRepository userBookStatusRepository;
    private final UserBookStatusMapper userBookStatusMapper;

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

        record.setStatus(BorrowStatus.APPROVED);
        record.setModifiedAt(LocalDateTime.now());
        record.setExpiresAt(LocalDateTime.now().plusDays(record.getRequestedDays()));

        borrowRecordRepository.save(record);
    }

    @Override
    @Transactional
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

    @Override
    public BorrowRecordDto getBorrowStatus(UUID bookId) {
        User currentUser = getCurrentUser();

        return borrowRecordRepository
                .findByBookIdAndBorrowerIdAndStatusIn(bookId, currentUser.getId(), List.of(BorrowStatus.PENDING, BorrowStatus.APPROVED))
                .map(saved -> new BorrowRecordDto(saved.getId(), saved.getBookId(), saved.getBorrowerId(), saved.getStatus(), saved.getRequestedDays(), saved.getExpiresAt(), saved.getModifiedAt()))
                .orElse(null);
    }

    @Override
    public List<BorrowRequestViewDto> getIncomingRequest() {
        User currentUser = getCurrentUser();
        return borrowRecordRepository.findAllByOwnerIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().map(this::mapToViewDto).toList();
    }

    @Override
    public List<BorrowRequestViewDto> getOutgoingRequest() {
        User currentUser = getCurrentUser();
        return borrowRecordRepository.findAllByBorrowerIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().map(this::mapToViewDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageDto<MyLibraryDto> getBorrowedBooks(int page, int size) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<BorrowRecord> borrowRecords = borrowRecordRepository.findAllByBorrowerIdAndStatus(currentUser.getId(), BorrowStatus.APPROVED, pageable);

        List<UserBookStatus> statuses = borrowRecords.getContent().stream()
                .map(record -> {
                    Book book = bookRepository.findById(record.getBookId())
                            .orElseThrow(() -> new BookNotFoundException("Book not found"));

                    return userBookStatusRepository.findUserBookStatusByUserIdAndBookId(currentUser.getId(), book.getId())
                            .orElseGet(() -> UserBookStatus.builder()
                                    .user(currentUser)
                                    .book(book)
                                    .readingStatus(ReadingStatus.WANT_TO_READ)
                                    .bookMarkPage(1)
                                    .build());
                }).toList();

        return new PageDto<>(
                userBookStatusMapper.toMyLibraryDto(statuses), new CustomPage(borrowRecords.getTotalElements(), borrowRecords.getTotalPages(), borrowRecords.getNumber(), borrowRecords.getSize())
        );
    }

    private User getCurrentUser() {
        String email = securityConfig.getSecurityContext();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    private BorrowRequestViewDto mapToViewDto (BorrowRecord record) {
        Book book = bookRepository.findById(record.getBookId()).orElseThrow();
        boolean isIncoming = record.getOwnerId().equals(getCurrentUser().getId());
        User otherUser = userRepository.findById(isIncoming ? record.getBorrowerId() : record.getOwnerId()).orElseThrow();

        return new BorrowRequestViewDto(
                record.getId(),
                book.getId(),
                book.getTitle(),
                book.getImageUrl(),
                otherUser.getId(),
                otherUser.getFirstName() + " " + otherUser.getLastName(),
                otherUser.getAvatarUrl(),
                record.getStatus(),
                record.getRequestedDays(),
                record.getExpiresAt(),
                record.getCreatedAt()
        );
    }
}