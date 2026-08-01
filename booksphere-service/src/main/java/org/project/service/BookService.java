package org.project.service;

import org.project.dto.filter.BookFilter;
import org.project.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface BookService {

    void uploadBook(BookUploadDto bookUploadDto);

    String extractCoverBase64(MultipartFile file);

    void updateBookProgress(UUID bookId, BookProgressUpdateDto updateDto);

    PageDto<MyLibraryDto> findMyLibrary(int page, int size);

    PageDto<ForeignLibraryDto> findForeignLibrary(UUID userId, int page, int size);

    PageDto<BookSearchDto> searchAndFilterBooks(BookFilter filter, int page, int size);

    PageDto<BookSearchDto> getRecentBook(int page, int size);

    PageDto<MyLibraryDto> getMyReadingList(int page, int size);

    BookDetailsDto getBookDetails(UUID bookId);

    void markAsReading(UUID bookId);

    ReadBookDto readBook(UUID bookId);
}