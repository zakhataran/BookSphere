import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  Avatar,
  IconButton,
  Button,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ChatIcon from '@mui/icons-material/Chat';

import { getUserProfile, getUserLibrary } from '../../../api/generated/sdk.gen';

const PAGE_SIZE = 10;

type UserProfileSearch = {
  page: number;
};

export const Route = createFileRoute('/home/users/$userId')({
  validateSearch: (search: Record<string, unknown>): UserProfileSearch => ({
    page: Number(search.page ?? 0) || 0,
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ params, deps: { page } }) => {
    try {
      const [profileRes, libraryRes] = await Promise.all([
        getUserProfile({ path: { userId: params.userId } }),
        getUserLibrary({ path: { userId: params.userId }, query: { page, size: PAGE_SIZE } }),
      ]);
      if (profileRes.error || !profileRes.data) throw new Error('User not found');
      return {
        profile: profileRes.data,
        library: libraryRes.data || { content: [], customPage: { totalElements: 0, totalPage: 0, page: 0 } },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  component: ForeignUserProfilePage,
});

function ForeignUserProfilePage() {
  const { profile, library } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const brandOrange = '#D97706';
  
  const books = library?.content || [];
  const currentPage = library?.customPage?.page || 0;
  const totalPages = library?.customPage?.totalPage || 0;
  const totalBooks = library?.customPage?.totalElements || 0;

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/home/users/$userId',
      params: { userId: Route.useParams().userId },
      search: { page: newPage },
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F6F4F1', pb: 10 }}>
      {/* 1. ШАПКА */}
      <Box sx={{ backgroundColor: '#ffffff', py: 2, px: 4, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.history.back()} sx={{ color: '#4B5563', '&:hover': { backgroundColor: '#F3F4F6' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            User Profile
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ backgroundColor: '#ffffff', borderRadius: 4, p: 4, mb: 4, boxShadow: '0px 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Avatar src={profile.avatarUrl} sx={{ width: 100, height: 100, backgroundColor: '#F3F4F6', border: '2px solid #E5E7EB', color: '#9CA3AF', fontSize: 40 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
              {profile.fullName || profile.username}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: brandOrange, fontWeight: 600 }}>
              @{profile.username}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Books in library: {totalBooks}
            </Typography>

            {profile.isVerified && profile.id && (
              <Button
                variant="contained"
                startIcon={<ChatIcon />}
                onClick={() => navigate({ to: `/home/chats/${profile.id}` })}
                sx={{
                  mt: 2,
                  bgcolor: brandOrange,
                  color: 'white',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  width: 'fit-content',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#B45309', boxShadow: 'none' },
                }}
              >
                Write Message
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 3 }}>
          Library
        </Typography>
        {books.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
            <MenuBookIcon sx={{ fontSize: 64, color: '#D1D5DB' }} />
            <Typography sx={{ color: '#6B7280', textAlign: 'center' }}>
              This user hasn't added any books to their library yet.
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {books.map((book) => {
                const isFinished = book.readingStatus === 'FINISHED' || book.readPercentage === 100;
                const progressColor = isFinished ? '#10B981' : brandOrange;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 6 }} key={book.bookId}>
                    <Paper
                      onClick={() => navigate({ to: '/home/book/$bookId', params: { bookId: book.bookId! } })}
                      elevation={0}
                      sx={{ cursor: 'pointer', display: 'flex', p: 2, borderRadius: 4, border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', transition: 'all 0.2s', '&:hover': { boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.08)', borderColor: '#FEF3C7', transform: 'translateY(-2px)' } }}
                    >
                      <Box sx={{ width: 70, height: 100, borderRadius: 2, backgroundColor: '#F3F4F6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                        {book.imageUrl ? <Box component="img" src={book.imageUrl} alt={book.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MenuBookIcon sx={{ fontSize: 32 }} />}
                      </Box>
                      <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.2, mb: 0.5 }}>
                          {book.title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, mb: 'auto' }}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>{book.authorFullName}</Typography>
                          {book.categoryName && <Chip label={book.categoryName} size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#FEF3C7', color: brandOrange, fontWeight: 600 }} />}
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>Progress</Typography>
                            <Typography variant="caption" sx={{ color: progressColor, fontWeight: 800 }}>{book.readPercentage}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={book.readPercentage} sx={{ height: 6, borderRadius: 3, backgroundColor: '#F3F4F6', '& .MuiLinearProgress-bar': { backgroundColor: progressColor, borderRadius: 3 } }} />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 5 }}>
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} variant="outlined" size="small" startIcon={<ChevronLeftIcon />} sx={{ color: '#6B7280', borderColor: '#E5E7EB', textTransform: 'none' }}>Previous</Button>
                <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>Page {currentPage + 1} of {totalPages}</Typography>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} variant="outlined" size="small" endIcon={<ChevronRightIcon />} sx={{ color: '#6B7280', borderColor: '#E5E7EB', textTransform: 'none' }}>Next</Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}