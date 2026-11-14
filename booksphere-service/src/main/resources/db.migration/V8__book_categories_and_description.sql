CREATE TABLE IF NOT EXISTS book_sphere.book_category
(
    book_id UUID NOT NULL REFERENCES book_sphere.book (id) ON DELETE CASCADE ,
    category_id BIGINT NOT NULL REFERENCES book_sphere.category (id) ON DELETE RESTRICT ,
    PRIMARY KEY (book_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_book_category_category_id
    ON book_sphere.book_category (category_id);

INSERT INTO book_sphere.book_category (book_id, category_id)
SELECT id, category_id FROM book_sphere.book
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING ;

ALTER TABLE book_sphere.book DROP COLUMN category_id;
ALTER TABLE book_sphere.book ADD COLUMN description TEXT;