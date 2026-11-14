package org.project.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.checkerframework.checker.units.qual.C;
import org.project.config.SecurityConfig;
import org.project.database.entity.*;
import org.project.database.entity.enums.BorrowStatus;
import org.project.database.repository.*;
import org.project.dto.filter.BookFilter;
import org.project.database.entity.enums.ReadingStatus;
import org.project.database.specification.BookSpecifications;
import org.project.dto.*;
import org.project.exceptions.*;
import org.project.mapper.BookMapper;
import org.project.mapper.UserBookStatusMapper;
import org.project.service.AiService;
import org.project.service.BookService;
import org.project.service.MinioService;
import org.project.util.BookValidationUtils;
import org.springframework.cglib.core.Local;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private static final int MAX_RECOMMENDATIONS = 20;

    private final SecurityConfig securityConfig;
    private final UserRepository userRepository;
    private final MinioService minioService;
    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;
    private final UserBookStatusRepository userBookStatusRepository;
    private final BookMapper bookMapper;
    private final UserBookStatusMapper userBookStatusMapper;
    private final BookValidationUtils bookValidationUtils;
    private final BorrowRecordRepository borrowRecordRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void uploadBook(BookUploadDto bookUploadDto) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!user.getIsVerified()) {
            throw new UserIsNotVerifiedException("User email is not verified");
        }

        FileMetadataDto fileMetadata = extractMetadataFromPdf(bookUploadDto.file());
        bookValidationUtils.validateBookData(bookUploadDto, fileMetadata);

        Set<Long> requestedIds = new LinkedHashSet<>(bookUploadDto.categoryIds());
        List<Category> categories = categoryRepository.findAllById(requestedIds);

        if (categories.size() != requestedIds.size()) {
            throw new CategoryNotFoundException("One or more category IDs are invalid");
        }

        Book book = Book.builder()
                .title(bookUploadDto.title())
                .authorFirstName(bookUploadDto.authorFirstName())
                .authorSecondName(bookUploadDto.authorSecondName())
                .description(StringUtils.trimToNull(bookUploadDto.description()))
                .numPages(fileMetadata.numPages())
                .user(user)
                .categories(new LinkedHashSet<>(categories))
                .build();

        bookRepository.save(book);

        String bookKey = book.getId().toString() + ".pdf";
        String bookUrl = minioService.uploadFile(bookUploadDto.file(), bookKey);

        byte[] coverBytes = extractCoverImageFromPdf(bookUploadDto.file());
        String bookCoverKey = book.getId().toString() + ".png";
        String coverImageUrl = minioService.uploadBytes(coverBytes, bookCoverKey, "image/png");

        book.setBookUrl(bookUrl);
        book.setImageUrl(coverImageUrl);
        bookRepository.save(book);

        UserBookStatus status = UserBookStatus.builder()
                .user(user)
                .book(book)
                .readingStatus(ReadingStatus.WANT_TO_READ)
                .bookMarkPage(1)
                .build();

        userBookStatusRepository.save(status);

        eventPublisher.publishEvent(new BookCreatedEvent(book.getId()));
    }

    @Override
    public String extractCoverBase64(MultipartFile file) {
        byte[] coverBytes = extractCoverImageFromPdf(file);
        String base64 = Base64.getEncoder().encodeToString(coverBytes);

        return "data:image/png;base64," + base64;
    }

    @Override
    @Transactional
    public void updateBookProgress(UUID bookId, BookProgressUpdateDto updateDto) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));

        UserBookStatus status = userBookStatusRepository.findUserBookStatusByUserIdAndBookId(user.getId(), bookId)
                .orElseGet(() -> UserBookStatus.builder()
                        .user(user)
                        .book(book)
                        .readingStatus(ReadingStatus.READING)
                        .bookMarkPage(1)
                        .build());

        Integer totalPages = status.getBook().getNumPages();
        Integer currentPage = updateDto.currentPage();

        if (totalPages != null && currentPage > totalPages) {
            currentPage = totalPages;
        }

        status.setBookMarkPage(currentPage);

        if (currentPage.equals(totalPages)) {
            status.setReadingStatus(ReadingStatus.FINISHED);
        } else {
            status.setReadingStatus(ReadingStatus.READING);
        }

        userBookStatusRepository.save(status);
    }

    @Override
    @Transactional
    public void markAsReading(UUID bookId) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));

        UserBookStatus status = userBookStatusRepository.findUserBookStatusByUserIdAndBookId(user.getId(), bookId)
                .orElseGet(() -> UserBookStatus.builder()
                        .user(user)
                        .book(book)
                        .readingStatus(ReadingStatus.READING)
                        .bookMarkPage(1)
                        .build());

        if (status.getReadingStatus() == ReadingStatus.WANT_TO_READ) {
            status.setReadingStatus(ReadingStatus.READING);

            if (status.getBookMarkPage() == null || status.getBookMarkPage() == 0) {
                status.setBookMarkPage(1);
            }
            userBookStatusRepository.save(status);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageDto<MyLibraryDto> findMyLibrary(int page, int size) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Page<UserBookStatus> statuses = userBookStatusRepository.findUserLibraryWithDetails(user.getId(), PageRequest.of(page, size));

        return new PageDto<>(
                userBookStatusMapper.toMyLibraryDto(statuses.getContent()),
                new CustomPage(statuses.getTotalElements(), statuses.getTotalPages(), statuses.getNumber(), statuses.getSize())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageDto<ForeignLibraryDto> findForeignLibrary(UUID userId, int page, int size) {
        Page<UserBookStatus> statuses = userBookStatusRepository.findUserLibraryWithDetails(userId, PageRequest.of(page, size));

        return new PageDto<>(
                userBookStatusMapper.toForeignLibraryDto(statuses.getContent()),
                new CustomPage(statuses.getTotalElements(), statuses.getTotalPages(), statuses.getNumber(), statuses.getSize()));
    }

    @Override
    @Transactional(readOnly = true)
    public PageDto<BookSearchDto> searchAndFilterBooks(BookFilter filter, int page, int size) {
        Specification<Book> specification = Specification.where(
                BookSpecifications.titleOrAuthorContains(filter.query())).and(
                BookSpecifications.hasCategoryIn(filter.categoryIds())
        );

        boolean isAsc = filter.isAscOrder() != null && filter.isAscOrder();
        Sort.Direction direction = isAsc ? Sort.Direction.ASC : Sort.Direction.DESC;

        String sortProperty = (filter.sortBy() != null && filter.sortBy().equals("title")) ? "title" : "createdAt";

        Page<Book> books = bookRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by(direction, sortProperty)));

        return new PageDto<>(
                bookMapper.toBookSearchDto(books.getContent()),
                new CustomPage(books.getTotalElements(), books.getTotalPages(), books.getNumber(), books.getSize())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageDto<BookSearchDto> getRecentBook(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Book> recentBooks = bookRepository.findAll(pageable);

        return new PageDto<>(
                bookMapper.toBookSearchDto(recentBooks.getContent()),
                new CustomPage(recentBooks.getTotalElements(), recentBooks.getTotalPages(), recentBooks.getNumber(), recentBooks.getSize())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageDto<MyLibraryDto> getMyReadingList(int page, int size) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User with email:" + userEmail + " not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));

        Page<UserBookStatus> readingStatues = userBookStatusRepository.findByUserAndReadingStatus(user, ReadingStatus.READING, pageable);

        return new PageDto<>(
                userBookStatusMapper.toMyLibraryDto(readingStatues.getContent()),
                new CustomPage(readingStatues.getTotalElements(), readingStatues.getTotalPages(), readingStatues.getNumber(), readingStatues.getSize())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public BookDetailsDto getBookDetails(UUID bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found with id: " + bookId));

        return bookMapper.toBookDetailsDto(book);
    }

    @Override
    public ReadBookDto readBook(UUID bookId) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!user.getIsVerified()) {
            throw new UserIsNotVerifiedException("User email is not verified");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));

        boolean isOwner = user.getId().equals(book.getUser().getId());

        if (!isOwner) {
            BorrowRecord activeBorrow = borrowRecordRepository.findActiveBorrow(book.getId(), user.getId())
                    .orElseThrow(() -> new UserHasNoPermission("You don't have access to this book."));

            if (activeBorrow.getExpiresAt() != null && activeBorrow.getExpiresAt().isBefore(LocalDateTime.now())) {
                activeBorrow.setStatus(BorrowStatus.EXPIRED);
                borrowRecordRepository.save(activeBorrow);
                throw new IllegalArgumentException("The rental period for this book has expired");
            }
        }

        Integer startPage = 1;
        var statusOpt = userBookStatusRepository.findUserBookStatusByUserIdAndBookId(user.getId(), bookId);

        if (statusOpt.isPresent() && statusOpt.get().getBookMarkPage() != null) {
            startPage = statusOpt.get().getBookMarkPage();
        }

        return new ReadBookDto(book.getBookUrl(), startPage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookSearchDto> getPersonalizedRecommendations(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), MAX_RECOMMENDATIONS);

        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<UserBookStatus> history = userBookStatusRepository
                .findTop5ByUserIdAndReadingStatusInOrderByUpdatedAtDesc(user.getId(), List.of(ReadingStatus.FINISHED, ReadingStatus.READING));

        if (history.isEmpty()) {
            return findRecentBooks(safeLimit);
        }

        float[] profileVector = buildProfileVector(history);

        if (profileVector == null) {
            return findRecentBooks(safeLimit);
        }

        List<UUID> excludeIds = userBookStatusRepository.findBookIdsByUserId(user.getId());

        List<Book> recommended = bookRepository.findRecommendations(
                toVectorLiteral(profileVector), excludeIds, safeLimit
        );

        if (recommended.isEmpty()) {
            return findRecentBooks(safeLimit);
        }

        return bookMapper.toBookSearchDto(recommended);
    }

    private float[] buildProfileVector(List<UserBookStatus> history) {
        float[] sum = new float[Book.EMBEDDING_DIMENSION];
        int count = 0;

        for (UserBookStatus status : history) {
            float[] vector = status.getBook().getEmbedding();
            if (vector != null && vector.length == Book.EMBEDDING_DIMENSION) {
                for (int i = 0; i < Book.EMBEDDING_DIMENSION; i++) {
                    sum[i] += vector[i];
                }
                count++;
            }
        }

        if (count == 0) {
            return null;
        }

        for (int i = 0; i < Book.EMBEDDING_DIMENSION; i++) {
            sum[i] /= count;
        }

        return sum;
    }

    private String toVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 10).append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(vector[i]);
        }

        return sb.append(']').toString();
    }

    private List<BookSearchDto> findRecentBooks(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return bookMapper.toBookSearchDto(bookRepository.findAll(pageable).getContent());
    }

    private FileMetadataDto extractMetadataFromPdf(MultipartFile file) {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDDocumentInformation info = document.getDocumentInformation();

            String title = info.getTitle() != null ? info.getTitle().trim() : "";
            String author = info.getAuthor() != null ? info.getAuthor().trim() : "";
            int numPages = document.getNumberOfPages();

            return new FileMetadataDto(title, author, numPages);
        } catch (IOException e) {
            throw new FileProcessingException("Failed to read PDF metadata");
        }
    }

    private byte[] extractCoverImageFromPdf(MultipartFile file) {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            if (document.getNumberOfPages() == 0) {
                throw new FileProcessingException("PDF has no pages");
            }

            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImageWithDPI(0, 150);

            ImageIO.write(image, "png", baos);
            return baos.toByteArray();

        } catch (IOException e) {
            throw new FileProcessingException("Failed to extract cover image from PDF");
        }
    }
}