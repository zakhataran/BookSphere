package org.project.service;

import org.project.dto.ImageUploadDto;
import org.springframework.web.multipart.MultipartFile;

public interface MinioService {

    void uploadImage(ImageUploadDto imageUploadDto);

    String getUserAvatar(String username);

    String uploadFile(MultipartFile file, String objectKey);

    String uploadBytes(byte[] bytes, String objectKey, String contentType);
}