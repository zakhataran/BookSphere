import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import {
  Box,
  Typography,
  Avatar,
  InputAdornment,
  TextField,
  Tooltip,
  Fab,
  Paper,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import { type SvgIconProps } from '@mui/material';
import { useState, useEffect } from 'react';

import { searchUser, getPersonalProfile } from '../../../api/generated/sdk.gen';

type UsersSearch = {
  searchQuery: string;
  page: number;
};

export const Route = createFileRoute('/home/users/')({
  validateSearch: (search: Record<string, unknown>): UsersSearch => ({
    searchQuery: (search.searchQuery as string) || '',
    page: Number(search.page ?? 0) || 0,
  }),

  loaderDeps: ({ search: { searchQuery, page } }) => ({ searchQuery, page }),

  loader: async ({ deps: { searchQuery, page } }) => {
    try {
      const token = localStorage.getItem('bookSphere_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const profileRes = await getPersonalProfile({ headers });
      if (profileRes.error || !profileRes.data) throw redirect({ to: '/auth/login' });

      let usersData = { content: [], customPage: { totalPage: 0, totalElements: 0, page: 0 } };

      if (searchQuery.trim().length > 0) {
        const usersRes = await searchUser({
          headers,
          query: {
            query: searchQuery,
            page: page,
            size: 20,
          },
        });
        if (usersRes.data) usersData = usersRes.data as any;
      }

      return {
        profile: profileRes.data,
        usersData,
      };
    } catch (error) {
      console.error('Failed to load users data:', error);
      throw redirect({ to: '/auth/login' });
    }
  },
  component: UsersPage,
});

function UsersPage() {
  const { profile, usersData } = Route.useLoaderData();
  const { searchQuery, page } = Route.useSearch();
  const navigate = useNavigate();

  const brandOrange = '#D97706';
  const strokeYellow = '#FEF3C7';

  const usersList = usersData.content || [];
  const totalPages = usersData.customPage?.totalPage || 0;

  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== searchQuery) {
        navigate({
          to: '/home/users',
          search: { searchQuery: searchValue, page: 0 },
          replace: true,
        });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchValue, searchQuery, navigate]);

  const handlePageChange = (newPage: number) => {
    navigate({ to: '/home/users', search: { searchQuery, page: newPage } });
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: '#F6F4F1', pb: 10 }}>
      {/* HEADER */}
      <Box
        sx={{
          backgroundColor: '#ffffff',
          width: '100%',
          py: 2,
          px: 4,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              backgroundColor: brandOrange,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CustomLogoIcon sx={{ color: '#ffffff', fontSize: 28 }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Typography
              onClick={() =>
                navigate({
                  to: '/home',
                  search: {
                    recentPage: 0,
                    readingPage: 0,
                    searchQuery: '',
                    categoryId: 'all',
                    sort: 'newest',
                  },
                })
              }
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.2s',
                '&:hover': { color: brandOrange },
              }}
            >
              Home
            </Typography>
            <Typography
              onClick={() => navigate({ to: '/home/users', search: { searchQuery: '', page: 0 } })}
              sx={{ color: brandOrange, fontWeight: 600, cursor: 'pointer' }}
            >
              Users
            </Typography>
          </Box>
        </Box>
        <Box
          onClick={() => navigate({ to: '/home/profile', search: { page: 0 } })}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            '&:hover p': { color: brandOrange },
          }}
        >
          <Avatar
            src={profile.avatarUrl}
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: '#9CA3AF',
            }}
          />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: '#374151', transition: 'color 0.2s' }}
          >
            {profile.fullName || profile.username || 'User'}
          </Typography>
        </Box>
      </Box>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      {/* 🔥 Увеличили maxWidth до 1200, чтобы 5 карточек красиво помещались */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 8, px: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: '#111827', mb: 4, textAlign: 'center' }}
        >
          Find Readers & Friends
        </Typography>

        {/* СТРОКА ПОИСКА */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <TextField
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Type a username or name to search..."
            variant="outlined"
            fullWidth
            sx={{
              maxWidth: 600,
              backgroundColor: 'white',
              borderRadius: 4,
              boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                px: 2,
                py: 0.5,
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: '#E5E7EB' },
                '&.Mui-focused fieldset': { borderColor: brandOrange, borderWidth: 2 },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9CA3AF', fontSize: 28, mr: 1 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* РЕЗУЛЬТАТЫ ПОИСКА */}
        {searchQuery.trim().length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: 10,
              opacity: 0.5,
            }}
          >
            <PersonSearchOutlinedIcon sx={{ fontSize: 100, color: '#9CA3AF', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#6B7280' }}>
              Start typing to discover other users
            </Typography>
          </Box>
        ) : usersList.length > 0 ? (
          <Box>
            <Box
              sx={{
                display: 'grid',
                // 🔥 Теперь у нас адаптивная сетка: до 5 колонок на больших экранах
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(5, 1fr)',
                },
                gap: 3,
              }}
            >
              {usersList.map((user: any) => (
                <Paper
                  key={user.userId}
                  onClick={() =>
                    navigate({
                      to: '/home/users/$userId',
                      params: { userId: user.userId },
                      search: { page: 0 },
                    })
                  }
                  elevation={0}
                  sx={{
                    p: 2, // Слегка уменьшили отступ, чтобы тексту было свободнее
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 4,
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.08)',
                      borderColor: strokeYellow,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Avatar
                    src={user.avatarUrl}
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: '#F3F4F6',
                      color: '#9CA3AF',
                      border: '1px solid #E5E7EB',
                    }}
                  />
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.fullName || user.username}
                    </Typography>
                    <Typography variant="body2" sx={{ color: brandOrange, fontWeight: 500 }}>
                      @{user.username}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* ПАГИНАЦИЯ */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  mt: 6,
                }}
              >
                <Button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  variant="outlined"
                  size="small"
                  startIcon={<ChevronLeftIcon />}
                  sx={{ color: '#6B7280', borderColor: '#E5E7EB', textTransform: 'none' }}
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                  Page {page + 1} of {totalPages}
                </Typography>
                <Button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  variant="outlined"
                  size="small"
                  endIcon={<ChevronRightIcon />}
                  sx={{ color: '#6B7280', borderColor: '#E5E7EB', textTransform: 'none' }}
                >
                  Next
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Typography sx={{ textAlign: 'center', color: '#6B7280', py: 8 }}>
            No users found matching "{searchQuery}"
          </Typography>
        )}
      </Box>

      {/* FAB ЧАТЫ */}
      <Tooltip title="Chats" placement="left" arrow>
        <Fab
          aria-label="chat"
          onClick={() => navigate({ to: '/home/chats' })} // 🔥 Теперь переводит в раздел чатов
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            bgcolor: brandOrange,
            color: 'white',
            '&:hover': { bgcolor: '#B45309', transform: 'scale(1.05)' },
            transition: 'all 0.2s',
          }}
        >
          <ChatBubbleOutlineIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}

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
