import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface DownloadOptions {
  filename: string;
  data: string; // string or base64
  mimeType: string;
  isBase64?: boolean;
}

export const downloadFile = async ({ filename, data, mimeType, isBase64 = false }: DownloadOptions): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Write to Cache directory for native Android/iOS
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Cache,
        encoding: isBase64 ? undefined : Encoding.UTF8
      });

      // Open native share sheet so user can save or share the file
      await Share.share({
        title: filename,
        text: `Download ${filename}`,
        url: result.uri,
        dialogTitle: `Save or Share ${filename}`
      });
      return;
    } catch (err) {
      console.error("Native download/share failed, falling back to browser download:", err);
    }
  }

  // Web Browser Fallback
  let blob: Blob;
  if (isBase64) {
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    blob = new Blob([byteArray], { type: mimeType });
  } else {
    blob = new Blob([data], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
