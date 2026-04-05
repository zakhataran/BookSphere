package org.project.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.project.database.entity.enums.BookSortFilter;
import org.project.dto.*;
import org.project.service.BookService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/book")
public class BookController {

    private final BookService bookService;

    @PostMapping(value = "/upload-book", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public void uploadBook(@ModelAttribute @Valid BookUploadDto bookUploadDto) {
        bookService.uploadBook(bookUploadDto);
    }

    @PatchMapping("/update-book-status/{bookId}")
    @ResponseStatus(HttpStatus.OK)
    public void updateBookStatus(@PathVariable("bookId") String bookId, @RequestBody @Valid BookProgressUpdateDto bookProgressUpdateDto) {
        bookService.updateBookProgress(UUID.fromString(bookId), bookProgressUpdateDto);
    }

    @PatchMapping("/mark-as-reading/{bookId}")
    @ResponseStatus(HttpStatus.OK)
    public void markAsReading(@PathVariable("bookId") String bookId) {
        bookService.markAsReading(UUID.fromString(bookId));
    }

    @GetMapping("/my-library")
    public ResponseEntity<PageDto<MyLibraryDto>> getMyLibrary(@RequestParam(name = "page", defaultValue = "0") int page,
                                                              @RequestParam(name = "size", defaultValue = "10") int size) {
        PageDto<MyLibraryDto> library = bookService.findMyLibrary(page, size);
        return ResponseEntity.ok(library);
    }

    @GetMapping("/user-library/{userId}")
    public ResponseEntity<PageDto<ForeignLibraryDto>> getUserLibrary(@PathVariable("userId") String userId,
                                                                   @RequestParam(name = "page", defaultValue = "0") int page,
                                                                   @RequestParam(name = "size", defaultValue = "10") int size) {
        PageDto<ForeignLibraryDto> userLibrary = bookService.findForeignLibrary(UUID.fromString(userId), page, size);
        return ResponseEntity.ok(userLibrary);
    }

    @GetMapping("/search-books")
    public ResponseEntity<PageDto<BookSearchDto>> getBooks(@RequestParam("query") String query,
                                                           @RequestParam("categoryId") Long categoryId,
                                                           @RequestParam("sortFilter") String sortFilter,
                                                           @RequestParam(name = "page", defaultValue = "0") int page,
                                                           @RequestParam(name = "size", defaultValue = "10") int size) {
        PageDto<BookSearchDto> books = bookService.searchAndFilterBooks(query, categoryId, BookSortFilter.valueOf(sortFilter), page, size);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/read-book/{bookId}")
    public ResponseEntity<String> readBook(@PathVariable("bookId") String bookId) {
        String book = bookService.readBook(UUID.fromString(bookId));
        return ResponseEntity.ok(book);
    }
}