package org.project.database.entity.enums;

import lombok.Getter;

@Getter
public enum BookSortFilter {
    TITLE("title"),
    AUTHOR("author"),
    CREATED_AT("createdAt");

    private final String propertyName;

    BookSortFilter(String propertyName) {
        this.propertyName = propertyName;
    }
}