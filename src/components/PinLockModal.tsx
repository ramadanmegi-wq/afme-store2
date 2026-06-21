import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Shield, AlertCircle, Eye, EyeOff, User, UserCheck, KeyRound, Loader2, Sparkles } from 'lucide-react';
import { AppAccount } from '../types';
import { getAccounts } from '../db/mockDb';
import { getAppAccounts } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

interface PinLockModalProps {
  onUnlock: (account: AppAccount) => void;
}

export default function PinLockModal({ onUnlock }: PinLockModalProps) {
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load registered user accounts
  useEffect(() => {
    async function loadAccounts() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
          const dbAccounts = await getAppAccounts();
          if (dbAccounts && dbAccounts.length > 0) {
            setAccounts(dbAccounts);
            setSelectedUsername(dbAccounts[0].username);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Gagal mengambil data dari Supabase, fallback ke offline:', e);
      }
      
      const list = getAccounts();
      setAccounts(list);
      if (list.length > 0) {
        setSelectedUsername(list[0].username);
      }
      setIsLoading(false);
    }

    loadAccounts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUsername.trim()) {
      setErrorMsg('Silakan pilih profil akun Anda!');
      return;
    }

    if (!password) {
      setErrorMsg('Masukkan kata sandi/password keamanan!');
      return;
    }

    // Lookup matching account
    const matchedAccount = accounts.find(
      a => a.username.toLowerCase() === selectedUsername.trim().toLowerCase()
    );
    
    if (!matchedAccount) {
      setErrorMsg('Nama akun tidak ditemukan dalam sistem!');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const validPassword = matchedAccount.password || (matchedAccount as any).pin;
    if (password === validPassword) {
      onUnlock(matchedAccount);
    } else {
      setErrorMsg('Password salah! Periksa kembali ejaan sandi Anda.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const selectedAccount = accounts.find(a => a.username === selectedUsername);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-lg p-4 transition-all duration-300">
      <div 
        className={`bg-white border border-slate-100 text-slate-800 w-full max-w-[420px] rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] p-6 md:p-8 flex flex-col items-center transition-all duration-300 ${
          shake ? 'animate-bounce border-rose-300 shadow-rose-200/20' : ''
        }`}
      >
        {/* Rounded Shield Avatar Icon */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-100 rounded-[2rem] blur-xl opacity-40 animate-pulse" />
          <div className="w-16 h-16 rounded-[1.3rem] bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-500/20 flex items-center justify-center text-white shadow-xl shadow-indigo-600/15 relative z-10">
            {password.length > 0 ? (
              <Unlock className="animate-pulse" size={26} />
            ) : (
              <Lock size={26} />
            )}
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-1 border-2 border-white shadow-md relative z-20 animate-bounce">
            <Sparkles size={11} />
          </div>
        </div>

        {/* Application Title Heading */}
        <div className="text-center mb-6 w-full">
          <span className="text-[9px] font-black tracking-[0.2em] text-indigo-600 uppercase">
            AFME STORE POS SYSTEM
          </span>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center justify-center gap-1.5">
            Sistem Kasir & Inventori
          </h2>
          
          <div className="mt-2 flex justify-center">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[9px] uppercase font-mono tracking-wide shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-550 border border-white shadow-inner animate-pulse inline-block" />
                Database Cloud (Supabase)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-55/60 text-amber-800 border border-amber-100 font-extrabold text-[9px] uppercase font-mono tracking-wide shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-inner animate-pulse inline-block" />
                Mode Offline Lokal
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <span className="text-xs text-slate-500 font-extrabold tracking-wide">Membuka enkripsi data kru...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            
            {/* Section: Username Selector */}
            <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-3xl">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <User size={13} className="text-indigo-600" /> 1. Pilih Profil Pengguna
              </label>
              
              {/* Account Quick Select Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto overflow-x-hidden scrollbar-thin pr-1 p-0.5">
                {accounts.map(acc => {
                  const isSelected = selectedUsername === acc.username;
                  // Strip parentheses if any
                  const displayName = acc.name.replace(/\s*\([^)]*\)/g, '');
                  
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setSelectedUsername(acc.username);
                        setErrorMsg('');
                        setPassword('');
                      }}
                      className={`p-2.5 rounded-[1.1rem] text-left transition relative flex flex-col justify-between h-[64px] border cursor-pointer group ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
                          : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100/70 shadow-xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        {/* Circle Initial Avatar */}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[9px] uppercase shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white border border-white/10'
                            : acc.role === 'owner'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : acc.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {acc.username.slice(0, 2)}
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-[11px] font-black truncate leading-tight">{displayName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end mt-1 w-full shrink-0">
                        {isSelected && (
                          <UserCheck size={11} className="text-white shrink-0 select-none animate-scaleIn" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Account Detail Visual Accent */}
            {selectedAccount && (
              <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100/40 rounded-2xl px-4 py-2.5 w-full">
                <div className="flex items-center gap-2 truncate">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <p className="text-xs font-black text-slate-800 truncate">
                    {selectedAccount.name}
                  </p>
                </div>
              </div>
            )}

            {/* Section: Password Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <KeyRound size={13} className="text-indigo-600" /> 2. Masukkan Password Akun
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Kode sandi atau password..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 tracking-wide focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 pr-11 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none p-1.5 transition rounded-lg"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 pl-0.5">
                Misal: megi: <span className="font-mono text-slate-500 font-bold">megipassword</span>, owner: <span className="font-mono text-slate-500 font-bold">ownerpassword</span>, dll.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 text-xs text-rose-800 bg-rose-50 border border-rose-100 rounded-2xl p-3.5 shadow-xs">
                <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                <span className="font-bold leading-normal">{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 mt-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all uppercase tracking-wider"
            >
              <Unlock size={14} />
              <span>Verifikasi & Masuk</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
