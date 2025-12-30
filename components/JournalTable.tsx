import React from 'react';
import { JournalEntry } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Download, FileSpreadsheet, FileText, TableProperties, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface JournalTableProps {
  journals: JournalEntry[];
}

export const JournalTable: React.FC<JournalTableProps> = ({ journals }) => {
  if (journals.length === 0) return null;

  /**
   * Menghasilkan data flat sesuai spesifikasi impor sistem akuntansi
   */
  const getFlatData = () => {
      const flatData: any[] = [];
      
      journals.forEach((j, index) => {
        // Format nomor transaksi unik: JV-0001, JV-0002, dst (Tanpa tanda petik)
        const sequence = (index + 1).toString().padStart(4, '0');
        const txnNumber = `JV-${sequence}`; 
        
        // Tanggal tetap menggunakan petik satu agar Excel tidak merubah format tanggal secara otomatis
        const txnDate = `'${j.date}`;

        j.lines.forEach(line => {
          flatData.push({
            '*TransactionNumber': txnNumber,
            '*TransactionDate': txnDate,
            '*AccountCode': line.accountCode,
            'Description': line.accountName,
            '*Debit': line.debit || 0,
            '*Credit': line.credit || 0,
            'Memo': j.narration,
            'Tag': '', 
            'Currency': 'IDR',
            'Rate to Base': '' 
          });
        });
      });
      return flatData;
  }

  const handleExportExcel = () => {
    const flatData = getFlatData();
    const ws = XLSX.utils.json_to_sheet(flatData);
    
    const wscols = [
      { wch: 15 }, // Trans Number
      { wch: 18 }, // Date
      { wch: 15 }, // Account Code
      { wch: 30 }, // Description
      { wch: 15 }, // Debit
      { wch: 15 }, // Credit
      { wch: 40 }, // Memo
      { wch: 10 }, // Tag
      { wch: 10 }, // Currency
      { wch: 12 }, // Rate
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jurnal_Umum_Impor");
    XLSX.writeFile(wb, `SiJO_Export_${new Date().getTime()}.xlsx`);
  };

  const handleExportCSV = () => {
    const flatData = getFlatData();
    const ws = XLSX.utils.json_to_sheet(flatData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SiJO_Export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const timestamp = new Date().toLocaleString('id-ID');
    
    // Header Styling
    doc.setFillColor(3, 105, 161); // Brand Blue 700
    doc.rect(0, 0, 297, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("SiJO", 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Sistem Jurnal Otomatis", 15, 26);
    
    doc.setFontSize(14);
    doc.text("LAPORAN JURNAL UMUM", 282, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Dicetak: ${timestamp}`, 282, 26, { align: 'right' });

    // Table Content
    const tableBody = journals.flatMap((j) => {
      return j.lines.map((l, idx) => [
        idx === 0 ? j.date : "", // Hanya tampilkan tanggal di baris pertama transaksi
        l.accountCode, 
        l.accountName, 
        l.debit > 0 ? formatCurrency(l.debit) : "-", 
        l.credit > 0 ? formatCurrency(l.credit) : "-",
        idx === 0 ? j.narration : "" // Hanya tampilkan narasi di baris pertama
      ]);
    });

    autoTable(doc, {
      startY: 45,
      head: [['Tanggal', 'Kode Akun', 'Nama Akun', 'Debit', 'Kredit', 'Keterangan / Memo']],
      body: tableBody,
      theme: 'striped',
      headStyles: { 
        fillColor: [30, 41, 59], 
        textColor: [255, 255, 255],
        fontSize: 9, 
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [51, 65, 85],
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 60 },
        3: { cellWidth: 40, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' },
        5: { cellWidth: 'auto' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 15, right: 15 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            `Develop by Yudi Agus Setiawan | Halaman ${i} dari ${pageCount}`, 
            148.5, 200, 
            { align: 'center' }
        );
    }

    doc.save(`SiJO_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="bg-brand-50 p-3 rounded-xl">
             <FileText className="w-6 h-6 text-brand-600" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-900">Output Jurnal Umum</h2>
             <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
               <ShieldCheck className="w-3 h-3 text-green-500" /> 
               Format ekspor profesional & siap impor
             </p>
           </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="flex-1 md:flex-none rounded-xl">
            <TableProperties className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportExcel} className="flex-1 md:flex-none rounded-xl">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Export Excel
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportPDF} className="flex-1 md:flex-none shadow-lg shadow-brand-500/20 rounded-xl">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
              <tr>
                <th className="px-6 py-4">Keterangan / Akun</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {journals.map((journal, idx) => (
                <React.Fragment key={journal.id}>
                  <tr className="bg-slate-50/50">
                    <td colSpan={3} className="px-6 py-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800">{journal.date}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono">
                              REF: JV-{(idx + 1).toString().padStart(4, '0')}
                            </span>
                            <span className="text-slate-600 font-medium text-xs hidden sm:inline">— {journal.narration}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase bg-green-50 px-2 py-0.5 rounded border border-green-100">
                           <ShieldCheck className="w-3 h-3" /> Validated
                        </div>
                      </div>
                    </td>
                  </tr>
                  {journal.lines.map((line, lIdx) => (
                    <tr key={`${journal.id}-${lIdx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 pl-12">
                        <div className="flex flex-col">
                            <span className={`font-semibold ${line.credit > 0 ? 'ml-8 text-slate-600 italic' : 'text-slate-800'}`}>
                                {line.accountName}
                            </span>
                            <span className={`text-[10px] font-mono text-slate-400 ${line.credit > 0 ? 'ml-8' : ''}`}>
                                {line.accountCode}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-700">
                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-700">
                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};