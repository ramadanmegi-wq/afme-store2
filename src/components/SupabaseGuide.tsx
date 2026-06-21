import { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, Code2, AlertCircle } from 'lucide-react';
import { SUPABASE_FULL_SQL_SCHEMA } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

export default function SupabaseGuide() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_FULL_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Introduction Hero */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row gap-5 items-start md:items-center">
        <div className="p-4 bg-indigo-950/60 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10 shrink-0">
          <Database size={30} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Infrastruktur Cloud Database Supabase (Production Ready)
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
            Aplikasi AFM Store telah terintegrasi penuh ke cloud PostgreSQL Supabase secara murni! 
            Saat kredensial diatur, sistem segera memanfaatkan kueri relasional asinkron, RLS aman, dan pelaporan keuangan real-time. 
            Semua data tabel diselaraskan presisi dengan standardisasi tabel bisnis POS HP, aksesoris, reparasi serta pengeluaran operasional.
          </p>
        </div>
      </div>

      {/* Grid: Instructions & Dev Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Step-by-Step Instructions (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-md space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Code2 size={16} className="text-indigo-400" /> Panduan Inisialisasi Cloud
            </h3>

            <ol className="space-y-4 text-xs text-slate-300 list-decimal pl-4 leading-normal">
              <li>
                <p className="font-bold text-slate-100">Buat Database Cloud Baru</p>
                <p className="text-slate-400 mt-1">Daftar secara gratis di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-bold">supabase.com <ExternalLink size={10} /></a> kemudian buat project baru dengan nama <code>AFM STORE</code>.</p>
              </li>
              <li>
                <p className="font-bold text-slate-100">Eksekusi Script SQL</p>
                <p className="text-slate-400 mt-1">Tekan tombol <b>"Salin SQL"</b> di panel sebelah kanan, buka dashboard Supabase Anda, masuk ke menu <b>SQL Editor</b>, paste script tersebut, lalu klik tombol <b>Run</b>.</p>
              </li>
              <li>
                <p className="font-bold text-slate-100">Setel Secrets di AI Studio</p>
                <p className="text-slate-400 mt-1">Ambil kredensial API Anda di Supabase (Settings / API) dan isikan ke panel secrets lingkungan:</p>
                <div className="bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[10.5px] p-2.5 rounded-xl mt-1.5 whitespace-pre select-all leading-relaxed">
{`VITE_SUPABASE_URL=https://your-proj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...`}
                </div>
              </li>
              <li>
                <p className="font-bold text-slate-100">Gunakan Akun Pengguna Bawaan</p>
                <p className="text-slate-400 mt-1">Setelah tabel terbentuk di database, Anda dapat langsung masuk ke kasir dan admin menggunakan data akun default berikut:</p>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[10.5px] text-slate-400 space-y-1">
                  <p>• Account Owner: <span className="text-amber-400">megi</span> / <span className="text-indigo-400">megipassword</span></p>
                  <p>• Account Admin: <span className="text-indigo-455">admin</span> / <span className="text-indigo-400">adminpassword</span></p>
                  <p>• Account Kasir: <span className="text-emerald-400">karyawan</span> / <span className="text-indigo-400">staffpassword</span></p>
                </div>
              </li>
            </ol>

            <div className={`p-4 rounded-2xl flex items-start gap-2.5 border text-[11px] leading-relaxed ${
              isSupabaseConfigured 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20' 
                : 'bg-amber-955/40 text-amber-300 border-amber-500/20'
            }`}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Status Konektivitas Saat Ini:</p>
                <p className="mt-0.5 text-[11px]">
                  {isSupabaseConfigured 
                    ? 'Selamat! Aplikasi aktif terhubung dengan aman menggunakan database produksi Supabase Anda.' 
                    : 'Aplikasi saat ini berjalan offline menggunakan sandbox Local Storage browser.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 border border-slate-800 text-[11px] leading-relaxed space-y-2">
              <p className="font-bold text-amber-400 flex items-center gap-1">
                <AlertCircle size={13} /> Sudah Punya Database Terbuat?
              </p>
              <p>
                Jika tabel <code>transactions</code> Anda sudah terbentuk sebelumnya, silakan jalankan SQL kueri berikut di editor Supabase Anda agar identitas profil pelanggan asinkron terekam:
              </p>
              <pre className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[10px] text-emerald-400 font-mono select-all leading-normal whitespace-pre-wrap">
{`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) DEFAULT 'Pelanggan Umum';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50) DEFAULT '08123456789';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cashier_name VARCHAR(100) DEFAULT 'Staff AFME';`}
              </pre>
            </div>
          </div>
        </div>

        {/* SQL Script View (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-lg overflow-hidden flex flex-col h-full">
            
            <div className="bg-slate-950 px-5 py-4 flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-300">afm_store_init_supabase.sql</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl font-bold transition-all shrink-0 cursor-pointer shadow-md shadow-indigo-605/10"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400 animate-pulse" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Salin SQL
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950/60 p-4 overflow-x-auto flex-1 max-h-[480px]">
              <pre className="text-emerald-400 font-mono text-[10.5px] leading-relaxed select-all">
                {SUPABASE_FULL_SQL_SCHEMA}
              </pre>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
