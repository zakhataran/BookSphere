package org.project.exceptions;

import java.io.IOException;

public class FileProcessingException extends RuntimeException {

    public FileProcessingException(String message) {
        super(message);
    }
}
