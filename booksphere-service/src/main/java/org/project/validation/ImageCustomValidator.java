package org.project.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.web.multipart.MultipartFile;

public class ImageCustomValidator implements ConstraintValidator<ImageCustom, MultipartFile> {

    private static final long MAX_SIZE = 2 * 1024 * 1024;
    public static final String[] CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"};
    public static final String[] VALID_EXTENSIONS = {".jpeg", ".jpg", ".png"};

    @Override
    public boolean isValid(MultipartFile file, ConstraintValidatorContext constraintValidatorContext) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        boolean isValidContentType = false;
        for (String type : CONTENT_TYPES) {
            if (type.equals(contentType)) {
                isValidContentType = true;
                break;
            }
        }

        if (!isValidContentType) {
            return false;
        }

        if (file.getSize() > MAX_SIZE) {
            return false;
        }

        String filename = file.getOriginalFilename();
        for (String extension : VALID_EXTENSIONS) {
            assert filename != null;
            if (filename.toLowerCase().endsWith(extension)) {
                return true;
            }
        }

        return false;
    }
}
