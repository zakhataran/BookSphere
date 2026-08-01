CREATE TABLE IF NOT EXISTS book_sphere.borrow_record
(
    id UUID PRIMARY KEY ,
    book_id UUID NOT NULL ,
    borrower_id UUID NOT NULL ,
    owner_id UUID NOT NULL ,
    status VARCHAR(50) NOT NULL ,
    requested_days INT NOT NULL ,
    modified_at TIMESTAMP ,
    expires_at TIMESTAMP ,
    created_at TIMESTAMP DEFAULT NOW()
)