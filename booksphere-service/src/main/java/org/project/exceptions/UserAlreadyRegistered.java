package org.project.exceptions;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserAlreadyRegistered extends RuntimeException {

    public UserAlreadyRegistered(@Email @NotBlank String s) {}
}
