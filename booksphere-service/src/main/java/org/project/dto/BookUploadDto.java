package org.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record BookUploadDto(
        @NotBlank
        String title,
        @NotBlank
        String authorFirstName,
        String authorSecondName,
        String description,
        @NotEmpty
        List<Long> categoryIds,
        MultipartFile file
) {}