import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Box, Typography, IconButton, CircularProgress, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { readBook, updateBookStatus } from '../../../api/generated/sdk.gen';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const Route = createFileRoute('/home/profile/read/$bookId')({
  loader: async ({ params }) => {
    try {
      const response = await readBook({ path: { bookId: params.bookId } });
      if (response.error || !response.data) throw new Error('Failed to load book');
      
      return { 
        bookId: params.bookId, 
        fileUrl: response.data.bookUrl || response.data.bookUrl, 
        bookMarkPage: response.data.bookMarkPage || 1 
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  component: ReadBookPage,
});

function ReadBookPage() {
  const { bookId, fileUrl, bookMarkPage } = Route.useLoaderData();
  const router = useRouter();

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(bookMarkPage);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const changePage = async (offset: number) => {
    const newPage = pageNumber + offset;
    setPageNumber(newPage);
    setIsSaving(true);

    try {
      await updateBookStatus({
        path: { bookId: bookId },
        body: { currentPage: newPage }
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = async () => {
    setIsSaving(true);
    try {
      await updateBookStatus({
        path: { bookId: bookId },
        body: { currentPage: pageNumber }
      });
      await router.invalidate();
    } finally {
      setIsSaving(false);
      router.history.back();
    }
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F6F4F1', pb: 10 }}>
      
      <Box sx={{ backgroundColor: '#ffffff', py: 2, px: 3, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleGoBack} sx={{ color: '#4B5563' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Reading Book
          </Typography>
        </Box>
        
        {isSaving && <CircularProgress size={20} sx={{ color: '#10B981' }} />}
      </Box>

      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ boxShadow: '0px 10px 25px rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden', backgroundColor: 'white', mb: 4 }}>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, width: 300 }}>
                <CircularProgress color="primary" />
              </Box>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              width={Math.min(window.innerWidth * 0.9, 700)} 
            />
          </Document>
        </Box>
      </Container>

      {numPages && (
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: 30, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3, 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(8px)',
            py: 1.5, 
            px: 4, 
            borderRadius: 8, 
            boxShadow: '0px 8px 30px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: '1px solid #E5E7EB'
          }}
        >
          <IconButton 
            onClick={previousPage} 
            disabled={pageNumber <= 1}
            sx={{ color: '#D97706', '&.Mui-disabled': { color: '#E5E7EB' } }}
          >
            <ChevronLeftIcon fontSize="large" />
          </IconButton>

          <Typography variant="body1" sx={{ fontWeight: 600, color: '#374151', minWidth: 120, textAlign: 'center' }}>
            Page {pageNumber} of {numPages}
          </Typography>

          <IconButton 
            onClick={nextPage} 
            disabled={pageNumber >= numPages}
            sx={{ color: '#10B981', '&.Mui-disabled': { color: '#E5E7EB' } }}
          >
            <ChevronRightIcon fontSize="large" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}