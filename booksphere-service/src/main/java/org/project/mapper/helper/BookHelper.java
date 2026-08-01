package org.project.mapper.helper;

import org.mapstruct.Named;
import org.project.database.entity.Book;
import org.springframework.stereotype.Component;

@Component
public class BookHelper {

    @Named("toFullAuthorName")
    public String fullAuthorName(Book book) {
        return book.getAuthorFirstName() + " " + book.getAuthorSecondName();
    }
}