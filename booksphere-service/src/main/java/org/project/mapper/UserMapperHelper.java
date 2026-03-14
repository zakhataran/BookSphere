package org.project.mapper;

import org.mapstruct.Named;
import org.project.database.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapperHelper {

    @Named("toFullName")
    public String fullName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }
}
