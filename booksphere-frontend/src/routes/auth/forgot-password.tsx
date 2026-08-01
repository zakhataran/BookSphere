import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { initiatePasswordReset, confirmPasswordReset } from '../../api/generated/sdk.gen';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  type SvgIconProps,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

const step1Schema = z.object({
  email: z.string().min(1, 'Enter email').email('Enter a valid email address'),
});
type Step1Form = z.infer<typeof step1Schema>;

const step3Schema = z
  .object({
    code: z.string().min(6, 'Enter the 6-digit code').max(6, 'Code must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type Step3Form = z.infer<typeof step3Schema>;

function CustomLogoIcon(_props: SvgIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_13_2)">
        <path
          d="M0.909119 1.81818H6.36366C7.32809 1.81818 8.25301 2.20129 8.93496 2.88324C9.61691 3.56519 10 4.49012 10 5.45454V18.1818C10 17.4585 9.71269 16.7648 9.20123 16.2533C8.94798 16.0001 8.64732 15.7992 8.31644 15.6621C7.98555 15.5251 7.63091 15.4545 7.27275 15.4545H0.909119V1.81818Z"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M19.0909 1.81818H13.6364C12.6719 1.81818 11.747 2.20129 11.0651 2.88324C10.3831 3.56519 10 4.49012 10 5.45454V18.1818C10 17.4585 10.2873 16.7648 10.7988 16.2533C11.3103 15.7419 12.004 15.4545 12.7273 15.4545H19.0909V1.81818Z"
          stroke="white"
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

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const brandOrange = '#D97706';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [savedEmail, setSavedEmail] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form1Step = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: '' },
  });

  const form3Step = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        setStep(3);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const onEmailSubmit = async (data: Step1Form) => {
    try {
      await initiatePasswordReset({ query: { email: data.email } });
      setSavedEmail(data.email);
      setStep(2);
    } catch (error) {
      toast.error('Failed to send verification code. Please try again.');
    }
  };

  const onResetSubmit = async (data: Step3Form) => {
    try {
      await confirmPasswordReset({
        body: {
          email: savedEmail,
          code: data.code,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
      });
      toast.success('Password reset successful! Please log in with your new password.');
      navigate({ to: '/auth/login' });
    } catch (error) {
      toast.error('Invalid or expired verification code.');
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      backgroundColor: '#f8f9fa',
      '& fieldset': { borderColor: '#e9ecef' },
      '&:hover fieldset': { borderColor: '#ced4da' },
      '&.Mui-focused fieldset': { borderColor: brandOrange },
    },
    '& input::placeholder': {
      fontWeight: 600,
    },
  };

  const labelStyles = { fontWeight: 600, color: '#374151', display: 'block', mb: 0.5 };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F6F4F1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 4,
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      {step !== 2 && (
        <Box sx={{ width: '100%', maxWidth: 400, mb: 4, display: 'flex', justifyContent: 'flex-start', mt: 11 }}>
          <Button
            component={Link}
            to="/auth/login"
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={{ color: '#6b7280', textTransform: 'none', fontWeight: 500, '&:hover': { background: 'transparent', color: '#374151' } }}
          >
            Back to login
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: step === 2 ? 8 : 0 || step === 3 ? 2 : 0 }}>
        <Box
          sx={{
            backgroundColor: brandOrange,
            borderRadius: 3,
            p: 1.5,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <CustomLogoIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#000000' }}>
          BookSphere
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5, fontSize: '1rem' }}>
          Upload & manage your books
        </Typography>
      </Box>

      {step === 1 && (
        <Card
          component="form"
          onSubmit={form1Step.handleSubmit(onEmailSubmit)}
          noValidate
          sx={{ width: '100%', maxWidth: 400, borderRadius: 4, boxShadow: '0px 8px 24px rgba(0,0,0,0.05)', p: { xs: 2, sm: 4 } } }
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
            Forgot password?
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 3, lineHeight: 1.5 }}>
            Enter your email address and we'll send you a code to reset your password.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" sx={labelStyles}>Email</Typography>
              <TextField
                {...form1Step.register('email')}
                placeholder="you@example.com"
                variant="outlined"
                fullWidth
                error={!!form1Step.formState.errors.email}
                helperText={form1Step.formState.errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><MailOutlineIcon sx={{ color: '#adb5bd', fontSize: 20 }} /></InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />
            </Box>

            <Button
              type="submit"
              disabled={form1Step.formState.isSubmitting}
              fullWidth
              sx={{
                backgroundColor: brandOrange, color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '1rem', py: 1.2, mt: 1,
                boxShadow: 'none', '&:hover': { backgroundColor: '#b45309', boxShadow: 'none' },
              }}
            >
              {form1Step.formState.isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </Box>
        </Card>
      )}

      {step === 2 && (
        <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 4, boxShadow: '0px 8px 24px rgba(0,0,0,0.05)', p: { xs: 4, sm: 5 }, textAlign: 'center', mt: 5 }}>
          <Box
            sx={{
              width: 80, height: 80, borderRadius: '50%', backgroundColor: '#dcfce7', color: '#22c55e', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 3
            }}
          >
            <CheckIcon sx={{ fontSize: 40, strokeWidth: 2 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
            Check your email
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
            We've sent you a verification code
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
            {savedEmail}
          </Typography>
        </Card>
      )}

      {step === 3 && (
        <Card
          component="form"
          onSubmit={form3Step.handleSubmit(onResetSubmit)}
          noValidate
          sx={{ width: '100%', maxWidth: 400, borderRadius: 4, boxShadow: '0px 8px 24px rgba(0,0,0,0.05)', p: { xs: 2, sm: 4 } }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
            Reset password
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 3, lineHeight: 1.5 }}>
            Enter the verification code sent to your email and create a new password.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* ВВОД КОДА */}
            <Box>
              <Typography variant="caption" sx={labelStyles}>Verification Code</Typography>
              <TextField
                {...form3Step.register('code')}
                placeholder="Enter 6-digit code"
                variant="outlined"
                fullWidth
                error={!!form3Step.formState.errors.code}
                helperText={form3Step.formState.errors.code?.message}
                sx={{
                  ...textFieldStyles,
                  '& input': { fontFamily: 'monospace', letterSpacing: 2 },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={labelStyles}>New Password</Typography>
              <TextField
                {...form3Step.register('newPassword')}
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                error={!!form3Step.formState.errors.newPassword}
                helperText={form3Step.formState.errors.newPassword?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: '#adb5bd', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#adb5bd' }}>
                        {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={labelStyles}>Confirm New Password</Typography>
              <TextField
                {...form3Step.register('confirmPassword')}
                placeholder="••••••••"
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                onPaste={(e) => e.preventDefault()}
                error={!!form3Step.formState.errors.confirmPassword}
                helperText={form3Step.formState.errors.confirmPassword?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: '#adb5bd', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" sx={{ color: '#adb5bd' }}>
                        {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />
            </Box>

            <Button
              type="submit"
              disabled={form3Step.formState.isSubmitting}
              fullWidth
              sx={{
                backgroundColor: brandOrange, color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '1rem', py: 1.2, mt: 1,
                boxShadow: 'none', '&:hover': { backgroundColor: '#b45309', boxShadow: 'none' },
              }}
            >
              {form3Step.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>
        </Card>
      )}

    </Box>
  );
}