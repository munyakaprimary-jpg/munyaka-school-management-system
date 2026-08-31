// EmailJS Configuration Constants
// Replace these placeholders with your actual EmailJS credentials
// Get them from: https://www.emailjs.com/

export const EMAILJS_CONFIG = {
  SERVICE_ID: 'YOUR_SERVICE_ID',     // e.g., 'service_abc123'
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID',   // e.g., 'template_xyz789'
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY',     // e.g., 'AbCdEfGhIjKlMnOp'
} as const;

// Type definitions for the email queue
export interface QueuedMessage {
  id: string;
  to_email: string;
  sender_name: string;
  subject?: string;
  message_body: string;
  timestamp: number;
  status: 'pending' | 'sending' | 'failed';
  retryCount?: number;
}

export const OUTBOX_STORAGE_KEY = 'communication_outbox';