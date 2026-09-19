import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import {
  Box, Typography, Button, Container, IconButton, Avatar, 
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect } from 'react';

import { getBookDetails, getPersonalProfile, getBorrowsStatus, requestBook, readBook } from '../../../api/generated/sdk.gen';
import type { BorrowRecordDto } from '../../../api/generated/types.gen';

export const Route = createFileRoute('/home/book/$bookId')({
  loader: async ({ params }) => {
    const token = localStorage.getItem('bookSphere_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    const [bookRes, profileRes] = await Promise.all([
      getBookDetails({ path: { bookId: params.bookId } }),
      getPersonalProfile({ headers })
    ]);

    if (bookRes.error || !bookRes.data) throw new Error('Book not found');
    
    return { book: bookRes.data, currentUser: profileRes.data };
  },
  component: BookDetailsPage,
});

function BookDetailsPage() {
  const { book, currentUser } = Route.useLoaderData();
  const { bookId } = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate();
  const brandOrange = '#D97706';

  const [borrowStatus, setBorrowStatus] = useState<BorrowRecordDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestedDays, setRequestedDays] = useState(14);
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 Строгое сравнение строк, чтобы избежать конфликтов типов UUID
  const isOwner = String(book.uploaderId) === String(currentUser?.id);

  useEffect(() => {
    if (isOwner) return; 

    const token = localStorage.getItem('bookSphere_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    getBorrowsStatus({ headers, path: { bookId } })
      .then(res => {
        if (res.data) setBorrowStatus(res.data);
      })
      .catch(err => console.error("Ошибка загрузки статуса аренды:", err));
  }, [bookId, isOwner]);

  const handleRequestSubmit = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('bookSphere_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const res = await requestBook({
        headers,
        path: { bookId },
        body: { requestDays: requestedDays } // Убедитесь, что тут совпадает с вашим DTO
      });

      if (res.data) {
        setBorrowStatus(res.data);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadBook = async () => {
    try {
      const token = localStorage.getItem('bookSphere_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Делаем запрос к бэкенду на получение доступа
      const res = await readBook({
        headers,
        path: { bookId: book.bookId! }
      });

      console.log("Ответ от readBook:", res.data); // 🔥 Посмотрим в консоли F12, что именно вернул бэкенд

      // Проверяем разные варианты названия поля с ссылкой
      const fileUrl = res.data?.bookUrl || (res.data as any)?.fileUrl || (res.data as any)?.url;

      if (fileUrl) {
        navigate({ to: `/home/profile/read/${book.bookId}` });
      } else {
        alert("Сервер не вернул ссылку на файл книги.");
      }
    } catch (error) {
      console.error("Ошибка при открытии книги:", error);
      alert("Не удалось получить доступ к книге. Возможно, срок аренды истек.");
    }
  };

  // 🔥 Бронебойный рендер кнопки
  const renderActionButton = () => {
    if (isOwner) {
      return (
        <Button variant="contained" onClick={handleReadBook} sx={{ bgcolor: brandOrange, color: 'white', '&:hover': { bgcolor: '#B45309' }, px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}>
          Читать свою книгу
        </Button>
      );
    }

    if (!borrowStatus || !borrowStatus.status) {
      return (
        <Button variant="contained" onClick={() => setIsModalOpen(true)} sx={{ bgcolor: brandOrange, color: 'white', '&:hover': { bgcolor: '#B45309' }, px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}>
          Запросить доступ
        </Button>
      );
    }

    if (borrowStatus.status === 'PENDING') {
      return (
        <Button variant="outlined" disabled startIcon={<AccessTimeIcon />} sx={{ borderColor: '#D1D5DB', color: '#6B7280', px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}>
          Ожидает подтверждения
        </Button>
      );
    }

    if (borrowStatus.status === 'APPROVED') {
      const daysLeft = borrowStatus.expiresAt 
        ? Math.max(0, Math.ceil((new Date(borrowStatus.expiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) 
        : 0;

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={handleReadBook} sx={{ bgcolor: '#10B981', color: 'white', '&:hover': { bgcolor: '#059669' }, px: 4, py: 1.5, borderRadius: 3, fontWeight: 700, boxShadow: 'none' }}>
            Читать
          </Button>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
            Осталось дней: {daysLeft}
          </Typography>
        </Box>
      );
    }

    // Резервная кнопка, если статус REJECTED или EXPIRED
    return (
      <Button variant="contained" onClick={() => setIsModalOpen(true)} sx={{ bgcolor: brandOrange, color: 'white', '&:hover': { bgcolor: '#B45309' }, px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}>
        Запросить доступ (Снова)
      </Button>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F6F4F1', pb: 10 }}>
      {/* Шапка */}
      <Box sx={{ backgroundColor: '#ffffff', py: 2, px: 4, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.history.back()} sx={{ color: '#4B5563' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>Book Details</Typography>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ backgroundColor: '#ffffff', borderRadius: 4, p: 4, boxShadow: '0px 4px 20px rgba(0,0,0,0.02)', display: 'flex', gap: 4 }}>
          {/* Обложка */}
          <Box sx={{ width: 200, height: 300, borderRadius: 2, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB', flexShrink: 0 }}>
            {book.imageUrl ? <Box component="img" src={book.imageUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MenuBookIcon sx={{ fontSize: 64, color: '#9CA3AF' }} />}
          </Box>

          {/* Инфо и Кнопка */}
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 1 }}>{book.title}</Typography>
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>{book.authorFullName}</Typography>
            <Typography variant="body2" sx={{ color: brandOrange, fontWeight: 600, mb: 'auto' }}>Категория: {book.categoryName}</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #F3F4F6' }}>
              <Avatar src={book.uploaderAvatarUrl} sx={{ width: 40, height: 40 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Владелец</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>@{book.uploaderUsername}</Typography>
              </Box>
            </Box>

            {/* Вызов функции рендера кнопки */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {renderActionButton()}
            </Box>

          </Box>
        </Box>
      </Container>

      {/* Модальное окно запроса книги */}
      <Dialog open={isModalOpen} onClose={() => !isLoading && setIsModalOpen(false)} PaperProps={{ sx: { borderRadius: 3, padding: 1, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#111827' }}>Запрос книги</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
            На какой срок вы хотите взять книгу <b>"{book.title}"</b> у @{book.uploaderUsername}?
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Количество дней</InputLabel>
            <Select value={requestedDays} label="Количество дней" onChange={(e) => setRequestedDays(Number(e.target.value))}>
              <MenuItem value={7}>7 дней</MenuItem>
              <MenuItem value={14}>14 дней</MenuItem>
              <MenuItem value={30}>30 дней (Месяц)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setIsModalOpen(false)} disabled={isLoading} sx={{ color: '#6B7280', textTransform: 'none' }}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleRequestSubmit} disabled={isLoading} sx={{ bgcolor: brandOrange, color: 'white', '&:hover': { bgcolor: '#B45309' }, textTransform: 'none', borderRadius: 2 }}>
            {isLoading ? 'Отправка...' : 'Отправить запрос'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}