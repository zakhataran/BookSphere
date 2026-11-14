package org.project.database.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(schema = "book_sphere", name = "book")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Book {

    public static final int EMBEDDING_DIMENSION = 768;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "title", length = 100, nullable = false)
    String title;

    @Column(name = "author_first_name", length = 50, nullable = false)
    String authorFirstName;

    @Column(name = "author_second_name", length = 50, nullable = false)
    String authorSecondName;

    @Column(name = "num_pages", nullable = false)
    Integer numPages;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(ConstraintMode.CONSTRAINT))
    User user;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(schema = "book_sphere", name = "book_category", joinColumns = @JoinColumn(name = "book_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    @OrderBy("name ASC")
    @BatchSize(size = 50)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    Set<Category> categories = new LinkedHashSet<>();

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "image_url")
    String imageUrl;

    @Column(name = "book_url")
    String bookUrl;

    @JdbcTypeCode(SqlTypes.VECTOR)
    @Column(name = "embedding", columnDefinition = "vector(768)")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    float[] embedding;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}