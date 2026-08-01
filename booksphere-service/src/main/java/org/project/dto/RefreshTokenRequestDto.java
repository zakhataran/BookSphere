package org.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RefreshTokenRequestDto(
        @JsonProperty("refresh_token")
        String refreshToken
) {}