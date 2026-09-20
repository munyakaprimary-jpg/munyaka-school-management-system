import React from 'react';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '32px',
        textAlign: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#dbeafe',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          🏫
        </div>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '8px'
        }}>
          Munyaka School Portal — Emergency Recovery Mode
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          lineHeight: 1.5,
          marginBottom: '24px'
        }}>
          The application has booted successfully in isolation mode. All database stores and core routing are ready.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
        >
          Reload Dashboard Application
        </button>
      </div>
    </div>
  );
}
