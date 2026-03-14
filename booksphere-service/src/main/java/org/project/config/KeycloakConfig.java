package org.project.config;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KeycloakConfig {

    @Value("${spring.keycloak.rest.realm}")
    String realm;

    @Value("${spring.keycloak.rest.client-id}")
    String clientId;

    @Value("${spring.keycloak.rest.client-secret}")
    String clientSecret;

    @Value("${spring.keycloak.rest.token-uri}")
    String tokenUri;

    @Bean
    public Keycloak keycloak() {
            return KeycloakBuilder.builder()
                    .realm(realm)
                    .clientId(clientId)
                    .serverUrl(tokenUri)
                    .clientSecret(clientSecret)
                    .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                    .build();
    }
}