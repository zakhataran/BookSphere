package org.project.exceptions;

public class MailSendException extends RuntimeException {

    public MailSendException(String message) {
        super(message);
    }
}
