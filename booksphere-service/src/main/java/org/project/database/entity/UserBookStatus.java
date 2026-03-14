package org.project.database.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.project.database.entity.enums.ReadingStatus;
import org.project.database.entity.embedded.UserBookStatusId;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(schema = "book_sphere", name = "user_book_status")
@FieldDefaults(level = AccessLevel.PRIVATE)
@IdClass(UserBookStatusId.class)
public class UserBookStatus {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    Book book;

    @Column(name = "reading_status", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    ReadingStatus readingStatus = ReadingStatus.WANT_TO_READ;

    @Column(name = "book_mark_page")
    Integer bookMarkPage;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    LocalDateTime addedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

//    @Transient
//    public BigDecimal getReadPercentage() {
//        if (bookMarkPage == null || book == null || book.getNumPages() == null || book.getNumPages() == 0) {
//            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
//        }
//
//        BigDecimal percentage = BigDecimal.valueOf(bookMarkPage)
//                .divide(BigDecimal.valueOf(book.getNumPages()), 4, RoundingMode.HALF_UP)
//                .multiply(BigDecimal.valueOf(100));
//
//        return percentage.setScale(2, RoundingMode.HALF_UP);
//    }
}