import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/common/components/ErrorBoundary';
import AppRouter from './routes/AppRouter';

/**
 * Root App Component
 * Wraps application with global providers and error handling
 * - Error boundaries for fault isolation
 * - Toast notifications
 * - Router setup
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#020817',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Inter',
              fontSize: '0.875rem',
              borderRadius: '12px',
              padding: '12px 14px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
            },

            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#020817'
              },
              style: {
                background: '#020817'
              }
            },

            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#020817'
              },
              style: {
                background: '#020817'
              }
            },

            loading: {
              style: {
                background: '#020817'
              }
            },
          }}
        />
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
