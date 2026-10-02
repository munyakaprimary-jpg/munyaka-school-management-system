/**
 * Department Export Service
 * Provides clean named exports for Bursar, ICT, Store, Science Lab, and Librarian
 * with robust metadata inclusion and safe fallback handlers.
 */

export interface ExportMetadata {
  senderName: string;
  staffId: string;
  department: string;
  timestamp: string;
}

function getSafeSenderMetadata(defaultDepartment: string): ExportMetadata {
  let senderName = "Staff Member";
  let staffId = "STF-001";
  let department = defaultDepartment;

  try {
    const rawUser = localStorage.getItem("currentUser") || localStorage.getItem("user") || localStorage.getItem("staffUser");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed) {
        senderName = parsed.fullName || parsed.name || parsed.username || senderName;
        staffId = parsed.staffId || parsed.id || parsed.employeeId || staffId;
        department = parsed.department || parsed.role || department;
      }
    }
  } catch {
    // Fallback on JSON parse error or security restriction
  }

  return {
    senderName,
    staffId,
    department,
    timestamp: new Date().toISOString(),
  };
}

export function exportBursarData(extraData: Record<string, any> = {}) {
  const metadata = getSafeSenderMetadata("Bursar");
  const payload = {
    metadata,
    department: "Bursar",
    feesCollection: JSON.parse(localStorage.getItem("feesCollection") || "[]"),
    invoices: JSON.parse(localStorage.getItem("invoices") || "[]"),
    expenses: JSON.parse(localStorage.getItem("expenses") || "[]"),
    ...extraData,
  };
  downloadJson(payload, `bursar-export-${new Date().toISOString().slice(0, 10)}.json`);
  return payload;
}

export function exportICTData(extraData: Record<string, any> = {}) {
  const metadata = getSafeSenderMetadata("ICT");
  const payload = {
    metadata,
    department: "ICT",
    devices: JSON.parse(localStorage.getItem("ict_devices") || "[]"),
    networkLogs: JSON.parse(localStorage.getItem("ict_network_logs") || "[]"),
    maintenanceTickets: JSON.parse(localStorage.getItem("ict_maintenance_tickets") || "[]"),
    ...extraData,
  };
  downloadJson(payload, `ict-export-${new Date().toISOString().slice(0, 10)}.json`);
  return payload;
}

export function exportStoreData(extraData: Record<string, any> = {}) {
  const metadata = getSafeSenderMetadata("Store");
  const payload = {
    metadata,
    department: "Store",
    inventory: JSON.parse(localStorage.getItem("inventory_items") || "[]"),
    issuances: JSON.parse(localStorage.getItem("inventory_issuances") || "[]"),
    deliveries: JSON.parse(localStorage.getItem("inventory_deliveries") || "[]"),
    ...extraData,
  };
  downloadJson(payload, `store-export-${new Date().toISOString().slice(0, 10)}.json`);
  return payload;
}

export function exportScienceLabData(extraData: Record<string, any> = {}) {
  const metadata = getSafeSenderMetadata("Science Lab");
  const payload = {
    metadata,
    department: "Science Lab",
    chemicals: JSON.parse(localStorage.getItem("science_chemicals") || "[]"),
    equipment: JSON.parse(localStorage.getItem("science_equipment") || "[]"),
    practicalSessions: JSON.parse(localStorage.getItem("science_practical_sessions") || "[]"),
    ...extraData,
  };
  downloadJson(payload, `science-lab-export-${new Date().toISOString().slice(0, 10)}.json`);
  return payload;
}

export function exportLibrarianData(extraData: Record<string, any> = {}) {
  const metadata = getSafeSenderMetadata("Librarian");
  const payload = {
    metadata,
    department: "Librarian",
    books: JSON.parse(localStorage.getItem("library_books") || "[]"),
    issuances: JSON.parse(localStorage.getItem("library_issuances") || "[]"),
    returns: JSON.parse(localStorage.getItem("library_returns") || "[]"),
    ...extraData,
  };
  downloadJson(payload, `librarian-export-${new Date().toISOString().slice(0, 10)}.json`);
  return payload;
}

function downloadJson(data: any, filename: string) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to download JSON export:", err);
  }
}
