package org.project.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.project.dto.filter.BookFilter;
import org.project.dto.*;
import org.project.service.BookService;
import org.project.service.CategoryService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/book")
public class BookController {

    private final BookService bookService;
    private final CategoryService categoryService;

    @PostMapping(value = "/upload-book", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public void uploadBook(@ModelAttribute @Valid BookUploadDto bookUploadDto) {
        bookService.uploadBook(bookUploadDto);
    }

    @PostMapping(value = "/preview-cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Map<String, String>> previewCover(@RequestParam("file")MultipartFile file) {
        String base64Cover = bookService.extractCoverBase64(file);
        return ResponseEntity.ok(Map.of("coverUrl", base64Cover));
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
    public ResponseEntity<PageDto<BookSearchDto>> getBooks(@ParameterObject @ModelAttribute BookFilter filter,
                                                           @RequestParam(name = "page", defaultValue = "0") int page,
                                                           @RequestParam(name = "size", defaultValue = "30") int size) {
        PageDto<BookSearchDto> books = bookService.searchAndFilterBooks(filter, page, size);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/book-details/{bookId}")
    public ResponseEntity<BookDetailsDto> getBookDetails(@PathVariable UUID bookId) {
        BookDetailsDto bookDetailsDto = bookService.getBookDetails(bookId);
        return ResponseEntity.ok(bookDetailsDto);
    }

    @GetMapping("/recent")
    public ResponseEntity<PageDto<BookSearchDto>> getRecentBooks(@RequestParam(name = "page", defaultValue = "0") int page,
                                                                 @RequestParam(name = "size", defaultValue = "10") int size) {
        return ResponseEntity.ok(bookService.getRecentBook(page, size));
    }

    @GetMapping("/reading-list")
    public ResponseEntity<PageDto<MyLibraryDto>> getMyReadingList(@RequestParam(name = "page", defaultValue = "0") int page,
                                                                  @RequestParam(name = "size", defaultValue = "2") int size) {
        return ResponseEntity.ok(bookService.getMyReadingList(page, size));
    }

    @GetMapping("/read-book/{bookId}")
    public ResponseEntity<ReadBookDto> readBook(@PathVariable("bookId") String bookId) {
        return ResponseEntity.ok(bookService.readBook(UUID.fromString(bookId)));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryReadDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }
}