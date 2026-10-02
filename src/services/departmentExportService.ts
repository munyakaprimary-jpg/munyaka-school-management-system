/**
 * Standard department export service
 * Provides robust export helper functions for Bursar, ICT, and Librarian portals
 * without top-level localStorage calls or module evaluation issues.
 */

export function exportBursarPackage(): void {
  try {
    const data = {
      department: "Bursar",
      exportedAt: new Date().toISOString(),
      fees: typeof window !== "undefined" ? localStorage.getItem("munyaka_fees") || "[]" : "[]",
      transactions: typeof window !== "undefined" ? localStorage.getItem("munyaka_transactions") || "[]" : "[]",
      invoices: typeof window !== "undefined" ? localStorage.getItem("munyaka_invoices") || "[]" : "[]"
    };
    
    if (typeof document !== "undefined") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bursar-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Failed to export bursar package:", err);
    throw err;
  }
}

export function exportICTTechnicalPackage(): void {
  try {
    const data = {
      department: "ICT Technical",
      exportedAt: new Date().toISOString(),
      assets: typeof window !== "undefined" ? localStorage.getItem("munyaka_ict_assets") || "[]" : "[]",
      devices: typeof window !== "undefined" ? localStorage.getItem("munyaka_connected_devices") || "[]" : "[]",
      maintenance: typeof window !== "undefined" ? localStorage.getItem("munyaka_maintenance_logs") || "[]" : "[]"
    };
    
    if (typeof document !== "undefined") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ict-technical-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Failed to export ICT technical package:", err);
    throw err;
  }
}

export function exportLibrarianPackage(): void {
  try {
    const data = {
      department: "Library",
      exportedAt: new Date().toISOString(),
      books: typeof window !== "undefined" ? localStorage.getItem("munyaka_library_books") || "[]" : "[]",
      allocations: typeof window !== "undefined" ? localStorage.getItem("munyaka_book_allocations") || "[]" : "[]",
      history: typeof window !== "undefined" ? localStorage.getItem("munyaka_library_history") || "[]" : "[]"
    };
    
    if (typeof document !== "undefined") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `librarian-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Failed to export librarian package:", err);
    throw err;
  }
}

const departmentExportService = {
  exportBursarPackage,
  exportICTTechnicalPackage,
  exportLibrarianPackage,
};

export default departmentExportService;
