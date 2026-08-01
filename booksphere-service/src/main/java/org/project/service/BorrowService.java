package org.project.service;

import org.project.dto.BorrowRecordDto;

import java.util.UUID;

public interface BorrowService {

    BorrowRecordDto requestBook(UUID bookId, Integer requestDays);

    void approveRequest(UUID recordId);

    void rejectRequest(UUID recordId);
}