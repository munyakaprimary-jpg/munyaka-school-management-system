export type ICTCategory = 'Laptops' | 'Tablets' | 'Projectors' | 'Networking' | 'Printers' | 'Other';
export type ICTStatus = 'Active' | 'In Maintenance' | 'Decommissioned';

export interface ICTAsset {
  id: string;
  assetTag: string;
  name: string;
  category: ICTCategory;
  serialNumber: string;
  status: ICTStatus;
  location: string;
  assignedTo?: string;
  lastMaintained?: string;
}