// Kredit Tanpa Agunan PUAS - Pinjaman Usaha Amanah Sejahtera
// Reference Data and Calculator matching the official PUAS brochure image

export interface LoanTariffRow {
  credit: number;
  savings: {
    6: number;
    12: number;
    24: number;
  };
  installment: {
    6: number;
    12: number;
    24: number;
  };
}

// Exact data mapping from the uploaded image
export const PUAS_TARIFF_TABLE: LoanTariffRow[] = [
  {
    credit: 1000000,
    savings: { 6: 10000, 12: 10000, 24: 5000 },
    installment: { 6: 186667, 12: 103334, 24: 61667 }
  },
  {
    credit: 1500000,
    savings: { 6: 15000, 12: 10000, 24: 5000 },
    installment: { 6: 280000, 12: 155000, 24: 92500 }
  },
  {
    credit: 2000000,
    savings: { 6: 20000, 12: 15000, 24: 10000 },
    installment: { 6: 373334, 12: 206667, 24: 123334 }
  },
  {
    credit: 2500000,
    savings: { 6: 25000, 12: 15000, 24: 10000 },
    installment: { 6: 466667, 12: 258334, 24: 154167 }
  },
  {
    credit: 3000000,
    savings: { 6: 30000, 12: 20000, 24: 10000 },
    installment: { 6: 560000, 12: 310000, 24: 185000 }
  },
  {
    credit: 3500000,
    savings: { 6: 35000, 12: 20000, 24: 15000 },
    installment: { 6: 653334, 12: 361667, 24: 215834 }
  },
  {
    credit: 4000000,
    savings: { 6: 40000, 12: 25000, 24: 15000 },
    installment: { 6: 746667, 12: 413334, 24: 246667 }
  },
  {
    credit: 4500000,
    savings: { 6: 45000, 12: 25000, 24: 15000 },
    installment: { 6: 840000, 12: 465000, 24: 277500 }
  },
  {
    credit: 5000000,
    savings: { 6: 50000, 12: 30000, 24: 20000 },
    installment: { 6: 933334, 12: 516667, 24: 308334 }
  },
  {
    credit: 5500000,
    savings: { 6: 55000, 12: 30000, 24: 20000 },
    installment: { 6: 1026667, 12: 568334, 24: 339167 }
  },
  {
    credit: 6000000,
    savings: { 6: 60000, 12: 35000, 24: 20000 },
    installment: { 6: 1120000, 12: 620000, 24: 370000 }
  },
  {
    credit: 6500000,
    savings: { 6: 65000, 12: 35000, 24: 20000 },
    installment: { 6: 1213334, 12: 671667, 24: 400834 }
  },
  {
    credit: 7000000,
    savings: { 6: 70000, 12: 40000, 24: 25000 },
    installment: { 6: 1306667, 12: 723334, 24: 431667 }
  },
  {
    credit: 7500000,
    savings: { 6: 70000, 12: 40000, 24: 25000 },
    installment: { 6: 1400000, 12: 775000, 24: 462500 }
  },
  {
    credit: 8000000,
    savings: { 6: 75000, 12: 45000, 24: 25000 },
    installment: { 6: 1493334, 12: 826667, 24: 493334 }
  },
  {
    credit: 8500000,
    savings: { 6: 80000, 12: 45000, 24: 30000 },
    installment: { 6: 1586667, 12: 878334, 24: 524167 }
  },
  {
    credit: 9000000,
    savings: { 6: 85000, 12: 50000, 24: 30000 },
    installment: { 6: 1680000, 12: 930000, 24: 555000 }
  },
  {
    credit: 9500000,
    savings: { 6: 90000, 12: 50000, 24: 30000 },
    installment: { 6: 1773334, 12: 981667, 24: 585834 }
  },
  {
    credit: 10000000,
    savings: { 6: 95000, 12: 55000, 24: 35000 },
    installment: { 6: 1866667, 12: 1033334, 24: 616667 }
  }
];

/**
 * Calculate estimated monthly installment and daily savings for any given credit amount and tenor.
 * If the credit is in our exact brochure table, we pull standard tariff values.
 * Otherwise, we calculate dynamically using the official flat interest formula:
 * 
 * 1. Installment: (Credit / Tenor) + (Credit * 2% flat per month)
 * 2. Daily Savings: 
 *    - 6 Bulan: ~ 1% of Credit (Max 95,000) or customized scale
 *    - 12 Bulan: ~ (Credit / 1,000,000) * 5,000 + 5,000
 *    - 24 Bulan: scaled based on 12 Bulan (~60% of 12 Bulan value)
 */
export function calculatePUASKredit(credit: number, termMonths: number): {
  monthlyInstallment: number;
  dailySavings: number;
  isBrochureMatch: boolean;
} {
  // Try to match standard brochure values
  const matched = PUAS_TARIFF_TABLE.find(row => row.credit === credit);
  const termKey = termMonths === 6 || termMonths === 12 || termMonths === 24 ? termMonths : null;

  if (matched && termKey) {
    return {
      monthlyInstallment: matched.installment[termKey],
      dailySavings: matched.savings[termKey],
      isBrochureMatch: true
    };
  }

  // Fallback / Dynamic formula if not in table or custom tenor
  // Formula: (Credit / Tenor) + (Credit * 2% flat per month)
  const monthlyPrincipal = credit / termMonths;
  const monthlyInterest = credit * 0.02; // 2% flat per month (24% flat per year)
  const monthlyInstallment = Math.round(monthlyPrincipal + monthlyInterest);

  // Fallback for daily savings estimation
  let dailySavings = 0;
  if (termMonths <= 6) {
    // 6 Bulan scale
    dailySavings = Math.round((credit / 1000000) * 10000);
    if (credit > 7000000) {
      dailySavings = Math.min(95000, Math.round((credit / 1000000) * 10000 - 5000));
    }
  } else if (termMonths <= 12) {
    // 12 Bulan scale
    dailySavings = Math.floor(credit / 1000000) * 5000 + 5000;
  } else {
    // 24 Bulan or longer
    const base12 = Math.floor(credit / 1000000) * 5000 + 5000;
    dailySavings = Math.round(base12 * 0.6 / 5000) * 5000; // round to nearest 5k
    if (dailySavings < 5000) dailySavings = 5000;
  }

  return {
    monthlyInstallment,
    dailySavings,
    isBrochureMatch: false
  };
}
