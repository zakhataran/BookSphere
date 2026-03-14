package org.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LoginResponse(
        @JsonProperty("access_token")
        String accessToken,

        @JsonProperty("expires_in")
        Long expiresAccessTime,

        @JsonProperty("refresh_token")
        String refreshToken,

        @JsonProperty("refresh_expires_in")
        Long expiresRefreshTime
) {}
