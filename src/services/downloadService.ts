import { Capacitor } from '@capacitor/core';

export interface DownloadOptions {
  filename: string;
  data: string | Blob;
  mimeType?: string;
  successMessage?: string;
}

/**
 * Universal Native Download & Notification Service.
 * Safely guarded for browser and Capacitor environments.
 */
export async function downloadFile({
  filename,
  data,
  mimeType = 'text/plain',
  successMessage
}: DownloadOptions): Promise<void> {
  try {
    let contentStr = '';
    if (data instanceof Blob) {
      contentStr = await data.text();
    } else {
      contentStr = String(data);
    }

    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const savedFile = await Filesystem.writeFile({
          path: filename,
          data: contentStr,
          directory: Directory.Documents
        });

        await Share.share({
          title: filename,
          text: 'Exported file from School Management System',
          url: savedFile.uri,
          dialogTitle: `Download ${filename}`
        });

        triggerToast(successMessage || `File "${filename}" saved successfully!`);
        return;
      } catch (nativeErr) {
        console.warn('[downloadFile] Native filesystem write/share error, falling back to web download:', nativeErr);
      }
    }

    // Web browser fallback using Blob URL
    const blob = data instanceof Blob ? data : new Blob([contentStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    triggerToast(successMessage || `File "${filename}" downloaded successfully to Downloads folder!`);
  } catch (err) {
    console.error('[downloadFile] Error downloading file:', err);
    triggerToast(`Failed to download ${filename}. Please try again.`, 'error');
    throw err;
  }
}

export function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent('munyaka:toast', { detail: { message, type } }));

  try {
    const existing = document.getElementById('munyaka-global-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'munyaka-global-toast';
    toast.className = `fixed bottom-6 right-6 z-[99999] px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 transition-all transform translate-y-0 opacity-100 ${
      type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
    }`;
    
    toast.innerHTML = `
      <span class="text-base">${type === 'error' ? '⚠️' : '✅'}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  } catch (e) {
    console.error('[triggerToast] error:', e);
  }
}
