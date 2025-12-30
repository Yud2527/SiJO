import { COAItem, TransactionItem, JournalEntry, JournalLine } from "../types";

/**
 * LOCAL SMART HEURISTICS ENGINE (100% Offline)
 * Berfungsi sebagai "Logic Builder" yang memproses transaksi secara lokal 
 * berdasarkan pemetaan kata kunci akuntansi yang luas.
 */

const ACCOUNT_KEYWORDS: Record<string, string[]> = {
  'Beban Listrik & Air': ['listrik', 'pln', 'token', 'pdam', 'air', 'telkom', 'wifi', 'internet'],
  'Beban Gaji': ['gaji', 'payroll', 'salary', 'bonus', 'insentif', 'thr'],
  'Beban Administrasi Bank': ['admin', 'biaya bank', 'adm', 'provisi', 'meterai'],
  'Beban Sewa': ['sewa', 'rent', 'kontrak', 'leasing'],
  'Beban Iklan': ['iklan', 'ads', 'facebook', 'google', 'marketing', 'promo'],
  'Beban Perlengkapan Kantor': ['kertas', 'tinta', 'stationery', 'atk', 'perlengkapan', 'fotocopy'],
  'Beban Kendaraan': ['bensin', 'bbm', 'pertamina', 'shell', 'parkir', 'tol', 'service', 'oli'],
  'Pendapatan Jasa': ['jasa', 'konsultasi', 'fee', 'service income'],
  'Pendapatan Penjualan': ['penjualan', 'sales', 'dagang', 'invoice', 'inv-'],
  'Piutang Usaha': ['pelunasan', 'piutang', 'ar', 'receivable'],
  'Utang Usaha': ['pembayaran utang', 'ap', 'payable', 'vendor'],
};

export const generateJournalsWithAI = async (
  coa: COAItem[],
  transactions: TransactionItem[]
): Promise<JournalEntry[]> => {
  // Simulasi proses lokal yang sangat cepat
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!transactions.length || !coa.length) return [];

  // Cari akun Bank/Kas utama sebagai default
  const bankAccount = coa.find(c => 
    c.name.toLowerCase().includes('bank') || 
    c.name.toLowerCase().includes('kas')
  ) || coa[0];

  return transactions.map((t) => {
    const descLower = t.description.toLowerCase();
    let match: COAItem | undefined;

    // 1. Heuristik berdasarkan Kamus Cerdas
    for (const [accountName, keywords] of Object.entries(ACCOUNT_KEYWORDS)) {
      if (keywords.some(k => descLower.includes(k))) {
        match = coa.find(c => c.name.toLowerCase() === accountName.toLowerCase());
        if (match) break;
      }
    }

    // 2. Jika tidak ada di kamus, cari kecocokan nama akun secara parsial di COA
    if (!match) {
      match = coa.find(c => 
        c.code !== bankAccount.code && 
        (descLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(descLower))
      );
    }

    // 3. Fallback: Cari akun beban pertama jika uang keluar, atau pendapatan jika uang masuk
    if (!match) {
      if (t.type === 'DB') {
        match = coa.find(c => c.category?.toLowerCase() === 'beban' || c.code.startsWith('6')) || coa[0];
      } else {
        match = coa.find(c => c.category?.toLowerCase() === 'pendapatan' || c.code.startsWith('4')) || coa[0];
      }
    }

    const lines: JournalLine[] = [];
    if (t.type === 'CR') {
      // Uang Masuk
      lines.push({ accountCode: bankAccount.code, accountName: bankAccount.name, debit: t.amount, credit: 0 });
      lines.push({ accountCode: match.code, accountName: match.name, debit: 0, credit: t.amount });
    } else {
      // Uang Keluar
      lines.push({ accountCode: match.code, accountName: match.name, debit: t.amount, credit: 0 });
      lines.push({ accountCode: bankAccount.code, accountName: bankAccount.name, debit: 0, credit: t.amount });
    }

    return {
      id: t.id,
      date: t.date,
      description: t.description,
      narration: `${t.type === 'CR' ? 'Penerimaan' : 'Pembayaran'} atas ${t.description}`,
      lines: lines,
      isValid: true
    };
  });
};