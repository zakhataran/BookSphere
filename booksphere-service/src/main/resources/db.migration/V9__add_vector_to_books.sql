CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE book_sphere.book ADD COLUMN embedding vector(768);