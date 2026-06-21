import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Lock, 
  Key, 
  ShieldAlert, 
  Database, 
  Check, 
  Plus, 
  Edit2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { AppAccount, UserRole } from '../types';
import { getAccounts, saveAccount, deleteAccount } from '../db/mockDb';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  getAppAccounts, 
  saveAppAccount, 
  deleteAppAccount, 
  clearAllSupabaseData 
} from '../lib/supabaseService';

interface PengaturanProps {
  activeRole: UserRole;
  onResetDb: () => void;
  currentUserUsername: string;
  onUserUpdated?: (updatedAcc: AppAccount) => void;
}

export default function Pengaturan({ activeRole, onResetDb, currentUserUsername, onUserUpdated }: PengaturanProps) {
  const [accounts, setAccounts] = useState<AppAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Form states for adding/editing user
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('karyawan');
  
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  
  // Database reset confirm state
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');

  // Inline delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load accounts (Supabase with mockDb fallback)
  const loadAccountsData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const data = await getAppAccounts();
        if (data && data.length > 0) {
          setAccounts(data);
        } else {
          setAccounts(getAccounts());
        }
      } else {
        setAccounts(getAccounts());
      }
    } catch (err) {
      console.error('Gagal mengambil daftar akun:', err);
      setAccounts(getAccounts()); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccountsData();
  }, []);

  const handleResetForm = () => {
    setIsEditing(false);
    setUserId('');
    setUsername('');
    setName('');
    setPassword('');
    setRole('karyawan');
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !name.trim() || !password.trim()) {
      setStatusMsg('Semua kolom harus diisi!');
      setStatusType('error');
      return;
    }

    if (password.length < 4) {
      setStatusMsg('Password minimal 4 karakter!');
      setStatusType('error');
      return;
    }

    // Check duplicate username if adding new
    if (!isEditing) {
      const exists = accounts.some(a => a.username.toLowerCase() === username.trim().toLowerCase());
      if (exists) {
        setStatusMsg('Username sudah terpakai!');
        setStatusType('error');
        return;
      }
    }

    const accountData: AppAccount = {
      id: isEditing ? userId : `acc-${Date.now()}`,
      username: username.trim().toLowerCase(),
      name: name.trim(),
      password: password.trim(),
      role: role
    };

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await saveAppAccount(accountData);
      } else {
        saveAccount(accountData);
      }
      
      setStatusMsg(isEditing ? 'Akun berhasil diperbarui!' : 'Akun baru berhasil didaftarkan!');
      setStatusType('success');

      if (isEditing && onUserUpdated && accountData.username.toLowerCase() === currentUserUsername.toLowerCase()) {
        onUserUpdated(accountData);
      }
      
      // Refresh list and clear form
      await loadAccountsData();
      handleResetForm();
    } catch (err) {
      console.error('Gagal memproses akun:', err);
      const errMsg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      setStatusMsg(`Terjadi kesalahan database: ${errMsg}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => {
      setStatusMsg('');
      setStatusType('');
    }, 4500);
  };

  const handleEditClick = (acc: AppAccount) => {
    setIsEditing(true);
    setUserId(acc.id);
    setUsername(acc.username);
    setName(acc.name);
    setPassword(acc.password);
    setRole(acc.role);
    setStatusMsg('');
  };

  const handleConfirmDelete = async (id: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await deleteAppAccount(id);
      } else {
        deleteAccount(id);
      }
      setDeleteConfirmId(null);
      setStatusMsg('Akun berhasil dihapus!');
      setStatusType('success');
      await loadAccountsData();
    } catch (err) {
      console.error('Gagal menghapus akun:', err);
      setStatusMsg('Terjadi error saat menghapus!');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
    
    setTimeout(() => {
      setStatusMsg('');
      setStatusType('');
    }, 4500);
  };

  const handleTotalResetOfDatabase = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await clearAllSupabaseData();
      }
      
      // Panggil pemicu state lokal di level App.tsx juga
      onResetDb();
      
      setShowConfirmReset(false);
      setResetSuccessMsg('Seluruh database berhasil dibersihkan dari nol!');
      await loadAccountsData();
    } catch (err) {
      console.error('Gagal mengosongkan database:', err);
      setResetSuccessMsg('Reset gagal / terjadi error koneksi database.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setResetSuccessMsg(''), 5000);
    }
  };

  if (activeRole !== 'owner') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-2xl mx-auto shadow-sm text-center flex flex-col items-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-lg font-extrabold text-slate-905">Akses Terbatas: Khusus Owner</h3>
        <p className="text-slate-500 text-xs mt-2 max-w-md leading-relaxed">
          Maaf, menu pengaturan sistem (manajemen akun multi-user dan pengosongan database) hanya dapat dibuka apabila Anda masuk sebagai <strong>Owner</strong>.
        </p>
        <p className="text-slate-650 font-mono text-[11px] mt-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-indigo-700 font-extrabold">
          Role Aktif Saat Ini: {activeRole.toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title block with persistent status banner */}
      <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Pusat Pengaturan & Keamanan Toko</h2>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                <Wifi size={10} /> SUPABASE SYNC
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                <WifiOff size={10} /> LOCAL MOCK
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">Mengatur daftar akun kasir / staf, hak akses masuk, serta melakukan pemeliharaan data real-time toko.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="text-[11.5px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 uppercase font-mono">
            🔑 {activeRole.toUpperCase()} ACC
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Manage Accounts List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: List of Existing Users */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Akun Pengguna Terdaftar</h3>
              </div>
              <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                {accounts.length} Akun Aktif
              </span>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {isLoading && accounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium font-sans">
                  Memuat data akun dari enkripsi database...
                </div>
              ) : (
                accounts.map(acc => {
                  const isCurrent = acc.username.toLowerCase() === currentUserUsername.toLowerCase();
                  return (
                    <div key={acc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[13px] uppercase shrink-0 shadow-xs ${
                          acc.role === 'owner'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : acc.role === 'admin' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {acc.username.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-[13px]">{acc.name}</h4>
                            <span className={`text-[9px] px-1.5 py-0.5 font-extrabold rounded-md uppercase tracking-wider ${
                              acc.role === 'owner'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : acc.role === 'admin'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : 'bg-slate-50 border border-slate-200 text-slate-600'
                            }`}>
                              {acc.role}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-55 text-emerald-700 font-extrabold border border-emerald-100 rounded-md uppercase tracking-wider">
                                Sesi Aktif
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 font-mono">
                            <span>User: <strong className="text-slate-800 font-bold">{acc.username}</strong></span>
                            <span>•</span>
                            <span>Password: <strong className="text-indigo-600 font-extrabold">{acc.password}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Inline action confirmation */}
                      {deleteConfirmId === acc.id ? (
                        <div className="flex items-center gap-2 self-end sm:self-center bg-rose-50 rounded-xl p-1.5 px-3 border border-rose-100">
                          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Yakin hapus?</span>
                          <button
                            onClick={() => handleConfirmDelete(acc.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => handleEditClick(acc)}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition border border-slate-200 bg-white cursor-pointer"
                            title="Edit data user"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (isCurrent) return;
                              
                              if (acc.role === 'owner') {
                                setStatusMsg('Akun Owner tidak dapat dihapus demi keamanan sistem AFME!');
                                setStatusType('error');
                                return;
                              }
                              
                              // Check if deleting the last admin
                              const highPrivUsers = accounts.filter(a => a.role === 'owner' || a.role === 'admin');
                              if (acc.role === 'admin' && highPrivUsers.length <= 1) {
                                setStatusMsg('Tidak bisa menghapus satu-satunya akun Admin/Owner yang tersisa!');
                                setStatusType('error');
                                return;
                              }
                              setDeleteConfirmId(acc.id);
                            }}
                            disabled={isCurrent || acc.role === 'owner'}
                            className={`p-2 rounded-xl transition border ${
                              isCurrent || acc.role === 'owner'
                                ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-205 text-slate-455' 
                                : 'bg-white border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 cursor-pointer text-slate-400'
                            }`}
                            title={isCurrent ? "Tidak dapat menghapus sesi aktif Anda" : acc.role === 'owner' ? "Tidak dapat menghapus akun Owner" : "Hapus user ini"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Maintenance / Clear Database */}
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Database size={18} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
                  ⚠️ Tindakan Bahaya: Kosongkan Seluruh Database Toko
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                  Jika toko Anda ingin **menghapus semua data sirkulasi/demo bawaan** agar bisa menginput data stock riil pelanggan Anda, Anda dapat membersihkan database di bawah ini. Tindakan ini **irreversible** (tidak bisa dibatalkan). Riwayat penjualan, service, stok HP, dan operasional akan dihapus bersih secara permanen.
                </p>
                
                {resetSuccessMsg && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold md:max-w-md">
                    ✓ {resetSuccessMsg}
                  </div>
                )}

                <div className="pt-2">
                  {!showConfirmReset ? (
                    <button
                      onClick={() => setShowConfirmReset(true)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-md"
                    >
                      Mulai Pengosongan Seluruh Database Toko
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-rose-200 mt-2">
                      <div className="self-center">
                        <span className="text-xs text-rose-700 font-bold block">🚨 Yakin ingin membersihkan seluruh data Supabase & Lokal?</span>
                        <span className="text-[10px] text-slate-405">Stok HP, aksesoris, transaksi keuangan, service reparasi, & riwayat kasir akan di-reset permanen.</span>
                      </div>
                      <div className="flex gap-2.5 justify-end items-center sm:ml-auto">
                        <button
                          onClick={handleTotalResetOfDatabase}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Ya, Reset Bersih!
                        </button>
                        <button
                          onClick={() => setShowConfirmReset(false)}
                          className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
        
        {/* RIGHT COLUMN: Form to add / edit User account (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 sticky top-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <UserPlus className="text-indigo-600" size={16} />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                {isEditing ? 'Ubah Informasi Akun' : 'Daftarkan Akun Baru'}
              </h3>
            </div>

            <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username Login</label>
                <input
                  type="text"
                  placeholder="Contoh: agus, megi_toko"
                  disabled={isEditing}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="mt-1.5 w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 font-mono font-extrabold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1.5 block leading-normal">
                  Hanya huruf kecil, angka, dan underscore.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Tampilan</label>
                <input
                  type="text"
                  placeholder="Nama lengkap atau panggilan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role Hak Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1.5 w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none font-bold disabled:text-slate-550"
                  disabled={isEditing && (username === 'megi' || username === 'owner')}
                >
                  <option value="karyawan">Karyawan (Staf Kasir/Service)</option>
                  <option value="admin">Admin (Akses Penuh, Tanpa Reset DB)</option>
                  {(username === 'megi' || role === 'owner') && (
                    <option value="owner">Owner (Akses Penuh + Reset DB)</option>
                  )}
                </select>
                <span className="text-[10px] text-slate-400 mt-1.5 block leading-normal font-sans">
                  {(username === 'megi' || username === 'owner')
                    ? "Role Owner bawaan dikunci demi stabilitas sistem." 
                    : "Owner: Akses penuh + reset DB, Admin: Akses penuh, Karyawan: Akses kasir terbatas."}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password Akses Masuk</label>
                <input
                  type="password"
                  maxLength={30}
                  placeholder="Masukkan password akun"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  required
                />
              </div>

              {statusMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  statusType === 'success' 
                    ? 'bg-emerald-50 text-emerald-705 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {statusMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isEditing ? <Check size={14} /> : <Plus size={14} />}
                  <span>{isEditing ? 'Simpan Perubahan' : 'Daftarkan Akun'}</span>
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
