export interface LoanApplication {
  id: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  amount: number;
  termMonths: number;
  purpose: string;
  monthlyIncome: number;
  status: "Pending" | "Disetujui" | "Ditolak" | "Sedang Ditinjau" | "BATAL";
  createdAt: string;
  adminNotes: string;
  kantor: string;
  statusPemrosesan: string;
  rowIndex?: number;
  accAmount?: number;
}

export interface BankStats {
  totalApplications: number;
  totalRequestedAmount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  reviewCount: number;
  batalCount: number;
  averageIncome: number;
  averageLoanAmount: number;
}

export interface SpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}
