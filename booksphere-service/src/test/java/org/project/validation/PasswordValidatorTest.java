package org.project.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.project.dto.ChangePasswordDto;
import org.project.dto.ResetPasswordDto;
import org.project.dto.UserCreateDto;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordValidatorTest {

    private static Validator validator;
    private final PasswordValidator passwordValidator = new PasswordValidator();

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("PasswordValidator should accept null values (delegating null checks to @NotBlank)")
    void shouldAcceptNullValue() {
        assertTrue(passwordValidator.isValid(null, null));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Password1!",
            "P@ssw0rd",
            "Abcdef1#",
            "Str0ng_P@ssword",
            "Complex123$$$",
            "1aA!5678"
    })
    @DisplayName("PasswordValidator should accept valid passwords meeting all criteria")
    void shouldAcceptValidPasswords(String password) {
        assertTrue(passwordValidator.isValid(password, null));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Pass1!",          // shorter than 8 chars
            "password1!",      // missing uppercase
            "PASSWORD1!",      // missing lowercase
            "Password!!",      // missing digit
            "Password123",     // missing special character
            "",                // empty string
            "        "         // blank string with spaces only
    })
    @DisplayName("PasswordValidator should reject passwords that do not meet all criteria")
    void shouldRejectInvalidPasswords(String password) {
        assertFalse(passwordValidator.isValid(password, null));
    }

    @Test
    @DisplayName("UserCreateDto validation should succeed with valid password")
    void shouldValidateUserCreateDtoWithValidPassword() {
        UserCreateDto dto = new UserCreateDto("johndoe", "john@example.com", "Password1!", "John", "Doe");
        Set<ConstraintViolation<UserCreateDto>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("UserCreateDto validation should fail with invalid password")
    void shouldFailUserCreateDtoWithInvalidPassword() {
        UserCreateDto dto = new UserCreateDto("johndoe", "john@example.com", "weak", "John", "Doe");
        Set<ConstraintViolation<UserCreateDto>> violations = validator.validate(dto);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    @Test
    @DisplayName("ChangePasswordDto validation should validate newPassword but not oldPassword format")
    void shouldValidateChangePasswordDto() {
        // oldPassword can be any non-blank value (existing credential), newPassword must satisfy @ValidPassword
        ChangePasswordDto validDto = new ChangePasswordDto("oldPassNoSpecial1", "NewStrongP@ss1");
        Set<ConstraintViolation<ChangePasswordDto>> violations = validator.validate(validDto);
        assertTrue(violations.isEmpty());

        ChangePasswordDto invalidDto = new ChangePasswordDto("oldPassNoSpecial1", "weak");
        Set<ConstraintViolation<ChangePasswordDto>> invalidViolations = validator.validate(invalidDto);
        assertFalse(invalidViolations.isEmpty());
        assertTrue(invalidViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("newPassword")));
    }

    @Test
    @DisplayName("ResetPasswordDto validation should validate newPassword format")
    void shouldValidateResetPasswordDto() {
        ResetPasswordDto validDto = new ResetPasswordDto("john@example.com", "123456", "NewStrongP@ss1", "NewStrongP@ss1");
        Set<ConstraintViolation<ResetPasswordDto>> violations = validator.validate(validDto);
        assertTrue(violations.isEmpty());

        ResetPasswordDto invalidDto = new ResetPasswordDto("john@example.com", "123456", "weak", "weak");
        Set<ConstraintViolation<ResetPasswordDto>> invalidViolations = validator.validate(invalidDto);
        assertFalse(invalidViolations.isEmpty());
        assertTrue(invalidViolations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("newPassword")));
    }
}
