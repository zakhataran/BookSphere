import {
  createFileRoute,
  redirect,
  Outlet,
  useNavigate,
  useLocation,
} from '@tanstack/react-router';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect, createContext, useContext } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 🔥 Добавили функцию getRecentConversations
import {
  getPersonalProfile,
  searchUser,
  getRecentConversations,
} from '../../api/generated/sdk.gen';
import type { UserReadDto } from '../../api/generated/types.gen.ts';

const ChatContext = createContext<{
  stompClient: Client | null;
  currentUserId: string | null;
  lastIncomingMessage: any;
}>({
  stompClient: null,
  currentUserId: null,
  lastIncomingMessage: null,
});

export const useChatContext = () => useContext(ChatContext);

export const Route = createFileRoute('/home/chats')({
  loader: async () => {
    try {
      const token = localStorage.getItem('bookSphere_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const profileRes = await getPersonalProfile({ headers });
      if (profileRes.error || !profileRes.data) throw redirect({ to: '/auth/login' });
      return { chatProfile: profileRes.data };
    } catch (error) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: ChatsLayout,
});

function ChatsLayout() {
  const { chatProfile } = Route.useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();
  const brandOrange = '#D97706';

  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [lastIncomingMessage, setLastIncomingMessage] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<UserReadDto[]>([]);
  // 🔥 Новый стейт для хранения истории диалогов
  const [recentChats, setRecentChats] = useState<UserReadDto[]>([]);

  // 1. Инициализация WebSocket
  useEffect(() => {
    const token = localStorage.getItem('bookSphere_token');
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe('/user/queue/messages', (msg) => {
          setLastIncomingMessage(JSON.parse(msg.body));
        });
      },
    });
    client.activate();
    setStompClient(client);
    return () => {
      client.deactivate();
    };
  }, []);

  // 🔥 2. Загружаем список недавних диалогов при открытии страницы
  useEffect(() => {
    const token = localStorage.getItem('bookSphere_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    getRecentConversations({ headers })
      .then((res) => {
        if (res.data) setRecentChats(res.data);
      })
      .catch((err) => console.error('Ошибка загрузки диалогов:', err));
  }, []);

  // 3. Поиск по всем пользователям (с задержкой)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFoundUsers([]);
      return;
    }

    const token = localStorage.getItem('bookSphere_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const delayDebounceFn = setTimeout(() => {
      searchUser({ headers, query: { query: searchQuery, page: 0, size: 20 } })
        .then((res) => {
          if (res.data?.content) {
            const others = res.data.content.filter((u) => u.userId !== chatProfile.id);
            setFoundUsers(others);
          }
        })
        .catch((err) => console.error(err));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, chatProfile.id]);

  // 🔥 Выбираем, что показывать: поиск или историю чатов
  const displayUsers = searchQuery.trim() ? foundUsers : recentChats;

  return (
    <ChatContext.Provider
      value={{ stompClient, currentUserId: chatProfile.id ?? null, lastIncomingMessage }}
    >
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F6F4F1',
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            backgroundColor: '#ffffff',
            py: 2,
            px: 4,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
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
                cursor: 'pointer',
              }}
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
            >
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 20 }}>B</Typography>
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
                  '&:hover': { color: brandOrange },
                }}
              >
                Home
              </Typography>
              <Typography
                onClick={() =>
                  navigate({ to: '/home/users', search: { searchQuery: '', page: 0 } })
                }
                sx={{
                  color: '#6B7280',
                  fontWeight: 600,
                  cursor: 'pointer',
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
              src={chatProfile.avatarUrl}
              sx={{ width: 40, height: 40, border: '1px solid #E5E7EB' }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
              {chatProfile.fullName || chatProfile.username}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          {/* ЛЕВАЯ ПАНЕЛЬ */}
          <Paper
            square
            elevation={0}
            sx={{
              width: 360,
              borderRight: '1px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'white',
            }}
          >
            <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #F3F4F6' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 2 }}>
                Чаты
              </Typography>

              <TextField
                fullWidth
                placeholder="Поиск пользователей..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 4,
                    bgcolor: '#F9FAFB',
                    '& fieldset': { borderColor: 'transparent' },
                    '&.Mui-focused fieldset': { borderColor: brandOrange },
                  },
                }}
              />
            </Box>

            <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1, pt: 2 }}>
              {/* Рендерим либо диалоги, либо результаты поиска */}
              {displayUsers.map((user) => {
                const isActive = location.pathname.includes(user.userId!);
                return (
                  <ListItem
                    key={user.userId}
                    onClick={() => navigate({ to: `/home/chats/${user.userId}` })}
                    sx={{
                      borderRadius: 3,
                      mb: 0.5,
                      cursor: 'pointer',
                      bgcolor: isActive ? '#FEF3C7' : 'transparent',
                      '&:hover': { bgcolor: isActive ? '#FEF3C7' : '#F9FAFB' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.avatarUrl} sx={{ bgcolor: brandOrange, color: 'white' }}>
                        {user.fullName ? user.fullName[0] : 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.fullName || user.username}
                      secondary={`@${user.username}`}
                      primaryTypographyProps={{
                        sx: { fontWeight: isActive ? 700 : 500, color: '#111827' },
                      }}
                    />
                  </ListItem>
                );
              })}

              {/* Если ищем, но никого не нашли */}
              {searchQuery.trim() && displayUsers.length === 0 && (
                <Typography sx={{ textAlign: 'center', color: '#9CA3AF', mt: 4, fontSize: 14 }}>
                  Пользователи не найдены
                </Typography>
              )}

              {/* Если поиск пустой, а диалогов еще нет */}
              {!searchQuery.trim() && displayUsers.length === 0 && (
                <Typography sx={{ textAlign: 'center', color: '#9CA3AF', mt: 4, fontSize: 14 }}>
                  У вас пока нет активных диалогов.
                  <br />
                  Воспользуйтесь поиском, чтобы начать общение.
                </Typography>
              )}
            </List>
          </Paper>

          {/* ПРАВАЯ ОБЛАСТЬ ЧАТА */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F9FAFB' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ChatContext.Provider>
  );
}
