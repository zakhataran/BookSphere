package org.project.dto;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.multipart.MultipartFile;

public record BookUploadDto(
        @NotBlank
        String title,
        @NotBlank
        String author,
        Long categoryId,
        MultipartFile file
) {}