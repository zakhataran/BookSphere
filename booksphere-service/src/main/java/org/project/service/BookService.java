package org.project.service;

import org.project.database.entity.enums.BookSortFilter;
import org.project.dto.*;

import java.util.List;
import java.util.UUID;

public interface BookService {

    void uploadBook(BookUploadDto bookUploadDto);

    void updateBookProgress(UUID bookId, BookProgressUpdateDto updateDto);

    PageDto<MyLibraryDto> findMyLibrary(int page, int size);

    PageDto<ForeignLibraryDto> findForeignLibrary(UUID userId, int page, int size);

    PageDto<BookSearchDto> searchAndFilterBooks(String query, Long categoryId, BookSortFilter sortFilter, int page, int size);

    void markAsReading(UUID bookId);

    String readBook(UUID bookId);
}