package org.project.exceptions;

public class UserHasNoPermission extends RuntimeException {

    public UserHasNoPermission(String message) {
        super(message);
    }
}
