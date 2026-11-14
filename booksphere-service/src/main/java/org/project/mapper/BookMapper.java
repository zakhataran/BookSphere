package org.project.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.project.database.entity.Book;
import org.project.dto.BookDetailsDto;
import org.project.dto.BookSearchDto;
import org.project.mapper.helper.BookHelper;

import java.util.List;

@Mapper(componentModel = "spring", uses = {BookHelper.class, CategoryMapper.class})
public interface BookMapper {

    @Mapping(source = "id", target = "bookId")
    @Mapping(source = "user.username", target = "uploaderUsername")
    @Mapping(source = "categories", target = "categories")
    BookSearchDto toBookSearchDto(Book book);

    List<BookSearchDto> toBookSearchDto(List<Book> book);

    @Mapping(target = "bookId", source = "id")
    @Mapping(target = "title", source = "title")
    @Mapping(target = "authorFullName", source = "book", qualifiedByName = "toFullAuthorName")
    @Mapping(target = "categories", source = "categories")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "imageUrl", source = "imageUrl")
    @Mapping(target = "uploaderId", source = "user.id")
    @Mapping(target = "uploaderUsername", source = "user.username")
    @Mapping(target = "uploaderAvatarUrl", source = "user.avatarUrl")
    BookDetailsDto toBookDetailsDto(Book book);
}