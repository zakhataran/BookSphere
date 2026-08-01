package org.project.controller;

import lombok.RequiredArgsConstructor;
import org.project.dto.BorrowRecordDto;
import org.project.service.BorrowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/borrow")
@RequiredArgsConstructor
public class BorrowController {

    private final BorrowService borrowService;

    @PostMapping("/request/{bookId}")
    public ResponseEntity<BorrowRecordDto> requestBook(@PathVariable UUID bookId, @RequestBody BorrowRecordDto requestDto) {
        BorrowRecordDto recordDto = borrowService.requestBook(bookId, requestDto.requestDays());
        return ResponseEntity.ok(recordDto);
    }

    @PatchMapping("/approve/{recordId}")
    public ResponseEntity<Void> approvedRequest(@PathVariable UUID recordId) {
        borrowService.approveRequest(recordId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/reject/{recordId}")
    public ResponseEntity<Void> rejectRequest(@PathVariable UUID recordId) {
        borrowService.rejectRequest(recordId);
        return ResponseEntity.ok().build();
    }
}