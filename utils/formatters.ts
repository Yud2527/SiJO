import { COAItem, TransactionItem } from "../types";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper to parse a CSV line respecting quotes
const splitLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, '')); // Push and clean quotes
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
};

const parseAmount = (raw: string): number => {
  if (!raw) return 0;
  
  // Remove currency symbols and cleanup
  let clean = raw.replace(/[Rp\s]/g, '');

  // Detect format:
  // ID format: 1.000.000,00 or 1.000.000
  // US format: 1,000,000.00 or 1,000,000
  
  const hasComma = clean.includes(',');
  const hasDot = clean.includes('.');

  if (hasComma && hasDot) {
    // Ambiguous, check last occurrence to determine decimal separator
    const lastCommaIndex = clean.lastIndexOf(',');
    const lastDotIndex = clean.lastIndexOf('.');
    
    if (lastCommaIndex > lastDotIndex) {
      // 1.000.000,00 -> ID Format
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,000,000.00 -> US Format
      clean = clean.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Could be 10,000 (US) or 10,50 (ID decimal)
    const parts = clean.split(',');
    if (parts.length > 2) {
      clean = clean.replace(/,/g, '');
    } else if (parts.length === 2 && parts[1].length === 2) {
       // Assume decimal 
       clean = clean.replace(',', '.');
    } else {
       // Assume thousands
       clean = clean.replace(/,/g, '');
    }
  } else if (hasDot) {
    // Could be 10.000 (ID) or 10.50 (US decimal)
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = clean.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 2) {
       // Assume decimal US
    } else {
       // Assume thousands ID
       clean = clean.replace(/\./g, '');
    }
  }
  
  return parseFloat(clean) || 0;
};

export const parseCOAInput = (input: string): COAItem[] => {
  if (!input) return [];
  const lines = input.trim().split(/\r?\n/);
  const items: COAItem[] = [];
  
  lines.forEach(line => {
    if (!line.trim()) return;

    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = splitLine(line, '\t');
    } else if (line.includes(';')) {
      parts = splitLine(line, ';');
    } else if (line.includes(',')) {
      parts = splitLine(line, ',');
    } else {
      // Fallback: Try splitting by multiple spaces if no other delimiter found
       parts = line.split(/\s{2,}/);
    }

    if (parts.length >= 2) {
      items.push({
        code: parts[0],
        name: parts[1],
        category: parts[2] || 'General'
      });
    }
  });
  return items;
};

export const parseTransactionInput = (input: string): TransactionItem[] => {
  if (!input) return [];
  const lines = input.trim().split(/\r?\n/);
  const items: TransactionItem[] = [];
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;

    // Detect delimiter
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = splitLine(line, '\t');
    } else if (line.includes(';')) {
      parts = splitLine(line, ';');
    } else if (line.includes(',')) {
      parts = splitLine(line, ',');
    } else {
       // Fallback: Try splitting by multiple spaces (common in PDF copy paste)
       parts = line.split(/\s{2,}/);
    }

    if (parts.length >= 3) {
      const date = parts[0];
      const desc = parts[1];
      const amountRaw = parts[2];
      let typeRaw = parts[3];

      const amount = parseAmount(amountRaw);
      
      // Infer Type if missing or invalid
      let type: 'DB' | 'CR' = 'DB';
      if (typeRaw) {
        const t = typeRaw.toUpperCase().trim();
        if (t === 'CR' || t === 'K' || t === 'CREDIT' || t === 'KREDIT') type = 'CR';
        else if (t === 'DB' || t === 'D' || t === 'DEBIT') type = 'DB';
      } 
      
      items.push({
        id: `TXN-${index + 1}`,
        date: date,
        description: desc,
        amount: amount,
        type: type
      });
    }
  });
  return items;
};
