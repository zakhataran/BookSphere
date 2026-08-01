package org.project.service.impl;

import io.minio.*;
import io.minio.messages.Item;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.project.config.SecurityConfig;
import org.project.database.entity.User;
import org.project.database.repository.UserRepository;
import org.project.dto.ImageUploadDto;
import org.project.exceptions.UserNotFoundException;
import org.project.service.MinioService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioServiceImpl implements MinioService {

    @Value("${minio.bucket-name}")
    private String bucket;

    @Value("${minio.url}")
    private String minioUrl;

    public static String MINIO_INTERNAL_URL = "minio";
    public static String MINIO_PUBLIC_URL = "localhost";

    private final MinioClient minioClient;
    private final UserRepository userRepository;
    private final SecurityConfig securityConfig;

    @Override
    @SneakyThrows
    @Transactional
    public void uploadImage(ImageUploadDto imageUploadDto) {
        User user = userRepository.findByEmail(securityConfig.getSecurityContext())
                .orElseThrow(() -> new UserNotFoundException("User with email " + securityConfig.getSecurityContext() + " not found"));

        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());

            setBucketPolicy();
        }

        String existing = findExisting(user.getEmail());
        if (existing != null) {
            deleteObject(existing);
        }

        MultipartFile avatar = imageUploadDto.avatar();
        String originalFilename = Objects.requireNonNull(avatar.getOriginalFilename());
        String termination = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
                : "png";

        String objectName = "avatars/" + user.getEmail() + "." + termination;

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(avatar.getInputStream(), avatar.getSize(), -1)
                        .contentType(avatar.getContentType())
                        .build()
        );

        user.setAvatarUrl(minioUrl.contains(MINIO_INTERNAL_URL)
                ? minioUrl.replace(MINIO_INTERNAL_URL, MINIO_PUBLIC_URL) + "/" + bucket + "/" + objectName
                : minioUrl + "/" + bucket + "/" + objectName);

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public String getUserAvatar(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User with username: " + username + " not found"));

        String objectName = "avatars/default-user.png";

        if (user.getAvatarUrl() != null) {
            String existing = findExisting(user.getEmail());
            if (existing != null) {
                return user.getAvatarUrl();
            }
        }

        return minioUrl.replace(MINIO_INTERNAL_URL, MINIO_PUBLIC_URL) + "/" + bucket + "/" + objectName;
    }

    @Override
    @SneakyThrows
    public String uploadFile(MultipartFile file, String objectKey) {
        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            setBucketPolicy();
        }

        String objectName = "books/" + objectKey;
        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );

        log.info("File uploaded to MinIO: {}", objectName);

        if (minioUrl.contains(MINIO_INTERNAL_URL)) {
            return minioUrl.replace(MINIO_INTERNAL_URL, MINIO_PUBLIC_URL) + "/" + bucket + "/" + objectName;
        }

        return minioUrl + "/" + bucket + "/" + objectName;
    }

    @Override
    @SneakyThrows
    public String uploadBytes(byte[] bytes, String objectKey, String contentType) {
        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            setBucketPolicy();
        }

        String objectName = "covers/" + objectKey;

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                        .contentType(contentType)
                        .build()
        );

        log.info("Cover uploaded to MinIO: {}", objectName);

        if (minioUrl.contains(MINIO_INTERNAL_URL)) {
            return minioUrl.replace(MINIO_INTERNAL_URL, MINIO_PUBLIC_URL) + "/" + bucket + "/" + objectName;
        }

        return minioUrl + "/" + bucket + "/" + objectName;
    }


    @SneakyThrows
    private String findExisting(String email) {
        Iterable<Result<Item>> results = minioClient.listObjects(ListObjectsArgs.builder().bucket(bucket).prefix("avatars/").build());

        for (Result<Item> result : results) {
            Item item = result.get();
            if (item.objectName().startsWith("avatars/" + email)) {
                return item.objectName();
            }
        }

        return null;
    }

    @SneakyThrows
    private void deleteObject(String objectName) {
        minioClient.removeObject(
                RemoveObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .build()
        );
        log.info("Delete object: {}", objectName);
    }

    @SneakyThrows
    private void setBucketPolicy() {
        minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder()
                        .bucket(bucket)
                        .config("""
                                {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Effect": "Allow",
                                            "Principal": "*",
                                            "Action": "s3:GetObject",
                                            "Resource": "arn:aws:s3:::%s/*"
                                        }
                                    ]
                                }
                                """.formatted(bucket))
                        .build()
        );
    }
}