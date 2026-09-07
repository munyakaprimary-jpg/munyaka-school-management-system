import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// On-screen error display utility. Used when React itself fails to mount
// so we can read the exact error/stack instead of seeing a blank page.
const renderFatalErrorToDom = (title: string, message: string, stack: string) => {
  try {
    const root = document.getElementById('root') || document.body;
    const safeTitle = String(title).replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
    const safeMessage = String(message).replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
    const safeStack = String(stack || '').replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'));
    const html = `
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background:#fef2f2; color:#991b1b; border:2px solid #b91c1c; border-radius:12px; padding:20px; margin:20px; white-space:pre-wrap; word-break:break-word;">
        <div style="font-size:18px; font-weight:700; margin:0 0 12px; color:#7f1d1d;">${safeTitle}</div>
        <div style="font-size:14px; margin:0 0 12px;">${safeMessage}</div>
        <pre style="margin:0; font-size:12px; line-height:1.5; background:#fee2e2; padding:12px; border-radius:8px; overflow:auto; max-height:50vh;">${safeStack}</pre>
      </div>
    `;
    if (root.id === 'root') {
      root.innerHTML = html;
    } else {
      root.innerHTML = (root.innerHTML || '') + html;
    }
  } catch {
    document.body.style.color = 'red';
  }
};

// Last-ditch global error traps
window.onerror = function (
  _message: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error,
): boolean {
  const message =
    (typeof _message === 'string' ? _message : '') || error?.message || 'Unknown error';
  const stack =
    error?.stack || `(no stack trace — ${source || '?'}:${lineno || '?'}:${colno || '?'})`;
  // eslint-disable-next-line no-console
  console.error('[window.onerror]', message, error);
  renderFatalErrorToDom('Uncaught error: ' + message, '', stack);
  return true;
};

window.addEventListener('unhandledrejection', (event) => {
  const reason: any = event.reason;
  const message = reason?.message || String(reason || 'Unknown rejection');
  const stack = reason?.stack || '(no stack trace)';
  // eslint-disable-next-line no-console
  console.error('[unhandledrejection]', reason);
  renderFatalErrorToDom('Unhandled Promise Rejection: ' + message, '', stack);
});

// Wrap the entire mount process so any failure during the React tree
// initialization is caught and displayed on-screen.
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else {
    renderFatalErrorToDom(
      'Mount failure',
      'No #root element found in document.',
      new Error('document.getElementById("root") returned null').stack || '',
    );
  }
} catch (err: any) {
  // eslint-disable-next-line no-console
  console.error('[main.tsx] Failed to mount React app:', err);
  renderFatalErrorToDom(
    'Failed to mount React app',
    err?.message || String(err),
    err?.stack || '(no stack trace)',
  );
}