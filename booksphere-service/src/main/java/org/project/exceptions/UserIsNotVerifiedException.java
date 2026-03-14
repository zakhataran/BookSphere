package org.project.exceptions;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserIsNotVerifiedException extends RuntimeException {

    public UserIsNotVerifiedException(@Email @NotBlank String s) {}
}
