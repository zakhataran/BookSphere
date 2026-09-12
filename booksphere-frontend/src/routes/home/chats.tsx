import { createFileRoute, redirect, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { 
  Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, Paper, 
  TextField, InputAdornment, Tabs, Tab, Badge, Divider, Chip 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useState, useEffect, createContext, useContext } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { 
  getPersonalProfile, searchUser, getRecentConversations, 
  getIncomingRequests, getOutgoingRequests 
} from '../../api/generated/sdk.gen';
import type { UserReadDto, BorrowRequestViewDto } from '../../api/generated/types.gen';

const ChatContext = createContext<{ 
  stompClient: Client | null; 
  currentUserId: string | null; 
  lastIncomingMessage: any;
  updateReqStatus: (recordId: string, newStatus: any) => void; // 🔥 НОВОЕ
}>({
  stompClient: null,
  currentUserId: null,
  lastIncomingMessage: null,
  updateReqStatus: () => {},
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
  
  // Управление вкладками (0 - Чаты, 1 - Заявки)
  const [activeTab, setActiveTab] = useState(0);

  // Стейты для чатов
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<UserReadDto[]>([]);
  const [recentChats, setRecentChats] = useState<UserReadDto[]>([]);

  // Стейты для заявок
  const [incomingRequests, setIncomingRequests] = useState<BorrowRequestViewDto[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<BorrowRequestViewDto[]>([]);

  // 🔥 НОВЫЕ СТЕЙТЫ И ФУНКЦИИ (Вставьте их сюда)
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(new Set());

  // Автоматически помечаем заявку как "просмотренную", если перешли на её URL
  useEffect(() => {
    const match = location.pathname.match(/\/requests\/([^/]+)/);
    if (match && match[1]) {
      setViewedRequests(prev => new Set(prev).add(match[1]));
    }
  }, [location.pathname]);

  // Функция для обновления статуса в списках после нажатия кнопки
  const updateReqStatus = (recordId: string, newStatus: any) => {
    setIncomingRequests(prev => prev.map(req => req.recordId === recordId ? { ...req, status: newStatus } : req));
    setOutgoingRequests(prev => prev.map(req => req.recordId === recordId ? { ...req, status: newStatus } : req));
  };

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
    return () => { client.deactivate(); };
  }, []);

  // 2. Загрузка данных при открытии (Чаты + Заявки)
  useEffect(() => {
    const token = localStorage.getItem('bookSphere_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    // Грузим чаты
    getRecentConversations({ headers })
      .then(res => { if (res.data) setRecentChats(res.data); })
      .catch(console.error);

    // Грузим заявки (параллельно)
    Promise.all([
      getIncomingRequests({ headers }),
      getOutgoingRequests({ headers })
    ]).then(([inRes, outRes]) => {
      if (inRes.data) setIncomingRequests(inRes.data);
      if (outRes.data) setOutgoingRequests(outRes.data);
    }).catch(console.error);
  }, []);

  // 3. Поиск пользователей (с задержкой)
  useEffect(() => {
    if (!searchQuery.trim() || activeTab !== 0) {
      setFoundUsers([]);
      return;
    }
    const token = localStorage.getItem('bookSphere_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const delayDebounceFn = setTimeout(() => {
      searchUser({ headers, query: { query: searchQuery, page: 0, size: 20 } })
        .then((res) => {
          if (res.data?.content) {
            const others = res.data.content.filter(u => u.userId !== chatProfile.id);
            setFoundUsers(others);
          }
        })
        .catch(console.error);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab, chatProfile.id]);

  const displayUsers = searchQuery.trim() ? foundUsers : recentChats;
  
  // Количество ожидающих входящих заявок (для бейджика)
  const pendingIncomingCount = incomingRequests.filter(req => 
    req.status === 'PENDING' && !viewedRequests.has(req.recordId!)
  ).length;

  return (
    <ChatContext.Provider value={{ stompClient, currentUserId: chatProfile.id ?? null, lastIncomingMessage, updateReqStatus }}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F6F4F1' }}>
        
        {/* HEADER */}
        <Box sx={{ backgroundColor: '#ffffff', py: 2, px: 4, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Box sx={{ width: 48, height: 48, backgroundColor: brandOrange, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate({ to: '/home', search: { recentPage: 0, readingPage: 0, searchQuery: '', categoryId: 'all', sort: 'newest' } })}>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 20 }}>B</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Typography onClick={() => navigate({ to: '/home', search: { recentPage: 0, readingPage: 0, searchQuery: '', categoryId: 'all', sort: 'newest' } })} sx={{ color: '#6B7280', fontWeight: 600, cursor: 'pointer', '&:hover': { color: brandOrange } }}>Home</Typography>
              <Typography onClick={() => navigate({ to: '/home/users', search: { searchQuery: '', page: 0 } })} sx={{ color: '#6B7280', fontWeight: 600, cursor: 'pointer', '&:hover': { color: brandOrange } }}>Users</Typography>
            </Box>
          </Box>
          <Box onClick={() => navigate({ to: '/home/profile', search: { page: 0 } })} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover p': { color: brandOrange } }}>
            <Avatar src={chatProfile.avatarUrl} sx={{ width: 40, height: 40, border: '1px solid #E5E7EB' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>{chatProfile.fullName || chatProfile.username}</Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* ЛЕВАЯ ПАНЕЛЬ (Чаты / Заявки) */}
          <Paper square elevation={0} sx={{ width: 360, borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            
            {/* Табы */}
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)} 
              variant="fullWidth"
              sx={{ '& .MuiTabs-indicator': { backgroundColor: brandOrange } }}
            >
              <Tab label={<Typography sx={{ fontWeight: 700 }}>Диалоги</Typography>} sx={{ '&.Mui-selected': { color: brandOrange } }} />
              <Tab 
                label={
                  <Badge badgeContent={pendingIncomingCount} color="error" sx={{ '& .MuiBadge-badge': { right: -15, top: 5 } }}>
                    <Typography sx={{ fontWeight: 700 }}>Заявки</Typography>
                  </Badge>
                } 
                sx={{ '&.Mui-selected': { color: brandOrange } }} 
              />
            </Tabs>
            <Divider />

            {/* КОНТЕНТ ВКЛАДКИ "ДИАЛОГИ" */}
            {activeTab === 0 && (
              <>
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth placeholder="Поиск пользователей..." variant="outlined" size="small"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF' }}/></InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#F9FAFB', '& fieldset': { borderColor: 'transparent' }, '&.Mui-focused fieldset': { borderColor: brandOrange } } }}
                  />
                </Box>
                <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
                  {displayUsers.map((user) => {
                    const isActive = location.pathname.includes(user.userId!);
                    return (
                      <ListItem 
                        key={user.userId} 
                        onClick={() => navigate({ to: `/home/chats/${user.userId}` })}
                        sx={{ borderRadius: 3, mb: 0.5, cursor: 'pointer', bgcolor: isActive ? '#FEF3C7' : 'transparent', '&:hover': { bgcolor: isActive ? '#FEF3C7' : '#F9FAFB' } }}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.avatarUrl} sx={{ bgcolor: brandOrange, color: 'white' }}>{user.fullName ? user.fullName[0] : 'U'}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={user.fullName || user.username} 
                          secondary={`@${user.username}`} 
                          primaryTypographyProps={{ sx: { fontWeight: isActive ? 700 : 500, color: '#111827' } }}
                        />
                      </ListItem>
                    );
                  })}
                  {!searchQuery.trim() && displayUsers.length === 0 && (
                    <Typography sx={{ textAlign: 'center', color: '#9CA3AF', mt: 4, fontSize: 14 }}>У вас пока нет активных диалогов.</Typography>
                  )}
                </List>
              </>
            )}

            {/* КОНТЕНТ ВКЛАДКИ "ЗАЯВКИ" */}
            {activeTab === 1 && (
              <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1, pt: 1 }}>
                
                {/* Входящие */}
                {incomingRequests.length > 0 && (
                  <Typography variant="overline" sx={{ px: 2, color: '#6B7280', fontWeight: 800 }}>Входящие запросы</Typography>
                )}
                {incomingRequests.map((req) => (
                  <ListItem 
                    key={req.recordId}
                    // TODO: При клике будем открывать детальную инфу о заявке справа
                    onClick={() => navigate({ to: `/home/chats/requests/${req.recordId}` })}
                    sx={{ borderRadius: 3, mb: 0.5, cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Avatar src={req.bookImageUrl} variant="rounded" sx={{ width: 32, height: 48, bgcolor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                        <MenuBookIcon sx={{ fontSize: 20, color: '#9CA3AF' }}/>
                      </Avatar>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: '#111827' }}>{req.bookTitle}</Typography>
                        <Typography variant="caption" noWrap sx={{ color: '#6B7280', display: 'block' }}>От: @{req.otherUserFullName || 'Пользователь'}</Typography>
                      </Box>
                      {req.status === 'PENDING' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />}
                    </Box>
                  </ListItem>
                ))}

                <Divider sx={{ my: 1 }} />

                {/* Исходящие */}
                {outgoingRequests.length > 0 && (
                  <Typography variant="overline" sx={{ px: 2, color: '#6B7280', fontWeight: 800 }}>Мои запросы</Typography>
                )}
                {outgoingRequests.map((req) => (
                  <ListItem 
                    key={req.recordId}
                    sx={{ borderRadius: 3, mb: 0.5, opacity: req.status === 'REJECTED' || req.status === 'EXPIRED' ? 0.6 : 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Avatar src={req.bookImageUrl} variant="rounded" sx={{ width: 32, height: 48, bgcolor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                        <MenuBookIcon sx={{ fontSize: 20, color: '#9CA3AF' }}/>
                      </Avatar>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: '#111827' }}>{req.bookTitle}</Typography>
                        <Typography variant="caption" noWrap sx={{ color: '#6B7280', display: 'block' }}>
                          Владелец: @{req.otherUserFullName}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      {req.status === 'PENDING' && <Chip size="small" label="Ожидает" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      {req.status === 'APPROVED' && <Chip size="small" label="Одобрено" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#D1FAE5', color: '#065F46' }} />}
                      {req.status === 'REJECTED' && <Chip size="small" label="Отклонено" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#FEE2E2', color: '#991B1B' }} />}
                      {req.status === 'EXPIRED' && <Chip size="small" label="Истек срок" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#F3F4F6', color: '#374151' }} />}
                    </Box>
                  </ListItem>
                ))}

                {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                  <Typography sx={{ textAlign: 'center', color: '#9CA3AF', mt: 4, fontSize: 14 }}>У вас пока нет заявок.</Typography>
                )}
              </List>
            )}

          </Paper>

          {/* ПРАВАЯ ОБЛАСТЬ */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F9FAFB' }}>
            <Outlet />
          </Box>

        </Box>
      </Box>
    </ChatContext.Provider>
  );
}