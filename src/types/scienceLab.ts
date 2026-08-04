export type HazardLevel = "Low" | "Medium" | "High";
export type BookingStatus = "Pending" | "Approved" | "Completed";
export type BreakageStatus = "Pending" | "Paid" | "Waived";

export interface ChemicalItem {
  id: string;
  name: string;
  formula: string;
  quantity: number;
  unit: string;
  location: string;
  expiryDate: string; // ISO date string
  hazardLevel: HazardLevel;
  minThreshold: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  totalQty: number;
  functionalQty: number;
  damagedQty: number;
  location: string;
}

export interface LabBooking {
  id: string;
  date: string; // ISO date string
  timeSlot: string; // e.g., "08:00-09:30"
  teacher: string;
  gradeClass: string;
  topic: string;
  itemsRequested: string[]; // array of item names/IDs
  status: BookingStatus;
}

export interface BreakageLog {
  id: string;
  date: string; // ISO date string
  studentName: string;
  admNo: string;
  gradeClass: string;
  itemBroken: string;
  qty: number;
  cost: number;
  status: BreakageStatus;
}