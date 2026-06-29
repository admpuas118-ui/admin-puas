export interface LoanApplication {
  id: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  amount: number;
  termMonths: number;
  purpose: string;
  monthlyIncome: number;
  status: "Pending" | "Disetujui" | "Ditolak" | "Sedang Ditinjau";
  createdAt: string;
  adminNotes: string;
  kantor: string;
  statusPemrosesan: string;
  rowIndex?: number;
}

export interface BankStats {
  totalApplications: number;
  totalRequestedAmount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  reviewCount: number;
  averageIncome: number;
  averageLoanAmount: number;
}

export interface SpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}
