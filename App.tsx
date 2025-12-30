
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Bot, 
  FileText, 
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  LogOut,
  Lock,
  Database,
  Zap,
  BarChart3,
  MousePointerClick
} from 'lucide-react';
import { Button } from './components/Button';
import { DataInput } from './components/DataInput';
import { JournalTable } from './components/JournalTable';
import { AppState, COAItem, TransactionItem, JournalEntry, ProcessingStatus } from './types';
import { parseCOAInput, parseTransactionInput } from './utils/formatters';
import { DEFAULT_COA, MOCK_TRANSACTIONS } from './constants';
import { generateJournalsWithAI } from './services/geminiService';

// --- Components ---

interface NavbarProps {
    view: AppState;
    setView: (view: AppState) => void;
    handleLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ view, setView, handleLogout }) => (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppState.LANDING)}>
                <div className="bg-brand-600 p-1.5 rounded-lg shadow-lg shadow-brand-500/30">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
                    SiJO
                </span>
            </div>
            {view === AppState.LANDING ? (
                <div className="flex items-center gap-6">
                    <span className="hidden md:block text-sm font-medium text-slate-500 hover:text-brand-600 cursor-pointer transition-colors">Fitur</span>
                    <span className="hidden md:block text-sm font-medium text-slate-500 hover:text-brand-600 cursor-pointer transition-colors">Keamanan</span>
                    <Button size="sm" onClick={() => setView(AppState.APP)} className="rounded-full px-6">
                        Buka Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-brand-100 shadow-sm">
                        <Zap className="w-3 h-3 fill-brand-500 text-brand-500" />
                        <span>Smart Processing Active</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleLogout}
                        className="text-slate-600 hover:text-red-600 hover:bg-red-50 font-bold"
                    >
                        Keluar <LogOut className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    </nav>
);

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => (
    <div className="min-h-screen pt-16 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-50 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative">
            <div className="absolute top-20 right-10 w-64 h-64 bg-brand-200/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
            
            <div className="text-center max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-brand-100 text-brand-700 text-xs font-bold uppercase tracking-widest shadow-md">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span>SiJO (Sistem Jurnal Otomatis)</span>
                </div>
                
                <h1 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
                    PLATFORM JURNAL OTOMATIS<br/>
                    <span className="text-brand-600 bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-blue-600">BERBASIS HEURISTIC ENGINE</span>
                </h1>
                
                <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-medium">
                    Solusi mutakhir untuk mengonversi data rekening koran menjadi entri jurnal akuntansi yang presisi secara instan. Mengoptimalkan produktivitas tim keuangan melalui logika pemrosesan lokal yang cerdas.
                </p>
                
                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <Button size="lg" onClick={onStart} className="shadow-2xl shadow-brand-500/40 hover:scale-105 transition-all px-14 py-8 text-xl rounded-2xl group font-black">
                        Mulai Automasi <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-32">
                {[
                    {
                        icon: <Database className="w-6 h-6 text-brand-600" />,
                        title: "Local Computing",
                        desc: "Seluruh proses kalkulasi heuristik dilakukan di browser Anda untuk memastikan kecepatan akses tanpa hambatan server."
                    },
                    {
                        icon: <Sparkles className="w-6 h-6 text-brand-600" />,
                        title: "Logic Mapping",
                        desc: "Mapping transaksi cerdas yang menyesuaikan dengan pola deskripsi keuangan untuk akurasi penjurnalan maksimal."
                    },
                    {
                        icon: <Lock className="w-6 h-6 text-brand-600" />,
                        title: "Data Confidentiality",
                        desc: "Keamanan informasi adalah pilar utama. SiJO dirancang sebagai utilitas mandiri yang menjaga data tetap di tangan Anda."
                    }
                ].map((f, i) => (
                    <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all hover:-translate-y-2 group">
                        <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-brand-600 group-hover:scale-110 transition-all">
                            <div className="group-hover:text-white transition-colors">{f.icon}</div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">{f.title}</h3>
                        <p className="text-slate-500 leading-relaxed text-lg">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<AppState>(AppState.LANDING);
  const [coaData, setCoaData] = useState<COAItem[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sijo_journals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setJournals(parsed);
        if (parsed.length > 0) setStatus(ProcessingStatus.COMPLETED);
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleGenerate = async () => {
    if (coaData.length === 0 || transactionData.length === 0) {
        setError("Silakan isi COA dan Data Transaksi terlebih dahulu.");
        return;
    }
    setError(null);
    setStatus(ProcessingStatus.PROCESSING);
    try {
      const results = await generateJournalsWithAI(coaData, transactionData);
      setJournals(results);
      localStorage.setItem('sijo_journals', JSON.stringify(results));
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err: any) {
      // Show actual error message for debugging
      console.error("Generate Error:", err);
      setError(err.message || "Gagal memproses data secara lokal.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const handleLogout = () => {
      setCoaData([]);
      setTransactionData([]);
      setJournals([]);
      setStatus(ProcessingStatus.IDLE);
      setError(null);
      localStorage.removeItem('sijo_journals');
      localStorage.clear();
      setView(AppState.LANDING);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar view={view} setView={setView} handleLogout={handleLogout} />
      
      {view === AppState.LANDING ? (
        <LandingPage onStart={() => setView(AppState.APP)} />
      ) : (
        <div className="min-h-screen pt-24 pb-16 bg-slate-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-2 border border-brand-100">
                           <MousePointerClick className="w-3 h-3" /> Dashboard Kerja
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Automasi Jurnal Pintar</h1>
                        <p className="text-slate-500 text-sm">SiJO (Sistem Jurnal Otomatis) – Efisiensi akuntansi dalam satu klik.</p>
                    </div>
                    {status === ProcessingStatus.COMPLETED && (
                        <div className="text-xs bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold border border-green-200 flex items-center gap-2 shadow-sm">
                           <CheckCircle className="w-4 h-4" /> {journals.length} Entri Berhasil Diformat
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <DataInput 
                        title="1. Database Akun (COA)"
                        placeholder="Paste daftar COA Anda di sini..."
                        type="COA"
                        parser={parseCOAInput}
                        onDataParsed={setCoaData}
                        sampleData={DEFAULT_COA.map(c => `${c.code}\t${c.name}\t${c.category}`).join('\n')}
                        currentCount={coaData.length}
                    />
                    <DataInput 
                        title="2. Input Mutasi Bank"
                        placeholder="Paste mutasi rekening koran Anda..."
                        type="TXN"
                        parser={parseTransactionInput}
                        onDataParsed={setTransactionData}
                        sampleData={MOCK_TRANSACTIONS}
                        currentCount={transactionData.length}
                    />
                </div>

                <div className="flex flex-col items-center gap-4 py-10">
                    {error && <div className="text-red-600 text-sm bg-red-50 px-6 py-3 rounded-xl border border-red-200 flex items-center gap-2 max-w-2xl text-center">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                    </div>}
                    <Button 
                        size="lg" 
                        className="w-full max-w-lg h-16 text-xl shadow-2xl shadow-brand-500/30 font-extrabold rounded-2xl transition-all active:scale-95"
                        onClick={handleGenerate}
                        isLoading={status === ProcessingStatus.PROCESSING}
                    >
                        Generate Jurnal Otomatis <Sparkles className="ml-2 w-6 h-6" />
                    </Button>
                    <p className="text-slate-400 text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Diproses menggunakan Gemini 3 Flash.
                    </p>
                </div>

                <JournalTable journals={journals} />
            </div>
        </div>
      )}
      
      <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-6 text-slate-300">
                <Lock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Financial Utility</span>
            </div>
            <p className="text-slate-900 text-sm font-bold">SiJO – Sistem Jurnal Otomatis</p>
            <p className="text-slate-500 text-xs mt-1">Develop by Yudi Agus Setiawan</p>
            <p className="text-[10px] text-slate-400 mt-4">&copy; {new Date().getFullYear()} Hak Cipta Terlindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
