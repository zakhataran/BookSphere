CREATE TABLE IF NOT EXISTS book_sphere.category
(
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO book_sphere.category (name)
VALUES ('Fantasy'),
       ('Science Fiction'),
       ('Romance'),
       ('Mystery'),
       ('Thriller & Suspense'),
       ('Horror'),
       ('Historical Fiction'),
       ('Contemporary Fiction'),
       ('Literary Fiction'),
       ('Dystopian'),
       ('Urban Fantasy'),
       ('Paranormal Romance'),
       ('Crime/Detective'),
       ('Cozy Mystery'),
       ('Legal Thriller'),
       ('Police Procedural'),
       ('Psychological Thriller'),
       ('Adventure'),
       ('Western'),
       ('Young Adult (YA)'),
       ('New Adult'),
       ('Children''s (Middle Grade)'),
       ('Picture Books'),
       ('Classics'),
       ('Graphic Novels & Comics'),
       ('Manga'),
       ('Short Stories & Anthologies'),
       ('Poetry'),
       ('Memoir'),
       ('Biography'),
       ('Self-Help & Personal Development'),
       ('Personal Finance & Investing'),
       ('Business & Management'),
       ('Entrepreneurship & Startups'),
       ('Productivity & Time Management'),
       ('Leadership'),
       ('History'),
       ('Politics & Current Affairs'),
       ('Philosophy'),
       ('Religion & Spirituality'),
       ('Science (General)'),
       ('Popular Science'),
       ('Technology'),
       ('Programming & Software'),
       ('Health & Fitness'),
       ('Nutrition & Diet'),
       ('Psychology'),
       ('Education & Teaching'),
       ('Travel'),
       ('Cooking & Food');

CREATE TABLE IF NOT EXISTS book_sphere.book
(
    id          UUID PRIMARY KEY,
    title       VARCHAR(100) NOT NULL,
    author      VARCHAR(50)  NOT NULL,
    num_pages   INTEGER      NOT NULL,
    user_id     UUID         REFERENCES book_sphere.user (id) ON DELETE SET NULL,
    category_id BIGSERIAL REFERENCES book_sphere.category (id) ON DELETE RESTRICT,
    image_url   VARCHAR(255),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_sphere.user_book_status
(
    user_id        UUID        NOT NULL REFERENCES book_sphere.user (id) ON DELETE CASCADE,
    book_id        UUID   NOT NULL REFERENCES book_sphere.book (id) ON DELETE CASCADE,
    reading_status VARCHAR(50) NOT NULL DEFAULT 'WANT_TO_READ',
    book_mark_page INTEGER     NULL,
    added_at       TIMESTAMP            DEFAULT NOW(),
    updated_at     TIMESTAMP            DEFAULT NOW(),

    PRIMARY KEY (user_id, book_id)
);


