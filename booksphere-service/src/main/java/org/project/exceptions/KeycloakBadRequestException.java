package org.project.exceptions;

public class KeycloakBadRequestException extends RuntimeException {

    public KeycloakBadRequestException(String message) {
        super(message);
    }
}
