package org.project.database.entity.embedded;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserBookStatusId implements Serializable {

    private UUID user;
    private UUID book;
}