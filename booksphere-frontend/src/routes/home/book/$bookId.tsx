import { createFileRoute, useRouter, useNavigate } from '@tanstack/react-router';
import {
  Box,
  Typography,
  Button,
  Container,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useState } from 'react';
import { toast } from 'sonner';

// Импортируем методы из обновленного SDK
import { getBookDetails, markAsReading } from '../../../api/generated/sdk.gen';

export const Route = createFileRoute('/home/book/$bookId')({
  // Загружаем реальные данные о книге перед отрисовкой страницы
  loader: async ({ params }) => {
    try {
      const response = await getBookDetails({ path: { bookId: params.bookId } });

      if (response.error || !response.data) {
        throw new Error('Book not found');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch book details:', error);
      throw error;
    }
  },
  component: BookDetailsPage,
});

function BookDetailsPage() {
  const book = Route.useLoaderData(); // Получаем BookDetailsDto
  const router = useRouter();
  const navigate = useNavigate();
  const brandOrange = '#D97706';

  const [isAdding, setIsAdding] = useState(false);

  // Функция для добавления книги в библиотеку пользователя
  const handleAddToLibrary = async () => {
    if (!book.bookId) return;

    setIsAdding(true);
    try {
      const response = await markAsReading({ path: { bookId: book.bookId } });

      if (response.error) {
        throw new Error('Failed to add book to library');
      }

      toast.success('Book added to your reading list!');

      // Сбрасываем кеш роутера, чтобы обновить списки на главной
      await router.invalidate();

      // Сразу перекидываем пользователя в читалку
      navigate({ to: '/home/profile/read/$bookId', params: { bookId: book.bookId } });
    } catch (error) {
      console.error(error);
      toast.error('Could not add book to library. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F6F4F1', pb: 10 }}>
      {/* Шапка с кнопкой назад */}
      <Box
        sx={{
          backgroundColor: '#ffffff',
          py: 2,
          px: 4,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            // Возвращаемся на главную страницу принудительно
            onClick={() => navigate({ to: '/home', search: { recentPage: 0, readingPage: 0 } })}
            sx={{ color: '#4B5563', '&:hover': { backgroundColor: '#F3F4F6' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Book Details
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Box
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 5,
          }}
        >
          {/* ЛЕВАЯ ЧАСТЬ: Обложка книги */}
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: '100%', md: 240 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: '100%',
                aspectRatio: '2/3',
                backgroundColor: '#FEF3C7',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
              }}
            >
              {book.imageUrl ? (
                <img
                  src={book.imageUrl}
                  alt={book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <MenuBookIcon sx={{ fontSize: 64, color: brandOrange }} />
              )}
            </Box>
          </Box>

          {/* ПРАВАЯ ЧАСТЬ: Информация */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 'auto' }}>
              {book.categoryName && (
                <Chip
                  label={book.categoryName}
                  sx={{ backgroundColor: '#FEF3C7', color: brandOrange, fontWeight: 600, mb: 2 }}
                  size="small"
                />
              )}

              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: '#111827', mb: 1, lineHeight: 1.2 }}
              >
                {book.title}
              </Typography>

              <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 500, mb: 4 }}>
                {book.authorFullName}
              </Typography>

              {/* Блок с информацией о загрузчике */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 3,
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 4,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={book.uploaderAvatarUrl || undefined}
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#E5E7EB',
                      color: '#9CA3AF',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    {!book.uploaderAvatarUrl && <PersonOutlineOutlinedIcon />}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#6B7280', display: 'block', mb: 0.2 }}
                    >
                      Uploaded by
                    </Typography>
                    <Typography
                      variant="body2"
                      onClick={() => {
                        if (book.uploaderId) {
                          navigate({
                            to: '/home/users/$userId',
                            params: { userId: book.uploaderId },
                            search: { page: 0 },
                          });
                        }
                      }}
                      sx={{
                        fontWeight: 600,
                        color: '#111827',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                        '&:hover': { color: brandOrange, textDecoration: 'underline' },
                      }}
                    >
                      @{book.uploaderUsername}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Кнопка добавления в библиотеку */}
            <Button
              onClick={handleAddToLibrary}
              disabled={isAdding}
              variant="contained"
              size="large"
              startIcon={
                isAdding ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <BookmarkAddOutlinedIcon />
                )
              }
              sx={{
                backgroundColor: brandOrange,
                color: 'white',
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#B45309', boxShadow: 'none' },
                '&.Mui-disabled': { backgroundColor: '#FCD34D', color: '#FFF' },
              }}
            >
              {isAdding ? 'Adding...' : 'Add to My Library & Read'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
