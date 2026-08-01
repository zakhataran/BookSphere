package org.project.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.project.database.entity.User;
import org.project.dto.PrivateProfileDto;
import org.project.dto.PublicProfileDto;
import org.project.dto.UserReadDto;
import org.project.mapper.helper.BookHelper;
import org.project.mapper.helper.UserMapperHelper;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapperHelper.class, BookHelper.class})
public interface UserMapper {

    @Mapping(target = "userId", source = "id")
    @Mapping(target = "fullName", source = "user", qualifiedByName = "toFullName")
    UserReadDto toUserReadDto(User user);

    List<UserReadDto> toUserReadDto(List<User> user);

    @Mapping(target = "fullName", source = "user", qualifiedByName = "toFullName")
    PublicProfileDto toPublicProfileDto(User user);

    @Mapping(target = "fullName", source = "user", qualifiedByName = "toFullName")
    PrivateProfileDto toPrivateProfileDto(User user);
}