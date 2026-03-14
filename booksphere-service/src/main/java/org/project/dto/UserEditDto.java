package org.project.dto;

//add annotations here
public record UserEditDto(
        String email,
        String firstName,
        String lastName
) {}