package org.project.util;

import org.project.dto.BookUploadDto;
import org.project.dto.FileMetadataDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import java.util.List;

@Component
public final class BookValidationUtils {

    @Value("${book.upload.min-size}")
    private DataSize MIN_BOOK_SIZE;

    @Value("${book.upload.max-size}")
    private DataSize MAX_BOOK_SIZE;

    public void validateBookData(BookUploadDto bookUploadDto, FileMetadataDto fileMetadata) {
        long fileSize = bookUploadDto.file().getSize();

        if (fileSize < MIN_BOOK_SIZE.toBytes()) {
            throw new IllegalArgumentException("File size must be at least 1 MB");
        }

        if (fileSize > MAX_BOOK_SIZE.toBytes()) {
            throw new IllegalArgumentException("File size cannot exceed 100 MB");
        }

        if (fileMetadata.numPages() == 0) {
            throw new IllegalArgumentException("PDF must contain at least one page");
        }

        if (bookUploadDto.title().isBlank()) {
            throw new IllegalArgumentException("Book title is required (not found in PDF metadata or user input)");
        }

        if (bookUploadDto.authorFirstName().isBlank()) {
            throw new IllegalArgumentException("Book title is required (not found in PDF metadata or user input)");
        }

        if (bookUploadDto.authorSecondName().isBlank()) {
            throw new IllegalArgumentException("Book title is required (not found in PDF metadata or user input)");
        }
    }
}