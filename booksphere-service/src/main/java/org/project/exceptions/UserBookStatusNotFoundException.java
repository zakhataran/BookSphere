package org.project.exceptions;

import java.io.IOException;

public class UserBookStatusNotFoundException extends RuntimeException {

    public UserBookStatusNotFoundException(String message) {
        super(message);
    }
}
