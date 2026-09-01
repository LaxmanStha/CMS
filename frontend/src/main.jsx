import './styles/theme.css'
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchInterval: false,
    },
  },
});

function Root() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

const container = document.getElementById('root');

if (!container.__reactRoot) {
  const root = createRoot(container);
  container.__reactRoot = root;
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
} else {
  container.__reactRoot.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}

export default Root;