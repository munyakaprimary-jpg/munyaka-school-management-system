import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root') || document.querySelector('[data-dyad-root="true"]');

if (!rootElement) {
  console.error('[Munyaka Portal] Fatal: Root element #root or [data-dyad-root] not found in DOM.');
} else {
  console.info('[Munyaka Portal] Mounting React root successfully...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
