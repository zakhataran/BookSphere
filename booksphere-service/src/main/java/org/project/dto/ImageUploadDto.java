package org.project.dto;

import org.project.validation.ImageCustom;
import org.springframework.web.multipart.MultipartFile;

public record ImageUploadDto (
       @ImageCustom MultipartFile avatar
){}
