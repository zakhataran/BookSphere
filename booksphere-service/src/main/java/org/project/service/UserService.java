package org.project.service;

import org.project.dto.*;

import java.util.List;
import java.util.UUID;

public interface UserService {

    void changePersonalData(UserEditDto userEditDto);

    void uploadAvatar(ImageUploadDto imageUploadDto);

    void sendVerificationMail(String userEmail);

    void handleUserVerification(String code);

    LoginResponse changePassword(ChangePasswordDto changePasswordDto);

    void initiatePasswordReset(String email);

    void resetPassword(ResetPasswordDto resetPasswordDto);

    void deleteAccount(UserDeleteDto userDeleteDto);

    PrivateProfileDto getPersonalProfile();

    PublicProfileDto getUserProfile(UUID userId);

    PageDto<UserReadDto> searchUser(String username, int page, int size);
}