package org.project.service;

import org.project.dto.BorrowRecordDto;
import org.project.dto.BorrowRequestViewDto;
import org.project.dto.MyLibraryDto;
import org.project.dto.PageDto;

import java.util.List;
import java.util.UUID;

public interface BorrowService {

    BorrowRecordDto requestBook(UUID bookId, Integer requestDays);

    void approveRequest(UUID recordId);

    void rejectRequest(UUID recordId);

    BorrowRecordDto getBorrowStatus(UUID bookId);

    List<BorrowRequestViewDto> getIncomingRequest();

    List<BorrowRequestViewDto> getOutgoingRequest();

    PageDto<MyLibraryDto> getBorrowedBooks(int page, int size);
}