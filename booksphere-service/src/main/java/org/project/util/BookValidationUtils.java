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

        List<String> ignoredTitles = List.of("Title", "Untitled", "Document1", "Placeholder");
        if (!fileMetadata.title().isEmpty()
                && !ignoredTitles.contains(fileMetadata.title())
                && !bookUploadDto.title().equalsIgnoreCase(fileMetadata.title())) {
            throw new IllegalArgumentException("Title entered does not match PDF metadata: " + fileMetadata.title());
        }

        List<String> ignoredAuthors = List.of("Author", "User", "Admin", "Administrator");
        if (!fileMetadata.author().isEmpty() && !ignoredAuthors.contains(fileMetadata.author())) {
            String pdfAuthor = fileMetadata.author().trim();

            String normalOrder = (bookUploadDto.authorFirstName() + " " + bookUploadDto.authorSecondName().trim());
            String reverseOrder = (bookUploadDto.authorSecondName() + " " + bookUploadDto.authorFirstName().trim());

            if (!normalOrder.equalsIgnoreCase(pdfAuthor) && !reverseOrder.equalsIgnoreCase(pdfAuthor)) {
                throw new IllegalArgumentException("Author entered does not match PDF metadata: " + fileMetadata.author());
            }
        }
    }
}