CREATE TABLE IF NOT EXISTS book_sphere.user
(
    id                    UUID PRIMARY KEY,
    username              VARCHAR(50)  NOT NULL UNIQUE,
    email                 VARCHAR(100) NOT NULL UNIQUE,
    is_verified           BOOLEAN   DEFAULT FALSE,
    first_name            VARCHAR(50)  NOT NULL,
    last_name             VARCHAR(50)  NOT NULL,
    avatar_url            VARCHAR(255) DEFAULT 'default photo',
    unverified_avatar_url VARCHAR(255) DEFAULT NULL,
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);