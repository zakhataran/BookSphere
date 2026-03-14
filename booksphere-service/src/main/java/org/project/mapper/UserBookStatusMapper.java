package org.project.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.project.database.entity.Book;
import org.project.database.entity.UserBookStatus;
import org.project.dto.ForeignLibraryDto;
import org.project.dto.MyLibraryDto;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserBookStatusMapper {

    @Mapping(target = "bookId", source = "book.id")
    @Mapping(target = "title", source = "book.title")
    @Mapping(target = "author", source = "book.author")
    @Mapping(target = "imageUrl", source = "book.imageUrl")
    @Mapping(target = "categoryName", source = "book.category.name")
    MyLibraryDto toMyLibraryDto(UserBookStatus status);

    List<MyLibraryDto> toMyLibraryDto(List<UserBookStatus> status);

    @Mapping(target = "bookId", source = "book.id")
    @Mapping(target = "title", source = "book.title")
    @Mapping(target = "author", source = "book.author")
    @Mapping(target = "imageUrl", source = "book.imageUrl")
    @Mapping(target = "categoryName", source = "book.category.name")
    ForeignLibraryDto toForeignLibraryDto(UserBookStatus status);

    List<ForeignLibraryDto> toForeignLibraryDto(List<UserBookStatus> status);
}