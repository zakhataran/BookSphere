package org.project.controller;

import lombok.RequiredArgsConstructor;
import org.project.dto.*;
import org.project.service.BorrowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/borrow")
@RequiredArgsConstructor
public class BorrowController {

    private final BorrowService borrowService;

    @PostMapping("/request/{bookId}")
    public ResponseEntity<BorrowRecordDto> requestBook(@PathVariable UUID bookId, @RequestBody BorrowRequestDto requestDto) {
        BorrowRecordDto recordDto = borrowService.requestBook(bookId, requestDto.requestDays());
        return ResponseEntity.ok(recordDto);
    }

    @PostMapping("/approve/{recordId}")
    public ResponseEntity<Void> approveRequest(@PathVariable UUID recordId) {
        borrowService.approveRequest(recordId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject/{recordId}")
    public ResponseEntity<Void> rejectRequest(@PathVariable UUID recordId) {
        borrowService.rejectRequest(recordId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status/{bookId}")
    public ResponseEntity<BorrowRecordDto> getBorrowsStatus(@PathVariable UUID bookId) {
        BorrowRecordDto status = borrowService.getBorrowStatus(bookId);
        return status != null ? ResponseEntity.ok(status) : ResponseEntity.noContent().build();
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<BorrowRequestViewDto>> getIncomingRequests() {
        List<BorrowRequestViewDto> requests = borrowService.getIncomingRequest();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/outgoing")
    public ResponseEntity<List<BorrowRequestViewDto>> getOutgoingRequests() {
        List<BorrowRequestViewDto> requests = borrowService.getOutgoingRequest();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/borrowed-books")
    public ResponseEntity<PageDto<MyLibraryDto>> getBorrowedBooks(@RequestParam(defaultValue = "0") int page,
                                                                  @RequestParam(defaultValue = "10") int size) {
        PageDto<MyLibraryDto> books = borrowService.getBorrowedBooks(page, size);
        return ResponseEntity.ok(books);
    }
}