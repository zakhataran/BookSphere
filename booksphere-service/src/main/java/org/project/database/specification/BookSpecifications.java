package org.project.database.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.project.database.entity.Book;
import org.project.database.entity.Category;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

public class BookSpecifications {

    public static Specification<Book> titleOrAuthorContains(String query) {
        if (query == null || query.isBlank()) {
            return ((root, query1, criteriaBuilder) -> criteriaBuilder.conjunction());
        }

        String likeQuery = query.toLowerCase() + "%";

        return (root, query1, criteriaBuilder) -> {
            Predicate title = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), likeQuery);
            Predicate author = criteriaBuilder.like(criteriaBuilder.lower(root.get("author")), likeQuery);
            return criteriaBuilder.or(title, author);
        };
    }

    public static Specification<Book> hasCategory(Long categoryId) {
        if (categoryId == null) {
            return (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        }

        return (root, query, criteriaBuilder) -> {
            Join<Book, Category> categoryJoin = root.join("category");
            return criteriaBuilder.equal(categoryJoin.get("id"), categoryId);
        };
    }
}