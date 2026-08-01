package org.project.database.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.project.database.entity.Book;
import org.project.database.entity.Category;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Locale;

public class BookSpecifications {

    public static Specification<Book> titleOrAuthorContains(String query) {
        return (root, query1, criteriaBuilder) -> {
            if (StringUtils.isBlank(query)) {
                return criteriaBuilder.conjunction();
            }

            String likeQuery = "%" + query.toLowerCase() + "%";
            Predicate title = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), likeQuery);
            Predicate authorFirstName = criteriaBuilder.like(criteriaBuilder.lower(root.get("authorFirstName")), likeQuery);
            Predicate authorSecondName = criteriaBuilder.like(criteriaBuilder.lower(root.get("authorSecondName")), likeQuery);
            return criteriaBuilder.or(title, authorFirstName, authorSecondName);
        };
    }

    public static Specification<Book> hasCategoryIn(List<Long> categoryIds) {
        return (root, query, criteriaBuilder) -> {
            if (categoryIds == null || categoryIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            Join<Book, Category> categoryJoin = root.join("category");
            return categoryJoin.get("id").in(categoryIds);
        };
    }
}