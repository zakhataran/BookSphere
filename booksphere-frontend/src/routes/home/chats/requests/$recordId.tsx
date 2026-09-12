import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, Typography, Button, Paper, Avatar, Divider, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useState, useEffect } from 'react';

// Импортируем методы из SDK
import { 
  getIncomingRequests, 
  getOutgoingRequests, 
  approveRequest, 
  rejectRequest 
} from '../../../../api/generated/sdk.gen';
import type { BorrowRequestViewDto } from '../../../../api/generated/types.gen';
import { useChatContext } from '../../chats';

export const Route = createFileRoute('/home/chats/requests/$recordId')({
  component: RequestDetailsPage,
});

function RequestDetailsPage() {
  const { recordId } = Route.useParams();
  const navigate = useNavigate();
  const brandOrange = '#D97706';
  
  // Достаем контекст чата (id текущего пользователя)
  const { currentUserId, updateReqStatus } = useChatContext();

  const [request, setRequest] = useState<BorrowRequestViewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Загружаем данные заявки. Так как отдельного эндпоинта для одной заявки нет, 
  // мы просто ищем её в общем списке входящих или исходящих.
  useEffect(() => {
    const fetchRequest = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('bookSphere_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        // Грузим оба списка параллельно
        const [inRes, outRes] = await Promise.all([
          getIncomingRequests({ headers }),
          getOutgoingRequests({ headers })
        ]);

        const allRequests = [...(inRes.data || []), ...(outRes.data || [])];
        const found = allRequests.find(req => req.recordId === recordId);
        
        setRequest(found || null);
      } catch (error) {
        console.error("Ошибка загрузки заявки:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [recordId]);

  // 2. Логика кнопок Одобрить/Отказать
  const handleAction = async (action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('bookSphere_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const path = { recordId };
      
      let res;
      if (action === 'approve') {
        res = await approveRequest({ headers, path });
      } else {
        res = await rejectRequest({ headers, path });
      }

      // 🔥 СТРОГАЯ ПРОВЕРКА: Если бэкенд вернул ошибку, прерываем выполнение!
      if (res.error) {
        console.error("Ошибка от сервера:", res.error);
        alert("Не удалось изменить статус. Возможно, нет прав или сессия устарела.");
        return; // Интерфейс НЕ обновится, обмана не будет
      }

      // Если дошли сюда — база данных успешно обновлена
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      
      if (request) {
        setRequest({ ...request, status: newStatus });
      }
      updateReqStatus(recordId, newStatus);

    } catch (error) {
      console.error(`Критическая ошибка при выполнении ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  // Если грузим
  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: brandOrange }} />
      </Box>
    );
  }

  // Если заявка не найдена
  if (!request) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>Заявка не найдена</Typography>
        <Button onClick={() => navigate({ to: '/home/chats' })} sx={{ color: brandOrange }}>Вернуться</Button>
      </Box>
    );
  }

  // Определяем, являюсь ли я владельцем книги в этой заявке (входящая) или просящим (исходящая)
  const isIncoming = request.otherUserId !== currentUserId;

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Шапка */}
      <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
          Детали заявки
        </Typography>
      </Box>

      {/* Контент заявки */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 5 }, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 500, borderRadius: 4, p: 4, border: '1px solid #E5E7EB', bgcolor: 'white' }}>
          
          <Typography variant="overline" sx={{ color: brandOrange, fontWeight: 800, mb: 2, display: 'block' }}>
            {isIncoming ? 'Входящий запрос' : 'Ваш исходящий запрос'}
          </Typography>

          {/* Инфо о книге */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
            <Avatar src={request.bookImageUrl} variant="rounded" sx={{ width: 80, height: 120, bgcolor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
              <MenuBookIcon sx={{ fontSize: 40, color: '#9CA3AF' }} />
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', pt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.2, mb: 1 }}>
                {request.bookTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 16 }} /> 
                Срок: <b>{request.requestedDays} дней</b>
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                Статус: <b>{request.status}</b>
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Инфо о пользователе */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Avatar src={request.otherUserAvatarUrl} sx={{ width: 48, height: 48, bgcolor: brandOrange, color: 'white' }}>
              {request.otherUserFullName ? request.otherUserFullName[0] : 'U'}
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                {isIncoming ? 'Кто просит:' : 'Владелец:'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>
                @{request.otherUserFullName}
              </Typography>
            </Box>
          </Box>

          {/* Кнопки действий (Только для Входящих заявок со статусом PENDING) */}
          {isIncoming && request.status === 'PENDING' && (
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button 
                fullWidth variant="contained" 
                startIcon={<CheckCircleIcon />} 
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                sx={{ bgcolor: '#10B981', color: 'white', '&:hover': { bgcolor: '#059669' }, py: 1.5, borderRadius: 3, fontWeight: 700, boxShadow: 'none' }}
              >
                Одобрить
              </Button>
              <Button 
                fullWidth variant="outlined" 
                startIcon={<CancelIcon />} 
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                sx={{ color: '#EF4444', borderColor: '#FCA5A5', '&:hover': { borderColor: '#EF4444', bgcolor: '#FEF2F2' }, py: 1.5, borderRadius: 3, fontWeight: 700 }}
              >
                Отказать
              </Button>
            </Box>
          )}

          {/* Информационные сообщения для других статусов */}
          {request.status === 'APPROVED' && (
            <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Заявка одобрена. Книга доступна для чтения.</Typography>
            </Box>
          )}

          {request.status === 'REJECTED' && (
            <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CancelIcon />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>В доступе отказано.</Typography>
            </Box>
          )}

          {request.status === 'EXPIRED' && (
            <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: '#F3F4F6', color: '#374151', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccessTimeIcon />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Срок аренды истек.</Typography>
            </Box>
          )}

        </Paper>
      </Box>
    </Box>
  );
}