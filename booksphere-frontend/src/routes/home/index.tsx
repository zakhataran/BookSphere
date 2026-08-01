import { createFileRoute, Link, useNavigate, redirect } from '@tanstack/react-router';
import {
  Box,
  Typography,
  Avatar,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Fab,
  LinearProgress,
  Chip,
  Button, // 🔥 Добавлен импорт Button для новой пагинации
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import SortIcon from '@mui/icons-material/Sort';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { type SvgIconProps } from '@mui/material';
import { useState, useEffect } from 'react';

// 🔥 Добавили getRecentBooks для дефолтного состояния
import {
  getBooks,
  getRecentBooks,
  getMyReadingList,
  getPersonalProfile,
  getAllCategories,
} from '../../api/generated/sdk.gen';

type HomeSearch = {
  recentPage: number;
  readingPage: number;
  searchQuery: string;
  categoryId: string;
  sort: string;
};

export const Route = createFileRoute('/home/')({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    recentPage: Number(search.recentPage ?? 0) || 0,
    readingPage: Number(search.readingPage ?? 0) || 0,
    searchQuery: (search.searchQuery as string) || '',
    categoryId: (search.categoryId as string) || 'all',
    sort: (search.sort as string) || 'newest',
  }),

  loaderDeps: ({ search: { recentPage, readingPage, searchQuery, categoryId, sort } }) => ({
    recentPage,
    readingPage,
    searchQuery,
    categoryId,
    sort,
  }),

  loader: async ({ deps: { recentPage, readingPage, searchQuery, categoryId, sort } }) => {
    try {
      // 🔥 Проверяем, ищет ли пользователь что-то
      const isSearching = searchQuery !== '' || categoryId !== 'all' || sort !== 'newest';

      // Умная загрузка: 30 книг при поиске, 5 книг при простом просмотре
      const booksPromise = isSearching
        ? getBooks({
            query: {
              page: recentPage,
              size: 30, // Выдаем 30 книг на страницу при поиске
              query: searchQuery || undefined,
              categoryIds: categoryId !== 'all' ? [Number(categoryId)] : undefined,
              isAscOrder: sort === 'oldest' || sort === 'az',
              // sortBy: (sort === 'az' || sort === 'za') ? 'title' : 'createdAt'
            },
          })
        : getRecentBooks({ query: { page: recentPage, size: 5 } }); // 5 книг для слайдера

      const [profileRes, booksRes, readingRes, categoriesRes] = await Promise.all([
        getPersonalProfile(),
        booksPromise,
        getMyReadingList({ query: { page: readingPage, size: 2 } }),
        getAllCategories(),
      ]);

      if (profileRes.error || !profileRes.data) throw redirect({ to: '/auth/login' });

      return {
        profile: profileRes.data,
        booksData: booksRes.data || { content: [], customPage: { totalPage: 0, totalElements: 0 } },
        reading: readingRes.data || { content: [], customPage: { totalPage: 0, totalElements: 0 } },
        categories: categoriesRes.data || [],
      };
    } catch (error) {
      if (error instanceof Error === false) throw error;
      console.error('Failed to load home data:', error);
      throw redirect({ to: '/auth/login' });
    }
  },
  component: HomePage,
});

