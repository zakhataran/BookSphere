ALTER TABLE book_sphere.book
    ADD COLUMN author_first_name VARCHAR(50) NOT NULL,
    ADD COLUMN author_second_name VARCHAR(50) NOT NULL;

ALTER TABLE book_sphere.book
    DROP COLUMN author;