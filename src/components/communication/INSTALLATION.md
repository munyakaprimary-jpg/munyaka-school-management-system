# Installation Notes

## Install EmailJS Browser SDK

The offline-first outbox relies on `@emailjs/browser` to dispatch queued
messages when internet connectivity is restored. Install it as a project
dependency:

```bash
npm install @emailjs/browser
# or
pnpm add @emailjs/browser
```

If you do not have access to a registry right now, the module will
**gracefully fall back** to a simulated send path so the dashboard still
works locally for development. The simulated path still removes
messages from the queue (so the UI stays consistent) but does **not**
actually deliver email.

## Configure EmailJS Credentials

Open `src/components/communication/EmailJSConfig.tsx` and replace the
three placeholders with the values from your EmailJS dashboard:

```ts
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xxxxxxxx',   // from EmailJS → Email Services
  TEMPLATE_ID: 'template_xxxxxxxx', // from EmailJS → Email Templates
  PUBLIC_KEY: 'xxxxxxxxxxxxxxxx',    // from EmailJS → Account → API Keys
} as const;
```

## Template Variables

The outbox service sends the following template variables to EmailJS.
Make sure your template is configured to accept these (rename as needed
and update the `templateParams` payload in `OutboxSyncService.ts`):

| Variable        | Source                                             |
|-----------------|----------------------------------------------------|
| `to_email`      | recipient group ("All Parents", "Grade 4 Blue", …) |
| `sender_name`   | the user that queued the message                   |
| `subject`       | the message subject                                |
| `message`       | the message body                                   |
| `sent_at`       | ISO timestamp of when the queue entry was created   |