import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuthStore } from '../../store/authStore';
import { login as loginApi } from '../../api/generated/sdk.gen';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import * as z from 'zod';
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

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().min(1, 'Enter email').email('Enter valid email address'),
  password: z.string().min(6, 'Password must contain at least 6 characters'),
});

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

type LoginFormInputs = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const authStoreLogin = useAuthStore((state) => state.login);

  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const brandOrange = '#D97706';

  useEffect(() => {
    localStorage.removeItem('bookSphere_token');
    localStorage.removeItem('bookSphere_refreshToken');
  }, []);

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const response = await loginApi({
        body: { email: data.email, password: data.password },
      });

      if (response.error) {
        toast.error('Invalid email or password');
        return;
      }

      if (response.data?.access_token && response.data?.refresh_token) {
        authStoreLogin(response.data.access_token, response.data.refresh_token);
        toast.success('Successful login!');
        navigate({ to: '/home', search: { searchQuery: '', categoryId: 'all', sort: 'newest', recentPage: 0, readingPage: 0 } });
      }
    } catch (e) {
      toast.error('Error occurred while trying to log in');
    }
  };
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F6F4F1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 2,
        margin: 0,
        justifyContent: 'center',
        padding: 2,
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Box
          sx={{
            backgroundColor: brandOrange,
            borderRadius: 3,
            p: 1.5,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CustomLogoIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#000000' }}>
          BookSphere
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5, fontSize: '1rem' }}>
          Upload & manage your books
        </Typography>
      </Box>

      <Card
        component="form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 5,
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#374151' }}>
          Welcome back
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 300, color: '#374151', display: 'block', mb: 0.5 }}
            >
              Email
            </Typography>
            <TextField
              {...form.register('email')}
              placeholder="you@example.com"
              variant="outlined"
              fullWidth
              error={!!form.formState.errors.email}
              helperText={form.formState.errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon sx={{ color: '#adb5bd', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  backgroundColor: '#f8f9fa',
                  '& fieldset': { borderColor: '#e9ecef' },
                  '&:hover fieldset': { borderColor: '#ced4da' },
                  '&.Mui-focused fieldset': { borderColor: brandOrange },
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 300, color: '#374151', display: 'block', mb: 0.5 }}
            >
              Password
            </Typography>
            <TextField
              {...form.register('password')}
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              error={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#adb5bd', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      sx={{ color: '#adb5bd' }}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 20 }} />
                      ) : (
                        <Visibility sx={{ fontSize: 20 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  backgroundColor: '#f8f9fa',
                  '& fieldset': { borderColor: '#e9ecef' },
                  '&:hover fieldset': { borderColor: '#ced4da' },
                  '&.Mui-focused fieldset': { borderColor: brandOrange },
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Typography
              component={Link}
              to="/auth/forgot-password"
              variant="caption"
              sx={{
                color: '#dd7706',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': { color: '#b4532a' },
              }}
            >
              Forgot password
            </Typography>
          </Box>

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            fullWidth
            sx={{
              backgroundColor: brandOrange,
              color: 'white',
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              py: 1.2,
              boxShadow: 'none',
              mt: 1,
              '&:hover': {
                backgroundColor: '#b45309',
                boxShadow: 'none',
              },
            }}
          >
            {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>
      </Card>

      <Typography
        variant="body2"
        sx={{
          mt: 4,
          color: '#615575',
          '& a': {
            color: brandOrange,
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.2s',
          },
          '& a:hover': {
            color: '#b4532a',
          },
        }}
      >
        Don't have an account?
        <Link to="/auth/register"> Sign up free</Link>
      </Typography>
    </Box>
  );
}
