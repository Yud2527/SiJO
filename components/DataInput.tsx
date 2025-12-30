import React, { useState, useEffect } from 'react';
import { Upload, Clipboard, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import * as XLSX from 'xlsx';

interface DataInputProps {
  title: string;
  placeholder: string;
  type: 'COA' | 'TXN';
  onDataParsed: (data: any[]) => void;
  parser: (text: string) => any[];
  sampleData: string;
  currentCount?: number; // Sync with parent state
}

export const DataInput: React.FC<DataInputProps> = ({ 
  title, 
  placeholder, 
  onDataParsed, 
  parser,
  sampleData,
  currentCount = 0
}) => {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [parseError, setParseError] = useState<boolean>(false);
  const [localCount, setLocalCount] = useState(0);

  // Sync internal count with parent if text is empty (e.g. returning from another view)
  useEffect(() => {
    if (text === '' && currentCount > 0) {
        setLocalCount(currentCount);
    }
  }, [currentCount, text]);

  // Debounce logic: processing data only after user stops typing for 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
        if (!text) return; // Don't process empty string from init

        setParseError(false);
        try {
            const parsed = parser(text);
            setLocalCount(parsed.length);
            onDataParsed(parsed);
            
            // If text exists but 0 items parsed, show warning (unless text is short/whitespace)
            if (text.trim().length > 10 && parsed.length === 0) {
                setParseError(true);
            }
        } catch (e) {
            console.error("Parsing error", e);
            setParseError(true);
            setLocalCount(0);
            onDataParsed([]);
        }
    }, 500); // 500ms delay

    return () => {
        clearTimeout(handler);
    };
  }, [text, parser, onDataParsed]);

  // Update local state immediately for responsive UI
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSample = () => {
    setText(sampleData); // Effect will handle parsing
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            
            // Convert to TSV for safest textarea representation
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });
            
            if (jsonData && jsonData.length > 0) {
                // Filter out empty rows
                const validRows = jsonData.filter((row: any) => Array.isArray(row) && row.length > 0);
                const tsv = validRows.map((row: any) => row.join('\t')).join('\n');
                setText(tsv); // Effect will handle parsing
                setActiveTab('paste');
            }
        };
        reader.readAsBinaryString(file);
    } catch (err) {
        console.error("File upload error", err);
        alert("Gagal membaca file. Pastikan format Excel valid.");
    }
  };

  return (
    <div className={clsx(
        "bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300",
        parseError ? "border-red-300 shadow-red-100" : "border-slate-200 hover:shadow-md"
    )}>
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          {title}
        </h3>
        {localCount > 0 ? (
          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
            {localCount} data loaded
          </span>
        ) : (
           <span className="text-xs text-slate-400">0 data</span>
        )}
      </div>
      
      <div className="p-2 flex gap-2 border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('paste')}
          className={clsx(
            "flex-1 text-xs py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'paste' 
              ? "bg-white shadow-sm border border-slate-200 text-brand-600" 
              : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Clipboard className="w-3 h-3" /> Paste Text
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={clsx(
            "flex-1 text-xs py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'upload' 
              ? "bg-white shadow-sm border border-slate-200 text-brand-600" 
              : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Upload className="w-3 h-3" /> Upload Excel
        </button>
      </div>

      <div className="flex-1 p-0 relative bg-slate-50/30">
        {activeTab === 'paste' ? (
          <div className="relative h-full flex flex-col">
             <textarea
              className={clsx(
                  "w-full h-48 sm:h-64 p-4 text-xs font-mono border-0 focus:ring-0 outline-none resize-y bg-transparent leading-relaxed",
                  parseError && "bg-red-50/50"
              )}
              placeholder={placeholder}
              value={text}
              onChange={handleTextChange}
              spellCheck={false}
            />
            {parseError && (
                <div className="absolute bottom-2 left-2 right-16 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Format tidak dikenali. Gunakan Tab, Koma, atau Titik Koma sebagai pemisah.</span>
                </div>
            )}
            {text.length === 0 && localCount === 0 && (
                <button 
                    onClick={handleSample}
                    className="absolute bottom-4 right-4 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-md text-brand-600 hover:text-brand-700 hover:border-brand-300 shadow-sm transition-all z-10"
                >
                    Pakai Data Contoh
                </button>
            )}
            {localCount > 0 && text.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-[1px] pointer-events-none">
                    <p className="text-sm text-slate-400 font-medium">Data tersimpan di memori ({localCount} baris)</p>
                </div>
            )}
          </div>
        ) : (
          <div className="h-48 sm:h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 m-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
            <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
            />
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6 text-brand-500" />
            </div>
            <p className="text-sm text-slate-700 font-medium">Klik untuk upload file</p>
            <p className="text-xs text-slate-400 mt-1">Excel (.xlsx) atau CSV</p>
          </div>
        )}
      </div>
    </div>
  );
};
