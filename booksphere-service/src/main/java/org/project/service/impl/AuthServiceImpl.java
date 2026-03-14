package org.project.service.impl;

import jakarta.annotation.PostConstruct;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.project.config.RestTemplateConfig;
import org.project.database.entity.User;
import org.project.database.repository.UserRepository;
import org.project.dto.LoginDto;
import org.project.dto.LoginResponse;
import org.project.dto.UserCreateDto;
import org.project.dto.UserReadDto;
import org.project.exceptions.AuthLoginException;
import org.project.exceptions.KeycloakBadRequestException;
import org.project.exceptions.UserAlreadyRegistered;
import org.project.exceptions.UserNotFoundException;
import org.project.mapper.UserMapper;
import org.project.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${spring.keycloak.rest.realm}")
    private String realm;

    @Value("${spring.keycloak.rest.client-id}")
    private String clientId;

    @Value("${spring.keycloak.rest.client-secret}")
    private String clientSecret;

    @Value("${spring.keycloak.rest.token-uri}")
    private String tokenUri;

    private final UserMapper userMapper;
    private final Keycloak keycloak;
    private final UserRepository userRepository;
    private final RestTemplateConfig restTemplateConfig;
    private String TOKEN_ENDPOINT;

    @PostConstruct
    public void init() {
        this.TOKEN_ENDPOINT = tokenUri + "/realms/" + realm + "/protocol/openid-connect/token";
    }

    @Override
    @Transactional
    public UserReadDto create(UserCreateDto userCreateDto) throws KeycloakBadRequestException {
        log.info("Attempting to create account with email: {}", userCreateDto.email());

        boolean isExists = userRepository.existsByEmail(userCreateDto.email());

        if (isExists) {
            throw new UserAlreadyRegistered("User has already registered with email " + userCreateDto.email());
        }

        String userId = register(userCreateDto);

        if (userId == null) {
            throw new KeycloakBadRequestException("Bad request to Keycloak");
        }

        User newUser = User.builder()
                .id(UUID.fromString(userId))
                .username(userCreateDto.username())
                .email(userCreateDto.email())
                .isVerified(Boolean.FALSE)
                .firstName(userCreateDto.firstName())
                .lastName(userCreateDto.lastName())
                .avatarUrl(null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(newUser);
        return userMapper.toUserReadDto(savedUser);

    }

    @Override
    public LoginResponse login(LoginDto loginDto) {
        log.info("Attempting to login account with email: {}", loginDto.email());

        boolean isExists = userRepository.existsByEmail(loginDto.email());

        if (!isExists) {
            throw new UserNotFoundException("User with email: " + loginDto.email() + "doesn't exist");
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", loginDto.email());
        body.add("password", loginDto.password());

        return executeTokenRequest(body, "Login");
    }

    @Override
    public LoginResponse refresh(String refreshToken) {
        log.info("Refreshing token");

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("refresh_token", refreshToken);

        return executeTokenRequest(body, "Token refresh");
    }

    @Override
    public boolean isPasswordValid(String email, String password) {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", email);
        body.add("password", password);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, httpHeaders);

        try {
            restTemplateConfig.restTemplate().exchange(
                    TOKEN_ENDPOINT,
                    HttpMethod.POST,
                    request,
                    LoginResponse.class
            );
            return false;
        } catch (HttpClientErrorException.Unauthorized e) {
            return true;
        } catch (Exception e) {
            log.error("Error during password validation against Keycloak: {}", e.getMessage());
            throw new KeycloakBadRequestException("Keycloak service error during password validation");
        }
    }

    private LoginResponse executeTokenRequest(MultiValueMap<String, String> body, String operationName) {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, httpHeaders);

        try {
            ResponseEntity<LoginResponse> response = restTemplateConfig.restTemplate().exchange(
                    TOKEN_ENDPOINT,
                    HttpMethod.POST,
                    request,
                    LoginResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("{} success, status: {}", operationName, response.getStatusCode());
                return response.getBody();
            }

            log.error("{}} failed: HTTP {}", operationName, response.getStatusCode());
            throw new AuthLoginException(operationName + " failed");
        } catch (HttpClientErrorException e) {
            log.error("Keycloak rejected the {} request. Status: {}, Body: {}", operationName,e.getStatusCode(), e.getResponseBodyAsString());

            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new KeycloakBadRequestException("Invalid credentials or client");
            }
            throw new KeycloakBadRequestException("Keycloak error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error during Keycloak {} request: {}", operationName, e.getMessage(), e);
            throw new KeycloakBadRequestException("Keycloak service error during " + operationName);
        }
    }

    private String register(UserCreateDto userCreateDto) {
        UserRepresentation userRepresentation = new UserRepresentation();
        userRepresentation.setEnabled(Boolean.TRUE);
        userRepresentation.setUsername(userCreateDto.username());
        userRepresentation.setFirstName(userCreateDto.firstName());
        userRepresentation.setLastName(userCreateDto.lastName());
        userRepresentation.setEmail(userCreateDto.email());
        userRepresentation.setEmailVerified(Boolean.TRUE);

        CredentialRepresentation passwordCredential = new CredentialRepresentation();
        passwordCredential.setTemporary(Boolean.FALSE);
        passwordCredential.setType(CredentialRepresentation.PASSWORD);
        passwordCredential.setValue(userCreateDto.password());

        List<CredentialRepresentation> representationList = new ArrayList<>();
        representationList.add(passwordCredential);
        userRepresentation.setCredentials(representationList);

        RealmResource realmResource = keycloak.realm(realm);
        UsersResource usersResource = realmResource.users();

        try (Response response = usersResource.create(userRepresentation);) {
            if (response.getStatus() == 201) {
                log.info("User {} was added to KeyCloak", userCreateDto.username());

                String location = response.getHeaderString("Location");
                String userId = location.substring(location.lastIndexOf("/") + 1);

                try {
                    RoleRepresentation userRole = realmResource.roles().get("user").toRepresentation();

                    realmResource.users().get(userId)
                            .roles().realmLevel().add(List.of(userRole));

                    log.info("Role 'user' successfully assigned to Keycloak user ID: {}", userId);
                } catch (Exception e) {
                    log.error("Failed to assign 'user' role to Keycloak user ID: {}. Error: {}", userId, e.getMessage());
                }
                return userId;
            } else {
                String errorDetails = response.readEntity(String.class);

                log.error("Keycloak registration failed with status {}, Details: {}", response.getStatus(), errorDetails);

                if (response.getStatus() == 409) {
                    throw new UserAlreadyRegistered("Keycloak: User with provided email/username already exists");
                }
            }
        } catch (ClientErrorException e) {
            String errorDetails = e.getResponse().readEntity(String.class);
            log.error("Keycloak Admin Client error during creation: {}", errorDetails, e);
            throw new KeycloakBadRequestException("Keycloak error: " + errorDetails);
        } catch (Exception e) {
            log.error("Unexpected error during registration: {}", e.getMessage(), e);
            throw new KeycloakBadRequestException("Unexpected error during registration: " + e.getMessage());
        }

        return null;
    }
}