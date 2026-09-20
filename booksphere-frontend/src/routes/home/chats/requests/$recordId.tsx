import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, Typography, Button, Paper, Avatar, Divider, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useState, useEffect } from 'react';

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
  
  const { currentUserId, updateReqStatus } = useChatContext();

  const [request, setRequest] = useState<BorrowRequestViewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('bookSphere_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [inRes, outRes] = await Promise.all([
          getIncomingRequests({ headers }),
          getOutgoingRequests({ headers })
        ]);

        const allRequests = [...(inRes.data || []), ...(outRes.data || [])];
        const found = allRequests.find(req => req.recordId === recordId);
        
        setRequest(found || null);
      } catch (error) {
        console.error("Error loading request:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [recordId]);

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

      if (res.error) {
        console.error("Server error:", res.error);
        alert("Failed to update status. You may not have permissions or your session has expired.");
        return;
      }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      
      if (request) {
        setRequest({ ...request, status: newStatus });
      }
      updateReqStatus(recordId, newStatus);

    } catch (error) {
      console.error(`Critical error while executing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: brandOrange }} />
      </Box>
    );
  }

  if (!request) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>Request not found</Typography>
        <Button onClick={() => navigate({ to: '/home/chats' })} sx={{ color: brandOrange }}>Return</Button>
      </Box>
    );
  }

  const isIncoming = request.otherUserId !== currentUserId;

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
          Request Details
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 5 }, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 500, borderRadius: 4, p: 4, border: '1px solid #E5E7EB', bgcolor: 'white' }}>
          
          <Typography variant="overline" sx={{ color: brandOrange, fontWeight: 800, mb: 2, display: 'block' }}>
            {isIncoming ? 'Incoming Request' : 'Your Outgoing Request'}
          </Typography>

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
                Period: <b>{request.requestedDays} days</b>
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                Status: <b>{request.status}</b>
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Avatar src={request.otherUserAvatarUrl} sx={{ width: 48, height: 48, bgcolor: brandOrange, color: 'white' }}>
              {request.otherUserFullName ? request.otherUserFullName[0] : 'U'}
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                {isIncoming ? 'Who is requesting:' : 'Owner:'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>
                @{request.otherUserFullName}
              </Typography>
            </Box>
          </Box>

          {isIncoming && request.status === 'PENDING' && (
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button 
                fullWidth variant="contained" 
                startIcon={<CheckCircleIcon />} 
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                sx={{ bgcolor: '#10B981', color: 'white', '&:hover': { bgcolor: '#059669' }, py: 1.5, borderRadius: 3, fontWeight: 700, boxShadow: 'none' }}
              >
                Approve
              </Button>
              <Button 
                fullWidth variant="outlined" 
                startIcon={<CancelIcon />} 
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                sx={{ color: '#EF4444', borderColor: '#FCA5A5', '&:hover': { borderColor: '#EF4444', bgcolor: '#FEF2F2' }, py: 1.5, borderRadius: 3, fontWeight: 700 }}
              >
                Reject
              </Button>
            </Box>
          )}

          {request.status === 'APPROVED' && (
            <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Request approved. Book available for reading.</Typography>
            </Box>
          )}

          {request.status === 'REJECTED' && (
            <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CancelIcon />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Request rejected.</Typography>
            </Box>
          )}

          {request.status === 'EXPIRED' && (
            <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: '#F3F4F6', color: '#374151', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccessTimeIcon />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Request expired.</Typography>
            </Box>
          )}

        </Paper>
      </Box>
    </Box>
  );
}