function HomePage() {
  const { profile, booksData, reading, categories } = Route.useLoaderData();
  const { recentPage, readingPage, searchQuery, categoryId, sort } = Route.useSearch();
  const navigate = useNavigate();

  const brandOrange = '#D97706';
  const strokeYellow = '#FEF3C7';

  const displayBooks = booksData.content || [];
  const maxRecentPages = booksData.customPage?.totalPage || 0;

  const readingBooks = reading.content || [];
  const maxReadingPages = reading.customPage?.totalPage || 0;

  const [searchValue, setSearchValue] = useState(searchQuery);

  // Вычисляем, находимся ли мы в режиме поиска
  const isSearching = searchQuery !== '' || categoryId !== 'all' || sort !== 'newest';

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== searchQuery) {
        navigate({
          to: '/home',
          search: { searchQuery: searchValue, categoryId, sort, readingPage, recentPage: 0 },
          replace: true,
        });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchValue, searchQuery, categoryId, sort, readingPage, navigate]);

  const handleRecentPrev = () =>
    navigate({
      to: '/home',
      search: {
        searchQuery,
        categoryId,
        sort,
        readingPage,
        recentPage: Math.max(0, recentPage - 1),
      },
    });
  const handleRecentNext = () =>
    navigate({
      to: '/home',
      search: {
        searchQuery,
        categoryId,
        sort,
        readingPage,
        recentPage: Math.min(maxRecentPages - 1, recentPage + 1),
      },
    });
  const handleReadingPrev = () =>
    navigate({
      to: '/home',
      search: {
        searchQuery,
        categoryId,
        sort,
        recentPage,
        readingPage: Math.max(0, readingPage - 1),
      },
    });
  const handleReadingNext = () =>
    navigate({
      to: '/home',
      search: {
        searchQuery,
        categoryId,
        sort,
        recentPage,
        readingPage: Math.min(maxReadingPages - 1, readingPage + 1),
      },
    });

  const cardHoverStyle = {
    border: '2px solid transparent',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    '&:hover': {
      borderColor: strokeYellow,
      boxShadow: '0px 10px 25px rgba(0,0,0,0.08)',
      transform: 'translateY(-4px)',
    },
  };

  // 🔥 Компонент отрисовки сетки книг (5 колонок, автоматически переносит на новые строки)
  const renderBookCards = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
      {displayBooks.map((book) => (
        <Box
          key={book.bookId}
          onClick={() => {
            const uploaderUsername = (book as any).uploaderUsername;
            const isMyBook = uploaderUsername && uploaderUsername === profile.username;
            if (isMyBook)
              navigate({ to: '/home/profile/read/$bookId', params: { bookId: book.bookId! } });
            else navigate({ to: '/home/book/$bookId', params: { bookId: book.bookId! } });
          }}
          sx={{
            bgcolor: 'white',
            borderRadius: 4,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            ...cardHoverStyle,
          }}
        >
          {book.imageUrl ? (
            <Box
              component="img"
              src={book.imageUrl}
              alt={book.title}
              sx={{
                width: '100%',
                aspectRatio: '2/3',
                borderRadius: 2,
                mb: 2,
                objectFit: 'cover',
                border: '1px solid #E5E7EB',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                aspectRatio: '2/3',
                bgcolor: '#FEF3C7',
                borderRadius: 2,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: brandOrange,
              }}
            >
              <CustomLogoIcon sx={{ fontSize: 40 }} />
            </Box>
          )}
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.2 }}
          >
            {book.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#6B7280', display: 'block', mb: 'auto', mt: 0.5 }}
          >
            {book.author}
          </Typography>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}
          >
            {book.categoryId ? (
              <Chip
                label={categories.find((c) => c.categoryId === book.categoryId)?.name || 'Unknown'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: '#FEF3C7',
                  color: brandOrange,
                  fontWeight: 600,
                }}
              />
            ) : (
              <Box />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );

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
              component={Link}
              to="/home"
              sx={{ color: brandOrange, fontWeight: 600, textDecoration: 'none' }}
            >
              Home
            </Typography>
            <Typography
              component={Link}
              to="/home/users"
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': { color: brandOrange },
              }}
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

      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 4 }}>
        {/* ФИЛЬТРЫ И ПОИСК */}
        <Box sx={{ display: 'flex', gap: 2, mb: 6 }}>
          <TextField
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search books by title or author..."
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { borderColor: '#E5E7EB' },
                '&.Mui-focused fieldset': { borderColor: brandOrange },
              },
            }}
          />

          <Select
            value={categoryId}
            onChange={(e) =>
              navigate({
                to: '/home',
                search: {
                  searchQuery,
                  sort,
                  readingPage,
                  recentPage: 0,
                  categoryId: e.target.value,
                },
              })
            }
            size="small"
            startAdornment={<FilterAltOutlinedIcon sx={{ color: '#9CA3AF', mr: 1, ml: 1 }} />}
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              minWidth: 160,
              '& fieldset': { borderColor: '#E5E7EB' },
            }}
          >
            <MenuItem value="all">All Genres</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.categoryId} value={String(cat.categoryId)}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(e) =>
              navigate({
                to: '/home',
                search: {
                  searchQuery,
                  categoryId,
                  readingPage,
                  recentPage: 0,
                  sort: e.target.value,
                },
              })
            }
            size="small"
            startAdornment={<SortIcon sx={{ color: '#9CA3AF', mr: 1, ml: 1 }} />}
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              minWidth: 180,
              '& fieldset': { borderColor: '#E5E7EB' },
            }}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="az">Title A to Z</MenuItem>
            <MenuItem value="za">Title Z to A</MenuItem>
          </Select>
        </Box>

        {/* СПИСОК КНИГ */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#111827',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box component="span" sx={{ color: brandOrange }}>
              📖
            </Box>
            {isSearching ? 'Search Results' : 'Recently Uploaded'}
          </Typography>

          {isSearching ? (
            // 🔥 РЕЖИМ ПОИСКА: Скрываем стрелки по бокам, показываем пагинацию внизу
            <Box>
              {displayBooks.length > 0 ? (
                renderBookCards()
              ) : (
                <Typography sx={{ textAlign: 'center', color: '#6B7280', py: 4 }}>
                  No books found.
                </Typography>
              )}

              {maxRecentPages > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    mt: 5,
                  }}
                >
                  <Button
                    onClick={handleRecentPrev}
                    disabled={recentPage <= 0}
                    variant="outlined"
                    size="small"
                    startIcon={<ChevronLeftIcon />}
                    sx={{ color: '#6B7280', borderColor: '#E5E7EB', textTransform: 'none' }}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                    Page {recentPage + 1} of {maxRecentPages}
                  </Typography>
                  <Button
                    onClick={handleRecentNext}
                    disabled={recentPage >= maxRecentPages - 1}
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
            // 🔥 РЕЖИМ СЛАЙДЕРА: Обычный вид со стрелками
            <Box sx={{ position: 'relative' }}>
              <IconButton
                onClick={handleRecentPrev}
                disabled={recentPage <= 0}
                sx={{
                  position: 'absolute',
                  left: -48,
                  top: '40%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#F3F4F6' },
                  '&.Mui-disabled': { opacity: 0 },
                }}
              >
                <ChevronLeftIcon sx={{ color: brandOrange }} />
              </IconButton>

              {displayBooks.length > 0 ? (
                renderBookCards()
              ) : (
                <Typography sx={{ textAlign: 'center', color: '#6B7280', py: 4 }}>
                  No books found.
                </Typography>
              )}

              <IconButton
                onClick={handleRecentNext}
                disabled={recentPage >= maxRecentPages - 1}
                sx={{
                  position: 'absolute',
                  right: -48,
                  top: '40%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#F3F4F6' },
                  '&.Mui-disabled': { opacity: 0 },
                }}
              >
                <ChevronRightIcon sx={{ color: brandOrange }} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* MY READING LIST (🔥 Скрыт, если включен поиск) */}
        {!isSearching && (
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#111827',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box component="span" sx={{ color: brandOrange }}>
                ♡
              </Box>{' '}
              My Reading List
            </Typography>

            <Box sx={{ position: 'relative', maxWidth: 900 }}>
              <IconButton
                onClick={handleReadingPrev}
                disabled={readingPage <= 0}
                sx={{
                  position: 'absolute',
                  left: -48,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#F3F4F6' },
                  '&.Mui-disabled': { opacity: 0 },
                }}
              >
                <ChevronLeftIcon sx={{ color: brandOrange }} />
              </IconButton>

              {readingBooks.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                  {readingBooks.map((book) => {
                    const progressValue = book.readPercentage || 0;
                    const isFinished = book.readingStatus === 'FINISHED' || progressValue === 100;
                    const progressColor = isFinished ? '#10B981' : brandOrange;

                    return (
                      <Box
                        key={book.bookId}
                        onClick={() =>
                          navigate({
                            to: '/home/profile/read/$bookId',
                            params: { bookId: book.bookId! },
                          })
                        }
                        sx={{
                          bgcolor: 'white',
                          borderRadius: 4,
                          p: 2.5,
                          display: 'flex',
                          gap: 3,
                          ...cardHoverStyle,
                        }}
                      >
                        {book.imageUrl ? (
                          <Box
                            component="img"
                            src={book.imageUrl}
                            alt={book.title}
                            sx={{
                              width: 80,
                              height: 110,
                              borderRadius: 2,
                              flexShrink: 0,
                              objectFit: 'cover',
                              border: '1px solid #E5E7EB',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 80,
                              height: 110,
                              bgcolor: '#F3E8FF',
                              borderRadius: 2,
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9CA3AF',
                            }}
                          >
                            <CustomLogoIcon sx={{ fontSize: 32 }} />
                          </Box>
                        )}

                        <Box
                          sx={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.2, mb: 0.5 }}
                          >
                            {book.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280', mb: 'auto' }}>
                            {book.authorFullName}
                          </Typography>

                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: '#6B7280', fontWeight: 600 }}
                              >
                                Progress
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: progressColor, fontWeight: 800 }}
                              >
                                {progressValue}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={progressValue}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#F3F4F6',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: progressColor,
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ color: '#6B7280', py: 2 }}>
                  You haven't started reading any books yet.
                </Typography>
              )}

              <IconButton
                onClick={handleReadingNext}
                disabled={readingPage >= maxReadingPages - 1}
                sx={{
                  position: 'absolute',
                  right: -48,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#F3F4F6' },
                  '&.Mui-disabled': { opacity: 0 },
                }}
              >
                <ChevronRightIcon sx={{ color: brandOrange }} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

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
