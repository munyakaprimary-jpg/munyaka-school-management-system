/**
 * Standard department export service
 * Provides robust export helper functions for Bursar, ICT, Librarian, Storekeeper, and Science Lab
 * with standardized sender metadata headers.
 */

export interface ExportMetadata {
  senderName: string;
  staffId: string;
  departmentOrStream: string;
  exportedAt: string;
  appVersion: string;
  [key: string]: any;
}

export function createStandardExportHeader(departmentFallback: string = "General"): ExportMetadata {
  if (typeof window === "undefined") {
    return {
      senderName: "Unknown Staff",
      staffId: "N/A",
      departmentOrStream: departmentFallback,
      exportedAt: new Date().toISOString(),
      appVersion: "1.0"
    };
  }

  // Check possible keys used across the app
  const senderName =
    localStorage.getItem("current_user_name") ||
    localStorage.getItem("munyaka_current_user_name") ||
    localStorage.getItem("current_user_display_name") ||
    localStorage.getItem("staff_name") ||
    "Unknown Staff";

  const staffId =
    localStorage.getItem("current_user_id") ||
    localStorage.getItem("munyaka_current_user_id") ||
    localStorage.getItem("staff_id") ||
    "N/A";

  const departmentOrStream =
    localStorage.getItem("current_department_or_stream") ||
    localStorage.getItem("current_stream") ||
    localStorage.getItem("current_department") ||
    departmentFallback;

  return {
    senderName,
    staffId,
    departmentOrStream,
    exportedAt: new Date().toISOString(),
    appVersion: "1.0"
  };
}

function triggerDownload(payload: object, defaultFilename: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBursarPackage(): void {
  try {
    const metadata = createStandardExportHeader("Bursar");
    const payload = {
      metadata,
      data: {
        fees: typeof window !== "undefined" ? localStorage.getItem("munyaka_fees") || "[]" : "[]",
        transactions: typeof window !== "undefined" ? localStorage.getItem("munyaka_transactions") || "[]" : "[]",
        invoices: typeof window !== "undefined" ? localStorage.getItem("munyaka_invoices") || "[]" : "[]"
      }
    };
    triggerDownload(payload, `bursar-export-${new Date().toISOString().slice(0, 10)}.json`);
  } catch (err) {
    console.error("Failed to export bursar package:", err);
    throw err;
  }
}

export function exportICTTechnicalPackage(): void {
  try {
    const metadata = createStandardExportHeader("ICT Lab");
    const payload = {
      metadata,
      data: {
        assets: typeof window !== "undefined" ? localStorage.getItem("munyaka_ict_assets") || "[]" : "[]",
        devices: typeof window !== "undefined" ? localStorage.getItem("munyaka_connected_devices") || "[]" : "[]",
        maintenance: typeof window !== "undefined" ? localStorage.getItem("munyaka_maintenance_logs") || "[]" : "[]"
      }
    };
    triggerDownload(payload, `ict-technical-export-${new Date().toISOString().slice(0, 10)}.json`);
  } catch (err) {
    console.error("Failed to export ICT technical package:", err);
    throw err;
  }
}

export function exportLibrarianPackage(): void {
  try {
    const metadata = createStandardExportHeader("Library");
    const payload = {
      metadata,
      data: {
        books: typeof window !== "undefined" ? localStorage.getItem("munyaka_library_books") || "[]" : "[]",
        allocations: typeof window !== "undefined" ? localStorage.getItem("munyaka_book_allocations") || "[]" : "[]",
        history: typeof window !== "undefined" ? localStorage.getItem("munyaka_library_history") || "[]" : "[]"
      }
    };
    triggerDownload(payload, `librarian-export-${new Date().toISOString().slice(0, 10)}.json`);
  } catch (err) {
    console.error("Failed to export librarian package:", err);
    throw err;
  }
}

export function exportStorekeeperPackage(): void {
  try {
    const metadata = createStandardExportHeader("Storekeeper");
    const payload = {
      metadata,
      data: {
        inventory: typeof window !== "undefined" ? localStorage.getItem("munyaka_store_inventory") || "[]" : "[]",
        requisitions: typeof window !== "undefined" ? localStorage.getItem("munyaka_store_requisitions") || "[]" : "[]"
      }
    };
    triggerDownload(payload, `storekeeper-export-${new Date().toISOString().slice(0, 10)}.json`);
  } catch (err) {
    console.error("Failed to export storekeeper package:", err);
    throw err;
  }
}

export function exportScienceLabPackage(): void {
  try {
    const metadata = createStandardExportHeader("Science Lab");
    const payload = {
      metadata,
      data: {
        equipment: typeof window !== "undefined" ? localStorage.getItem("munyaka_science_equipment") || "[]" : "[]",
        chemicals: typeof window !== "undefined" ? localStorage.getItem("munyaka_science_chemicals") || "[]" : "[]",
        experiments: typeof window !== "undefined" ? localStorage.getItem("munyaka_science_experiments") || "[]" : "[]"
      }
    };
    triggerDownload(payload, `science-lab-export-${new Date().toISOString().slice(0, 10)}.json`);
  } catch (err) {
    console.error("Failed to export science lab package:", err);
    throw err;
  }
}

export function exportClassPackage(streamName: string = "General", classData: any = {}): void {
  try {
    const metadata = createStandardExportHeader(streamName);
    const payload = {
      metadata,
      data: classData
    };
    triggerDownload(payload, `class-package-${streamName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`);
  } catch (err) {
    console.error("Failed to export class package:", err);
    throw err;
  }
}

const departmentExportService = {
  createStandardExportHeader,
  exportBursarPackage,
  exportICTTechnicalPackage,
  exportLibrarianPackage,
  exportStorekeeperPackage,
  exportScienceLabPackage,
  exportClassPackage,
};

export default departmentExportService;
