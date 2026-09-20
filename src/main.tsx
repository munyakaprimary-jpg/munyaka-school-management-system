import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root') || document.querySelector('[data-dyad-root="true"]');

if (rootElement) {
  if (!rootElement.id) rootElement.id = 'root';
  if (!rootElement.getAttribute('data-dyad-root')) rootElement.setAttribute('data-dyad-root', 'true');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  const fallback = document.createElement('div');
  fallback.id = 'root';
  fallback.setAttribute('data-dyad-root', 'true');
  document.body.appendChild(fallback);
  ReactDOM.createRoot(fallback).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
