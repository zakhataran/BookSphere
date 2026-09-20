import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  type SvgIconProps,
  Button,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';

import { getMyLibrary, getBorrowedBooks } from '../../../api/generated/sdk.gen';

const PAGE_SIZE = 10;
const brandOrange = '#D97706';

type ProfileLibrarySearch = {
  page: number;
  tab: 'my' | 'borrowed'; // 🔥 Добавили тип вкладки
};

export const Route = createFileRoute('/home/profile/')({
  validateSearch: (search: Record<string, unknown>): ProfileLibrarySearch => {
    return {
      page: Number(search.page ?? 0) || 0,
      tab: (search.tab as 'my' | 'borrowed') || 'my',
    };
  },

  loaderDeps: ({ search: { page, tab } }) => ({ page, tab }),

  loader: async ({ deps: { page, tab } }) => {
    try {
      const token = localStorage.getItem('bookSphere_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      let response;
      if (tab === 'borrowed') {
        response = await getBorrowedBooks({ headers, query: { page, size: PAGE_SIZE } });
      } else {
        response = await getMyLibrary({ headers, query: { page, size: PAGE_SIZE } });
      }

      if (response.error) throw new Error('Failed to fetch library');
      return response.data;
    } catch (error) {
      console.error(error);
      return { content: [], customPage: { totalElements: 0, totalPage: 0, page: 0 } };
    }
  },
  component: ProfileLibrary,
});

function ProfileLibrary() {
  const libraryData = Route.useLoaderData();
  const { page: currentPage, tab: activeTab } = Route.useSearch();
  const navigate = useNavigate();
  
  const books = libraryData?.content || [];
  const totalPages = libraryData?.customPage?.totalPage || 0;
  const totalBooks = libraryData?.customPage?.totalElements || 0;

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/home/profile',
      search: { page: newPage, tab: activeTab },
    });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'my' | 'borrowed') => {
    navigate({
      to: '/home/profile',
      search: { page: 0, tab: newValue },
    });
  };

  const handleAddBook = () => {
    navigate({ to: '/home/profile/upload' });
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <CustomLogoIcon sx={{ color: 'white', fontSize: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
              Profile Library
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Total books: {totalBooks}
            </Typography>

            {activeTab === 'my' && books.length > 0 && (
              <IconButton
                onClick={handleAddBook}
                size="small"
                sx={{
                  backgroundColor: '#10B981',
                  borderRadius: 1,
                  color: 'white',
                  width: 28,
                  height: 28,
                  p: 0,
                  '&:hover': { backgroundColor: '#059669' },
                }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ 
          mb: 4, 
          borderBottom: '1px solid #E5E7EB',
          '& .MuiTabs-indicator': { backgroundColor: brandOrange, height: 3, borderRadius: '3px 3px 0 0' } 
        }}
      >
        <Tab 
          value="my" 
          label="My Books" 
          sx={{ '&.Mui-selected': { color: brandOrange }, fontWeight: 700, textTransform: 'none', fontSize: 16 }} 
        />
        <Tab 
          value="borrowed" 
          label="Borrowed" 
          sx={{ '&.Mui-selected': { color: brandOrange }, fontWeight: 700, textTransform: 'none', fontSize: 16 }} 
        />
      </Tabs>

      {books.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 3 }}>
          {activeTab === 'my' ? (
            <>
              <Button
                onClick={handleAddBook}
                variant="contained"
                sx={{
                  width: 100, height: 100, backgroundColor: '#10B981', borderRadius: 3, color: 'white', p: 0, boxShadow: 'none',
                  '&:hover': { backgroundColor: '#059669', boxShadow: 'none' },
                }}
              >
                <AddIcon sx={{ fontSize: 56 }} />
              </Button>
              <Typography sx={{ color: '#6B7280', textAlign: 'center' }}>
                Your library is empty. Start adding some books!
              </Typography>
            </>
          ) : (
            <>
              <Button
                onClick={() => navigate({ to: '/home/users', search: { searchQuery: '', page: 0 } })}
                variant="contained"
                sx={{
                  width: 100, height: 100, backgroundColor: brandOrange, borderRadius: 3, color: 'white', p: 0, boxShadow: 'none',
                  '&:hover': { backgroundColor: '#B45309', boxShadow: 'none' },
                }}
              >
                <SearchIcon sx={{ fontSize: 48 }} />
              </Button>
              <Typography sx={{ color: '#6B7280', textAlign: 'center', maxWidth: 300 }}>
                You haven't borrowed any books yet. Find other users and request access to their library!
              </Typography>
            </>
          )}
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
                    onClick={() =>
                      navigate({
                        to: '/home/profile/read/$bookId',
                        params: { bookId: book.bookId! },
                      })
                    }
                    elevation={0}
                    sx={{
                      cursor: 'pointer', display: 'flex', p: 2, borderRadius: 4, border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 70, height: 100, borderRadius: 2, backgroundColor: '#F3F4F6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', overflow: 'hidden',
                      }}
                    >
                      {book.imageUrl ? (
                        <Box component="img" src={book.imageUrl} alt={book.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <CustomLogoIcon sx={{ fontSize: 32, color: 'currentColor' }} />
                      )}
                    </Box>

                    <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', lineHeight: 1.2, mb: 0.5 }}>
                        {book.title}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, mb: 'auto' }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          {book.authorFullName}
                        </Typography>
                        {book.categoryName && (
                          <Chip
                            label={book.categoryName}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#FEF3C7', color: brandOrange, fontWeight: 500 }}
                          />
                        )}
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>Progress</Typography>
                          <Typography variant="caption" sx={{ color: progressColor, fontWeight: 700 }}>
                            {book.readPercentage || 0}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={book.readPercentage || 0}
                          sx={{
                            height: 6, borderRadius: 3, backgroundColor: '#F3F4F6',
                            '& .MuiLinearProgress-bar': { backgroundColor: progressColor, borderRadius: 3 },
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 5 }}>
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                variant="outlined"
                size="small"
                startIcon={<ChevronLeftIcon />}
                sx={{ color: '#6B7280', borderColor: '#E5E7EB', textTransform: 'none', '&:hover': { borderColor: '#ced4da', backgroundColor: '#f8f9fa' } }}
              >
                Previous page
              </Button>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Page {currentPage + 1} of {totalPages}
              </Typography>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                variant="outlined"
                size="small"
                endIcon={<ChevronRightIcon />}
                sx={{ color: '#6B7280', borderColor: '#E5E7EB', textTransform: 'none', '&:hover': { borderColor: '#ced4da', backgroundColor: '#f8f9fa' } }}
              >
                Next page
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function CustomLogoIcon(_props: SvgIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_13_2)">
        <path d="M0.909119 1.81818H6.36366C7.32809 1.81818 8.25301 2.20129 8.93496 2.88324C9.61691 3.56519 10 4.49012 10 5.45454V18.1818C10 17.4585 9.71269 16.7648 9.20123 16.2533C8.94798 16.0001 8.64732 15.7992 8.31644 15.6621C7.98555 15.5251 7.63091 15.4545 7.27275 15.4545H0.909119V1.81818Z" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M19.0909 1.81818H13.6364C12.6719 1.81818 11.747 2.20129 11.0651 2.88324C10.3831 3.56519 10 4.49012 10 5.45454V18.1818C10 17.4585 10.2873 16.7648 10.7988 16.2533C11.3103 15.7419 12.004 15.4545 12.7273 15.4545H19.0909V1.81818Z" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_13_2"><rect width="20" height="20" fill="white" /></clipPath>
      </defs>
    </svg>
  );
}