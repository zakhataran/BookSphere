package org.project.dto;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.multipart.MultipartFile;

public record BookUploadDto(
        @NotBlank
        String title,
        @NotBlank
        String authorFirstName,
        String authorSecondName,
        Long categoryId,
        MultipartFile file
) {}