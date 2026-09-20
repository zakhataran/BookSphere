import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router';
import { 
  Box, Typography, Avatar, Chip, IconButton, Container, CssBaseline, 
  CircularProgress, Dialog, DialogTitle, DialogContent, TextField, 
  Button, type SvgIconProps
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'; // 🔥 Добавили иконку выхода

import { 
  getPersonalProfile, 
  updateAvatar, 
  changePersonalData, 
  sendVerificationMail,
  handleUserVerification,
  initiatePasswordReset,
  confirmPasswordReset
} from '../../../api/generated/sdk.gen';
import { useRef, useState, useEffect } from 'react';

export const Route = createFileRoute('/home/profile')({
  loader: async () => {
    try {
      const response = await getPersonalProfile();

      if (response.error || !response.data) {
        throw redirect({ to: '/auth/login' });
      }

      return response.data;
    } catch (error) {
      console.error('Backend error:', error);
      throw error;
    }
  },
  component: ProfileLayout,
});

function ProfileLayout() {
  const user = Route.useLoaderData();
  const router = useRouter();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmingPassword, setIsConfirmingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const nameParts = (user.fullName || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      
      // Сброс состояний при переоткрытии окна
      setShowVerificationCode(false);
      setVerificationCode('');
      setShowPasswordChangeForm(false);
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user, isSettingsOpen]);

  const handleAvatarClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await updateAvatar({ body: { avatar: file } });
      router.invalidate();
    } catch (error) {
      console.error('Failed to upload avatar', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const personalResponse = await changePersonalData({ 
        body: { firstName, lastName } 
      });

      if (personalResponse.error) throw new Error('Failed to update personal data');
      
      setIsSettingsOpen(false);
      router.invalidate();
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendConfirmation = async () => {
    try {
      const response = await sendVerificationMail();
      if (response.error) throw new Error('Failed to send email');
      
      setShowVerificationCode(true);
    } catch (error) {
      console.error('Failed to send email', error);
      alert('Failed to send verification email. Please try again later.');
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsVerifying(true);
      const response = await handleUserVerification({
        query: { code: verificationCode } 
      });

      if (response.error) throw new Error('Verification failed');

      alert('Email verified successfully!');
      setShowVerificationCode(false);
      router.invalidate();
    } catch (error) {
      console.error('Verification error', error);
      alert('Invalid code or server error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInitiatePasswordChange = async () => {
    try {
      setIsResettingPassword(true);
      
      const response = await initiatePasswordReset({ query: { email: user.email! } });
      if (response.error) throw new Error('Failed to initiate password reset');

      setShowPasswordChangeForm(true);
    } catch (error) {
      console.error('Initiate password reset error', error);
      alert('Failed to send password reset code. Please try again later.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleConfirmPasswordChange = async () => {
    if (newPassword.length < 6) {
      alert('Password must contain at least 6 characters!');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      setIsConfirmingPassword(true);
      
      const response = await confirmPasswordReset({
        body: { 
          code: resetCode,
          email: user.email!, 
          newPassword: newPassword,
          confirmPassword: confirmPassword 
        }
      });

      if (response.error) throw new Error('Failed to confirm password change');

      alert('Password changed successfully! Please log in again.');
      
      setIsSettingsOpen(false);
      localStorage.removeItem('bookSphere_token');
      localStorage.removeItem('bookSphere_refreshToken');
      router.navigate({ to: '/auth/login' });

    } catch (error) {
      console.error('Confirm password reset error', error);
      alert('Invalid code or error occurred while changing password.');
    } finally {
      setIsConfirmingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bookSphere_token');
    localStorage.removeItem('bookSphere_refreshToken');
    router.navigate({ to: '/auth/login' });
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: '#F6F4F1' }}>
        
        <Box sx={{ position: 'relative', backgroundColor: '#ffffff', width: '100%', pt: 3, pb: 3, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }}>
          
          <Box
            onClick={() => router.navigate({ to: '/home', search: { recentPage: 0, readingPage: 0 } })}
            sx={{
              position: 'absolute',
              left: { xs: 20, md: 40, lg: 60 },
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              backgroundColor: '#D97706',
              borderRadius: 3,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)',
              transition: 'all 0.2s',
              zIndex: 10,
              '&:hover': {
                backgroundColor: '#B45309',
                transform: 'translateY(-50%) scale(1.05)',
                boxShadow: '0 4px 6px rgba(217, 119, 6, 0.3)',
              },
            }}
          >
            <CustomLogoIcon sx={{ fontSize: 32 }} />
          </Box>

          <Container maxWidth="md">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                
                <Box 
                  onClick={handleAvatarClick}
                  sx={{
                    position: 'relative', width: 100, height: 100, borderRadius: '50%',
                    cursor: isUploading ? 'default' : 'pointer', overflow: 'hidden',
                    '&:hover .avatar-overlay': { opacity: isUploading ? 0 : 1 }
                  }}
                >
                  <Avatar src={user.avatarUrl} sx={{ width: '100%', height: '100%', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#9CA3AF' }} />
                  <Box className="avatar-overlay" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                    <PhotoCameraIcon sx={{ color: '#ffffff', fontSize: 28 }} />
                  </Box>
                  {isUploading && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress size={32} color="primary" />
                    </Box>
                  )}
                </Box>

                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                    {user.fullName || 'Unknown User'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#6B7280', mb: 1 }}>
                    {user.username}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6B7280' }}>
                      <MailOutlineIcon sx={{ fontSize: 18 }} />
                      <Typography variant="body2">{user.email}</Typography>
                    </Box>
                    {!user.isVerified && (
                      <Chip label="Unverified" size="small" sx={{ backgroundColor: '#FFFBEB', color: '#D97706', fontWeight: 500, height: 24 }} />
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => setIsSettingsOpen(true)} 
                  title="Account Settings"
                  sx={{ backgroundColor: '#F3F4F6', '&:hover': { backgroundColor: '#E5E7EB' } }}
                >
                  <SettingsOutlinedIcon sx={{ color: '#4B5563' }} />
                </IconButton>
                
                <IconButton 
                  onClick={handleLogout} 
                  title="Logout"
                  sx={{ backgroundColor: '#FEF2F2', '&:hover': { backgroundColor: '#FEE2E2' } }}
                >
                  <LogoutOutlinedIcon sx={{ color: '#DC2626' }} />
                </IconButton>
              </Box>

            </Box>
          </Container>
        </Box>

        <Container maxWidth="md" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>

      <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />

      {/* Модальное окно */}
      <Dialog 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Account settings</Typography>
          <IconButton onClick={() => setIsSettingsOpen(false)} size="small" sx={{ backgroundColor: '#F3F4F6' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
            <Box 
              onClick={handleAvatarClick}
              sx={{ width: 70, height: 70, borderRadius: '50%', mb: 1, cursor: 'pointer', position: 'relative', overflow: 'hidden', '&:hover .overlay': { opacity: 1 } }}
            >
              <Avatar src={user.avatarUrl} sx={{ width: '100%', height: '100%', border: '1px solid #E5E7EB' }} />
              <Box className="overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }}>
                <PhotoCameraIcon sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>Tap to change your avatar</Typography>
          </Box>

          <TextField label="First name" variant="outlined" size="small" fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextField label="Last name" variant="outlined" size="small" fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <TextField label="Email" variant="outlined" size="small" fullWidth disabled value={user.email} />

          {/* Обновленный блок изменения пароля */}
          {!showPasswordChangeForm ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #E5E7EB', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LockOutlinedIcon sx={{ color: '#9CA3AF' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>Password</Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Update your account password</Typography>
                </Box>
              </Box>
              <Button 
                onClick={handleInitiatePasswordChange}
                disabled={isResettingPassword}
                variant="outlined" size="small" 
                sx={{ textTransform: 'none', color: '#374151', borderColor: '#D1D5DB', '&:hover': { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' } }}
              >
                {isResettingPassword ? <CircularProgress size={16} color="inherit" /> : 'Change'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ border: '1px solid #FDE68A', backgroundColor: '#FFFBEB', borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#B45309', fontWeight: 500, textAlign: 'center' }}>
                Enter the verification code sent to your email
              </Typography>
              
              <TextField 
                variant="outlined" size="small" fullWidth 
                value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter 6-digit code"
                sx={{ backgroundColor: '#ffffff', input: { textAlign: 'center', letterSpacing: 2 } }}
              />
              
              <TextField 
                label="New Password" variant="outlined" size="small" fullWidth type="password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                sx={{ backgroundColor: '#ffffff' }}
              />
              
              <TextField 
                label="Confirm New Password" variant="outlined" size="small" fullWidth type="password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ backgroundColor: '#ffffff' }}
              />

              <Button 
                onClick={handleConfirmPasswordChange} 
                disabled={
                  isConfirmingPassword || 
                  resetCode.length < 6 || 
                  newPassword.length < 6 || 
                  newPassword !== confirmPassword
                } 
                fullWidth variant="contained" disableElevation
                sx={{ backgroundColor: '#86EFAC', color: '#166534', '&:hover': { backgroundColor: '#4ADE80' }, textTransform: 'none', fontWeight: 600, mt: 0.5 }}
              >
                {isConfirmingPassword ? 'Verifying...' : 'Confirm Code'}
              </Button>

              <Button 
                onClick={() => {
                  setShowPasswordChangeForm(false);
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }} 
                fullWidth
                sx={{ color: '#D97706', textTransform: 'none', fontWeight: 500 }}
              >
                Cancel
              </Button>
            </Box>
          )}

          {!user.isVerified && !showPasswordChangeForm && (
            <Box sx={{ border: '1px solid #FDE68A', backgroundColor: '#FFFBEB', borderRadius: 2, p: 2, mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#B45309', fontWeight: 500, mb: 1.5 }}>
                Your email is not confirmed
              </Typography>
              
              {!showVerificationCode ? (
                <Button 
                  onClick={handleSendConfirmation} fullWidth variant="contained" disableElevation
                  startIcon={<MailOutlineIcon />}
                  sx={{ backgroundColor: '#F59E0B', color: 'white', '&:hover': { backgroundColor: '#D97706' }, textTransform: 'none', fontWeight: 600 }}
                >
                  Send confirmation code
                </Button>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#B45309' }}>
                    We've sent a 6-digit code to your email.
                  </Typography>
                  <TextField 
                    label="Enter 6-digit code" variant="outlined" size="small" fullWidth 
                    value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                  />
                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={isVerifying || verificationCode.length < 6} 
                    fullWidth variant="contained" disableElevation
                    sx={{ backgroundColor: '#10B981', color: 'white', '&:hover': { backgroundColor: '#059669' }, textTransform: 'none', fontWeight: 600 }}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Email'}
                  </Button>
                </Box>
              )}
            </Box>
          )}

          <Button 
            onClick={handleSaveChanges} disabled={isSaving || showPasswordChangeForm} fullWidth variant="contained" disableElevation
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            sx={{ backgroundColor: '#F59E0B', color: 'white', '&:hover': { backgroundColor: '#D97706' }, textTransform: 'none', fontWeight: 600, mt: 1, py: 1.2 }}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>

        </DialogContent>
      </Dialog>
    </>
  );
}
// 🔥 Компонент вашего собственного логотипа (SVG)
function CustomLogoIcon(_props: SvgIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_13_2)">
        <path
          d="M0.909119 1.81818H6.36366C7.32809 1.81818 8.25301 2.20129 8.93496 2.88324C9.61691 3.56519 10 4.49012 10 5.45454V18.1818C10 17.4585 9.71269 16.7648 9.20123 16.2533C8.94798 16.0001 8.64732 15.7992 8.31644 15.6621C7.98555 15.5251 7.63091 15.4545 7.27275 15.4545H0.909119V1.81818Z"
          stroke="#FFFFFF"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M19.0909 1.81818H13.6364C12.6719 1.81818 11.747 2.20129 11.0651 2.88324C10.3831 3.56519 10 4.49012 10 5.45454V18.1818C10 17.4585 10.2873 16.7648 10.7988 16.2533C11.3103 15.7419 12.004 15.4545 12.7273 15.4545H19.0909V1.81818Z"
          stroke="#FFFFFF"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_13_2">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}