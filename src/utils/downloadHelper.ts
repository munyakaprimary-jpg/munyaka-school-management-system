import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Standardized School Header Constants
export const SCHOOL_HEADERS = {
  name: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
  motto: "MOTTO: KNOWLEDGE IS POWER",
  address: "P.O. BOX 5239-30100, ELDORET",
  phone: "+254 712 345 678",
  email: "info@munyaka.sc.ke"
};

// CSV Header Generator - Returns array of header lines
export const generateCSVHeader = (reportTitle: string, extraInfo?: string[]) => {
  const lines = [
    SCHOOL_HEADERS.name,
    SCHOOL_HEADERS.motto,
    SCHOOL_HEADERS.address,
    SCHOOL_HEADERS.phone,
    SCHOOL_HEADERS.email,
    "",
    reportTitle,
    ...(extraInfo || []),
    ""
  ];
  return lines;
};

// PDF Header HTML Generator
export const generatePDFHeaderHTML = (reportTitle: string, extraInfo?: string[]) => {
  const extraLines = extraInfo?.map(info => `<p class="pdf-header-info">${info}</p>`).join('') || '';
  return `
    <div class="pdf-header">
      <h1 class="pdf-school-name">${SCHOOL_HEADERS.name}</h1>
      <p class="pdf-motto">${SCHOOL_HEADERS.motto}</p>
      <p class="pdf-address">${SCHOOL_HEADERS.address}</p>
      <p class="pdf-contact">${SCHOOL_HEADERS.phone} | ${SCHOOL_HEADERS.email}</p>
      <div class="pdf-divider"></div>
      <h2 class="pdf-report-title">${reportTitle}</h2>
      ${extraLines}
    </div>
  `;
};

// Download CSV with standardized headers
export const downloadCSV = (csvContent: string, fileName: string): void => {
  const BOM = '\uFEFF';
  const encodedData = encodeURIComponent(BOM + csvContent);
  const href = `data:text/csv;charset=utf-8,${encodedData}`;
  
  const link = document.createElement('a');
  link.setAttribute('href', href);
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Download text file
export const downloadText = (textContent: string, fileName: string): void => {
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Download from URL
export const downloadFromUrl = (url: string, fileName: string, mimeType: string = 'application/octet-stream'): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};