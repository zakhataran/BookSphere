package org.project.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.project.database.entity.User;
import org.project.dto.PrivateProfileDto;
import org.project.dto.PublicProfileDto;
import org.project.dto.UserReadDto;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapperHelper.class})
public interface UserMapper {

    @Mapping(target = "userId", source = "id")
    @Mapping(target = "fullName", source = "user", qualifiedByName = "toFullName")
    UserReadDto toUserReadDto(User user);

    List<UserReadDto> toUserReadDto(List<User> user);

    PublicProfileDto toPublicProfileDto(User user);

    PrivateProfileDto toPrivateProfileDto(User user);
}