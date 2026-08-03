/**
 * Global Download Helper Utility
 * 
 * This utility provides a robust file download mechanism that works across all
 * environments, including Android WebView APKs where standard Blob URLs
 * (URL.createObjectURL) are not natively supported.
 * 
 * It uses Data URI encoding as a fallback for text-based files (CSV, etc.)
 * and direct file URLs for binary content.
 */

/**
 * Downloads a file using a Data URI or direct URL approach.
 * 
 * @param fileData - The content to download. Can be:
 *   - A string (for CSV/text files)
 *   - A Blob object (for binary files)
 *   - A URL string (for direct file links)
 * @param fileName - The name of the file to download (e.g., "report.csv")
 * @param mimeType - The MIME type of the file (e.g., "text/csv", "application/pdf")
 */
export const downloadFile = (
  fileData: string | Blob | URL,
  fileName: string,
  mimeType: string = 'text/plain'
): void => {
  // Create an invisible anchor element
  const link = document.createElement('a');
  link.style.display = 'none';
  link.setAttribute('download', fileName);
  link.setAttribute('target', '_blank');

  let href: string;

  if (typeof fileData === 'string') {
    // Handle string data (CSV, text, etc.)
    // Check if it's already a URL (starts with http/https/data)
    if (fileData.startsWith('http://') || fileData.startsWith('https://') || fileData.startsWith('data:')) {
      href = fileData;
    } else {
      // It's raw text content - convert to Data URI
      // Prepend UTF-8 BOM for CSV/text files to ensure proper character rendering
      const bom = '\uFEFF';
      const encodedData = encodeURIComponent(bom + fileData);
      href = `data:${mimeType};charset=utf-8,${encodedData}`;
    }
  } else if (fileData instanceof Blob) {
    // Handle Blob objects
    // For Android WebView compatibility, we read the blob as a data URL
    const reader = new FileReader();
    reader.onload = function(e) {
      if (e.target && typeof e.target.result === 'string') {
        link.setAttribute('href', e.target.result);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    reader.readAsDataURL(fileData);
    return; // Exit early since we handle the click in the onload callback
  } else {
    // Handle URL objects
    href = fileData.toString();
  }

  link.setAttribute('href', href);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads a CSV file with proper UTF-8 BOM encoding.
 * 
 * @param csvContent - The CSV string content
 * @param fileName - The name of the CSV file (e.g., "data.csv")
 */
export const downloadCSV = (csvContent: string, fileName: string): void => {
  downloadFile(csvContent, fileName, 'text/csv');
};

/**
 * Downloads a text file with proper UTF-8 BOM encoding.
 * 
 * @param textContent - The text content
 * @param fileName - The name of the text file (e.g., "notes.txt")
 */
export const downloadText = (textContent: string, fileName: string): void => {
  downloadFile(textContent, fileName, 'text/plain');
};

/**
 * Downloads a file from a direct URL.
 * 
 * @param url - The direct URL to the file
 * @param fileName - The name to save the file as
 * @param mimeType - The MIME type of the file
 */
export const downloadFromUrl = (url: string, fileName: string, mimeType: string = 'application/octet-stream'): void => {
  downloadFile(url, fileName, mimeType);
};