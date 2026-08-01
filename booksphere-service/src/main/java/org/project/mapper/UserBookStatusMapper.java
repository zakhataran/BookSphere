package org.project.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.project.database.entity.UserBookStatus;
import org.project.dto.ForeignLibraryDto;
import org.project.dto.MyLibraryDto;
import org.project.mapper.helper.BookHelper;

import java.util.List;

@Mapper(componentModel = "spring", uses = {BookHelper.class})
public interface UserBookStatusMapper {

    @Mapping(target = "bookId", source = "book.id")
    @Mapping(target = "title", source = "book.title")
    @Mapping(target = "authorFullName", source = "book", qualifiedByName = "toFullAuthorName")
    @Mapping(target = "imageUrl", source = "book.imageUrl")
    @Mapping(target = "categoryName", source = "book.category.name")
    @Mapping(target = "bookMarkPage", source = "bookMarkPage")
    @Mapping(target = "readPercentage", source = "status", qualifiedByName = "calculatePercentage")
    MyLibraryDto toMyLibraryDto(UserBookStatus status);

    List<MyLibraryDto> toMyLibraryDto(List<UserBookStatus> status);

    @Mapping(target = "bookId", source = "book.id")
    @Mapping(target = "title", source = "book.title")
    @Mapping(target = "authorFullName", source = "book", qualifiedByName = "toFullAuthorName")
    @Mapping(target = "imageUrl", source = "book.imageUrl")
    @Mapping(target = "categoryName", source = "book.category.name")
    @Mapping(target = "readPercentage", source = "status", qualifiedByName = "calculatePercentage")
    ForeignLibraryDto toForeignLibraryDto(UserBookStatus status);

    List<ForeignLibraryDto> toForeignLibraryDto(List<UserBookStatus> status);

    @Named("calculatePercentage")
    default Integer calculatePercentage(UserBookStatus status) {
        if (status.getBookMarkPage() == null || status.getBook() == null ||
        status.getBook().getNumPages() == null || status.getBook().getNumPages() == 0) {
            return 0;
        }

        return (int) Math.round((double) status.getBookMarkPage() / status.getBook().getNumPages() * 100);
    }
}