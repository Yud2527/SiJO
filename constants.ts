import { COAItem } from './types';

export const DEFAULT_COA: COAItem[] = [
  { code: '1-1001', name: 'Kas Besar', category: 'Aset' },
  { code: '1-1002', name: 'Bank BCA', category: 'Aset' },
  { code: '1-1003', name: 'Bank Mandiri', category: 'Aset' },
  { code: '2-1001', name: 'Utang Usaha', category: 'Liabilitas' },
  { code: '4-1001', name: 'Pendapatan Jasa', category: 'Pendapatan' },
  { code: '4-1002', name: 'Pendapatan Penjualan', category: 'Pendapatan' },
  { code: '6-1001', name: 'Beban Gaji', category: 'Beban' },
  { code: '6-1002', name: 'Beban Sewa', category: 'Beban' },
  { code: '6-1003', name: 'Beban Listrik & Air', category: 'Beban' },
  { code: '6-1004', name: 'Beban Iklan', category: 'Beban' },
  { code: '6-1005', name: 'Beban Administrasi Bank', category: 'Beban' },
  { code: '6-1006', name: 'Beban Perlengkapan Kantor', category: 'Beban' },
];

export const MOCK_TRANSACTIONS = `01/10/2023	Biaya Admin Bank	15000	DB
02/10/2023	Pembayaran Invoice #Inv-001 PT Maju	25000000	CR
03/10/2023	Beli Kertas & Tinta Printer	450000	DB
05/10/2023	Bayar Listrik Bulan Sept	1200000	DB
10/10/2023	Terima Jasa Konsultasi	5000000	CR`;
