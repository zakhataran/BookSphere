package org.project.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.project.config.SecurityConfig;
import org.project.database.entity.Book;
import org.project.database.entity.Category;
import org.project.database.entity.User;
import org.project.database.entity.UserBookStatus;
import org.project.database.entity.enums.BookSortFilter;
import org.project.database.entity.enums.ReadingStatus;
import org.project.database.repository.BookRepository;
import org.project.database.repository.CategoryRepository;
import org.project.database.repository.UserBookStatusRepository;
import org.project.database.repository.UserRepository;
import org.project.database.specification.BookSpecifications;
import org.project.dto.*;
import org.project.exceptions.*;
import org.project.mapper.BookMapper;
import org.project.mapper.UserBookStatusMapper;
import org.project.service.BookService;
import org.project.service.MinioService;
import org.project.util.BookValidationUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final SecurityConfig securityConfig;
    private final UserRepository userRepository;
    private final MinioService minioService;
    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;
    private final UserBookStatusRepository userBookStatusRepository;
    private final BookMapper bookMapper;
    private final UserBookStatusMapper userBookStatusMapper;

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
        BookValidationUtils.validateBookData(bookUploadDto, fileMetadata);

        Category category = categoryRepository.findById(bookUploadDto.categoryId())
                .orElseThrow(() -> new CategoryNotFoundException("Invalid category ID"));

        Book book = Book.builder()
                .title(bookUploadDto.title())
                .author(bookUploadDto.author())
                .numPages(fileMetadata.numPages())
                .user(user)
                .category(category)
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
    }

    @Override
    @Transactional
    public void updateBookProgress(UUID bookId, BookProgressUpdateDto updateDto) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        UserBookStatus status = userBookStatusRepository.findUserBookStatusByUserIdAndBookId(user.getId(), bookId)
                .orElseThrow(() -> new UserBookStatusNotFoundException("Book not found in user's library"));

        Integer totalPages = status.getBook().getNumPages();
        Integer currentPage = updateDto.currentPage();

        if (currentPage > totalPages) {
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

        UserBookStatus status = userBookStatusRepository.findUserBookStatusByUserIdAndBookId(user.getId(), bookId)
                .orElseThrow(() -> new UserBookStatusNotFoundException("Book not found in user's library"));

        if (status.getReadingStatus() == ReadingStatus.WANT_TO_READ) {
            status.setReadingStatus(ReadingStatus.READING);

            if (status.getBookMarkPage() == null || status.getBookMarkPage() == 0) {
                status.setBookMarkPage(1);
            }
            userBookStatusRepository.save(status);
        }
    }

    @Override
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
    public PageDto<ForeignLibraryDto> findForeignLibrary(UUID userId, int page, int size) {
        Page<UserBookStatus> statuses = userBookStatusRepository.findUserLibraryWithDetails(userId, PageRequest.of(page, size));

        return new PageDto<>(
                userBookStatusMapper.toForeignLibraryDto(statuses.getContent()),
                new CustomPage(statuses.getTotalElements(), statuses.getTotalPages(), statuses.getNumber(), statuses.getSize()));
    }

    @Override
    public PageDto<BookSearchDto> searchAndFilterBooks(String query, Long categoryId, BookSortFilter sortFilter, int page, int size) {
        Specification<Book> specification = Specification.where(
                BookSpecifications.titleOrAuthorContains(query)).and(
                BookSpecifications.hasCategory(categoryId)
        );

        Sort sort = Sort.unsorted();
        if (sortFilter != null) {
            Sort.Direction direction = (sortFilter == BookSortFilter.CREATED_AT)
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;

            sort = Sort.by(direction, sortFilter.getPropertyName());
        }

        Page<Book> books = bookRepository.findAll(specification, PageRequest.of(page, size, sort));

        return new PageDto<>(
                bookMapper.toBookSearchDto(books.getContent()),
                new CustomPage(books.getTotalElements(), books.getTotalPages(), books.getNumber(), books.getSize())
        );
    }

    @Override
    public String readBook(UUID bookId) {
        String userEmail = securityConfig.getSecurityContext();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!user.getIsVerified()) {
            throw new UserIsNotVerifiedException("User email is not verified");
        }

        Book book = bookRepository.findBookById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));

        if (!user.getId().equals(book.getUser().getId())) {
            throw new UserHasNoPermission("Book: " + book.getTitle() + " is not in " + user.getUsername() + "'s library");
        }

        return book.getBookUrl();
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

            PDPage firstPage = document.getPage(0);

            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImageWithDPI(0, 150);

            ImageIO.write(image, "png", baos);
            return baos.toByteArray();

        } catch (IOException e) {
            throw new FileProcessingException("Failed to extract cover image from PDF");
        }
    }
}