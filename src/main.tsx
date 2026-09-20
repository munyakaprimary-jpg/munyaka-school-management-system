import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
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
