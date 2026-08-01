import { createFileRoute } from '@tanstack/react-router';
import { Box, Typography, TextField, IconButton, Paper, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../chats';
import { getChatHistory } from '../../../api/generated/sdk.gen';

export const Route = createFileRoute('/home/chats/$recipientId')({
  component: ActiveChatPage,
});

function ActiveChatPage() {
  const { recipientId } = Route.useParams();
  const { stompClient, currentUserId, lastIncomingMessage } = useChatContext();

  const brandOrange = '#D97706';
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');

  // 1. Используем сгенерированный типизированный SDK метод вместо fetch
  useEffect(() => {
    const token = localStorage.getItem('bookSphere_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    getChatHistory({ headers, path: { recipientId } })
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setMessages(res.data);
        }
      })
      .catch((err) => console.error('Ошибка загрузки истории:', err));
  }, [recipientId]);

  useEffect(() => {
    if (lastIncomingMessage && lastIncomingMessage.senderId === recipientId) {
      setMessages((prev) => [...prev, lastIncomingMessage]);
    }
  }, [lastIncomingMessage, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !stompClient || !stompClient.connected) return;

    const messagePayload = {
      senderId: currentUserId,
      recipientId: recipientId,
      content: inputText.trim(),
    };

    stompClient.publish({
      destination: '/app/chat',
      body: JSON.stringify(messagePayload),
    });

    setMessages((prev) => [...prev, { ...messagePayload, timestamp: new Date().toISOString() }]);
    setInputText('');
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'white',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar sx={{ bgcolor: brandOrange }}>U</Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
          Диалог
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <Box
              key={index}
              sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  px: 2,
                  maxWidth: '60%',
                  borderRadius: 4,
                  bgcolor: isMe ? brandOrange : '#E5E7EB',
                  color: isMe ? 'white' : '#111827',
                }}
              >
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {msg.content}
                </Typography>
                {msg.timestamp && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.6,
                      fontSize: '0.65rem',
                      textAlign: 'right',
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                )}
              </Paper>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: 'white',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Напишите сообщение..."
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              '& fieldset': { borderColor: '#E5E7EB' },
              '&.Mui-focused fieldset': { borderColor: brandOrange },
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!inputText.trim()}
          sx={{
            bgcolor: brandOrange,
            color: 'white',
            '&:hover': { bgcolor: '#B45309' },
            '&.Mui-disabled': { bgcolor: '#F3F4F6', color: '#9CA3AF' },
          }}
        >
          {/* 🔥 Заменили size="small" на fontSize="small" для корректной типизации SVG-иконки */}
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
