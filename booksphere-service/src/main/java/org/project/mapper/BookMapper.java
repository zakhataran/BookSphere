package org.project.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.project.database.entity.Book;
import org.project.dto.BookSearchDto;
import org.project.dto.ForeignLibraryDto;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BookMapper {
    @Mapping(source = "id", target = "bookId")
    BookSearchDto toBookSearchDto(Book book);

    List<BookSearchDto> toBookSearchDto(List<Book> book);
}