import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { registerServiceWorker } from './registerServiceWorker';

// ─── PWA Service Worker Registration ─────────────────────────────────────────
// Registers on every page load, forces a newly deployed worker to activate and
// reloads the page so mobile devices never stay pinned to a stale Vercel build.
registerServiceWorker();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
