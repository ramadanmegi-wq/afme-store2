import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Smartphone, 
  Wrench, 
  Users, 
  Database, 
  Menu, 
  X, 
  ShieldAlert, 
  Sparkles, 
  LogOut,
  Briefcase,
  DollarSign,
  Cpu,
  Package,
  Settings,
  RefreshCw,
  CloudLightning,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Type definitions
import { Product, Transaction, Service, Customer, UserRole, OperationalExpense, Sparepart, AppAccount } from './types';

// Mock DB interactions (for offline fallback)
import { 
  getProducts, 
  saveProduct, 
  deleteProduct, 
  getServices, 
  saveService, 
  deleteService, 
  getTransactions, 
  saveTransaction, 
  updateTransaction,
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getExpenses,
  saveExpense,
  deleteExpense,
  getSpareparts,
  saveSparepart,
  deleteSparepart,
  clearAllData
} from './db/mockDb';

// Supabase real-time integrations
import { isSupabaseConfigured } from './lib/supabase';
import { 
  getProductsFromSupabase, 
  saveProductToSupabase, 
  deleteProductFromSupabase,
  getSparepartsFromSupabase,
  saveSparepartToSupabase,
  deleteSparepartFromSupabase,
  getServicesFromSupabase,
  saveServiceToSupabase,
  deleteServiceFromSupabase,
  getExpensesFromSupabase,
  saveExpenseToSupabase,
  deleteExpenseFromSupabase,
  getTransactionsFromSupabase,
  saveTransactionToSupabase,
  updateTransactionInSupabase,
  clearAllSupabaseData,
  migrateLocalDataToSupabase
} from './lib/supabaseService';

// Components
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import IPhoneStock from './components/IPhoneStock';
import ServiceHP from './components/ServiceHP';
import CustomerRoster from './components/CustomerRoster';
import SupabaseGuide from './components/SupabaseGuide';
import LaporanKeuangan from './components/LaporanKeuangan';
import SparepartsInventory from './components/SparepartsInventory';
import PinLockModal from './components/PinLockModal';
import Pengaturan from './components/Pengaturan';

export default function App() {
  // Mobile navigation drawer toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Current Active Menu Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Security Lockscreen States (Session Management)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('afme_session_unlocked') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<AppAccount | null>(() => {
    const saved = localStorage.getItem('afme_session_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('afme_session_user');
    if (saved) {
      try {
        return JSON.parse(saved).role as UserRole;
      } catch {
        return 'karyawan';
      }
    }
    return 'karyawan';
  });

  // Database reactive states
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  
  // Loading & Sync and feedback states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  // Trigger brief toast feedback banner
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load and refresh state values asychronously from Supabase or localStorage fallback
  const refreshDbState = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Multi-fetching from cloud
        const [dbProducts, dbServices, dbTransactions, dbExpenses, dbSpareparts] = await Promise.all([
          getProductsFromSupabase(),
          getServicesFromSupabase(),
          getTransactionsFromSupabase(),
          getExpensesFromSupabase(),
          getSparepartsFromSupabase()
        ]);
        
        setProducts(dbProducts);
        setServices(dbServices);
        setTransactions(dbTransactions);
        setExpenses(dbExpenses);
        setSpareparts(dbSpareparts);
        setCustomers(getCustomers()); // Customers fallback
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error('Gagal memuat data dari Supabase cloud:', e);
      triggerToast('Gagal memuat database cloud, beralih ke offline cached local storage', 'error');
    }

    // Default Fallback Local Storage
    setProducts(getProducts());
    setServices(getServices());
    setTransactions(getTransactions());
    setCustomers(getCustomers());
    setExpenses(getExpenses());
    setSpareparts(getSpareparts());
    setIsLoading(false);
  };

  useEffect(() => {
    refreshDbState();
  }, []);

  // Save changes to stock items (iPhone or accessories)
  const handleSaveProduct = async (prod: Product) => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await saveProductToSupabase(prod);
      triggerToast('Berhasil mengunggah perubahan produk ke database Supabase');
    } else {
      saveProduct(prod);
      triggerToast('Penyimpanan lokal sukses (Offline Cache)');
    }
    await refreshDbState();
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await deleteProductFromSupabase(id, prod.type);
      triggerToast('Produk terhapus dari Supabase Cloud', 'info');
    } else {
      deleteProduct(id);
      triggerToast('Produk terhapus (Offline Cache)', 'info');
    }
    await refreshDbState();
  };

  // Save changes to services Repair logs
  const handleSaveService = async (srv: Service) => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await saveServiceToSupabase(srv);
      triggerToast('Berhasil menyimpan nota reparasi di Supabase Cloud');
    } else {
      saveService(srv);
      triggerToast('Selesai merekam nota servis (Offline Cache)');
    }

    // SELALU daftarkan profil pelanggan ke database lokal (offline fallback)
    // agar sinkron ke Customer Roster & Autocomplete Kasir
    if (srv.customerName && srv.customerPhone) {
      const cleanName = srv.customerName.trim();
      const cleanPhone = srv.customerPhone.trim();
      const lowerName = cleanName.toLowerCase();
      if (lowerName !== 'pelanggan umum' && lowerName !== 'customer umum' && lowerName !== 'umum') {
        saveCustomer({
          id: `cust-${Date.now()}`,
          name: cleanName,
          phone: cleanPhone,
        });
      }
    }

    await refreshDbState();
  };

  // Delete service log
  const handleDeleteService = async (id: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await deleteServiceFromSupabase(id);
      triggerToast('Model service terhapus dari cloud', 'info');
    } else {
      deleteService(id);
      triggerToast('Service log terhapus (Lokal)', 'info');
    }
    await refreshDbState();
  };

  // Save changes to Spareparts
  const handleSaveSparepart = async (sp: Sparepart) => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await saveSparepartToSupabase(sp);
      triggerToast('Katalog sparepart diunggah ke cloud database');
    } else {
      saveSparepart(sp);
      triggerToast('Sparepart telah diperbarui secara lokal');
    }
    await refreshDbState();
  };

  // Delete sparepart item
  const handleDeleteSparepart = async (id: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await deleteSparepartFromSupabase(id);
      triggerToast('Katalog sparepart terhapus dari cloud', 'info');
    } else {
      deleteSparepart(id);
      triggerToast('Sparepart terhapus (Lokal)', 'info');
    }
    await refreshDbState();
  };

  // Process POS checkout transaction
  const handleCheckoutTransaction = async (trx: Transaction) => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await saveTransactionToSupabase(trx);
      triggerToast('Transaksi POS Kasir diproses permanen di Supabase');
    } else {
      saveTransaction(trx);
      triggerToast('Transaksi tercatat (Offline Local Storage)');
    }

    // SELALU daftarkan profil pelanggan ke database lokal (offline fallback)
    // agar sinkron ke Customer Roster & Autocomplete Kasir
    if (trx.customerName && trx.customerPhone) {
      const cleanName = trx.customerName.trim();
      const cleanPhone = trx.customerPhone.trim();
      const lowerName = cleanName.toLowerCase();
      if (lowerName !== 'pelanggan umum' && lowerName !== 'customer umum' && lowerName !== 'umum') {
        saveCustomer({
          id: `cust-${Date.now()}`,
          name: cleanName,
          phone: cleanPhone,
        });
      }
    }

    await refreshDbState();
  };

  // Update/Edit existing transaction
  const handleUpdateTransaction = async (updatedTrx: Transaction) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await updateTransactionInSupabase(updatedTrx);
        triggerToast('Transaksi berhasil diperbarui di cloud Supabase', 'success');
      } else {
        updateTransaction(updatedTrx);
        triggerToast('Transaksi berhasil diperbarui (Offline)', 'success');
      }
      await refreshDbState();
    } catch (err: any) {
      console.error(err);
      triggerToast('Gagal memperbarui transaksi: ' + (err.message || err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Add/Update customer
  const handleSaveCustomer = async (cust: Customer) => {
    setIsLoading(true);
    try {
      saveCustomer(cust);
      triggerToast('Informasi pelanggan berhasil disimpan', 'success');
      await refreshDbState();
    } catch (err: any) {
      console.error(err);
      triggerToast('Gagal merubah data pelanggan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (id: string) => {
    setIsLoading(true);
    try {
      deleteCustomer(id);
      triggerToast('Pelanggan berhasil dihapus dari sistem', 'info');
      await refreshDbState();
    } catch (err: any) {
      console.error(err);
      triggerToast('Gagal menghapus pelanggan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Add operational expense
  const handleAddExpense = async (exp: Omit<OperationalExpense, 'id'>) => {
    setIsLoading(true);
    const newExp: OperationalExpense = {
      ...exp,
      id: `exp-${Date.now()}`
    };
    if (isSupabaseConfigured) {
      await saveExpenseToSupabase(newExp);
      triggerToast('Pengeluaran berhasil dicatat di cloud');
    } else {
      saveExpense(newExp);
      triggerToast('Biaya operasional tersimpan (Offline)');
    }
    await refreshDbState();
  };

  // Delete operational expense
  const handleDeleteExpense = async (id: string) => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await deleteExpenseFromSupabase(id);
      triggerToast('Jurnal biaya dibatalkan dari Supabase', 'info');
    } else {
      deleteExpense(id);
      triggerToast('Jurnal biaya terhapus (Lokal)', 'info');
    }
    await refreshDbState();
  };

  // One-click batch offline-to-online migration
  const handleBatchMigrate = async () => {
    if (!isSupabaseConfigured) {
      triggerToast('Konfigurasikan VITE_SUPABASE_URL terlebih dahulu!', 'error');
      return;
    }
    setIsLoading(true);
    
    // Tarik data lokal sebagai sumber migrasi
    const localProds = getProducts();
    const localServices = getServices();
    const localTransactions = getTransactions();
    const localExpenses = getExpenses();
    const localSpareparts = getSpareparts();

    const res = await migrateLocalDataToSupabase(
      localProds,
      localServices,
      localTransactions,
      localExpenses,
      localSpareparts
    );

    if (res.success) {
      triggerToast(`Fabulous! Berhasil memigrasikan ${res.count} baris data ke database cloud Supabase!`, 'success');
      // Matikan inisialisasi lokal agar beralih penuh ke cloud
      localStorage.setItem('afme_initialized', 'true');
    } else {
      triggerToast(`Migrasi terganggu: ${res.error}`, 'error');
    }
    await refreshDbState();
  };

  // Reset database entirely to empty state (Security protected)
  const handleResetDatabase = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await clearAllSupabaseData();
      clearAllData();
      triggerToast('Seluruh tabel di cloud Supabase & Local Cache (termasuk daftar pelanggan) berhasil dikosongkan!', 'info');
    } else {
      clearAllData();
      triggerToast('Local Storage telah disapu bersih!', 'info');
    }
    await refreshDbState();
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 0. Toast Notification Block */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 animate-bounce duration-300">
          <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-xl border text-xs font-semibold ${
            toastType === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : toastType === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}>
            {toastType === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 0. User Account Lock Screen Overlay with Session Management */}
      {!isUnlocked && (
        <PinLockModal 
          onUnlock={(unlockedAccount) => {
            setCurrentUser(unlockedAccount);
            setActiveRole(unlockedAccount.role);
            setIsUnlocked(true);
            // Simpan session aman
            localStorage.setItem('afme_session_unlocked', 'true');
            localStorage.setItem('afme_session_user', JSON.stringify(unlockedAccount));
            triggerToast(`Selamat datang kembali, ${unlockedAccount.name}!`);
          }} 
        />
      )}
      
      {/* 1. Mobile Header bar (Premium Light themed) */}
      <header className="md:hidden bg-white border-b border-slate-200 text-slate-800 px-5 py-4 flex justify-between items-center z-40 shadow-sm sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm tracking-widest text-white shadow-md shadow-indigo-600/20">
            AF
          </div>
          <span className="font-bold tracking-tight text-base text-slate-900">AFM STORE</span>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* 2. Responsive Sidebar Chassis (Premium Light design) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-650 flex flex-col justify-between p-5 border-r border-slate-200 transition-all duration-300 ease-in-out transform
        md:translate-x-0 md:static md:h-screen md:min-w-64 md:max-w-64
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-1 scrollbar-none">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-600/35">
                AF
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none">AFM STORE</h1>
                <span className="text-[10px] text-slate-500 font-medium mt-1 block">V2 Pro • Supabase Server</span>
              </div>
            </div>
            
            <button 
              className="md:hidden p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Connection Status Badge */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={13} className={isSupabaseConfigured ? "text-emerald-600" : "text-amber-600"} />
              <span className="text-[10.5px] font-mono tracking-wide font-bold text-slate-700">
                {isSupabaseConfigured ? 'Supabase Cloud' : 'Offline Storage'}
              </span>
            </div>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-5">
            
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                <span>1. Divisi Penjualan</span>
              </p>
              <div className="space-y-1">
                {/* Tab: Dashboard */}
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard Toko</span>
                </button>

                {/* Tab: POS */}
                <button
                  onClick={() => { setActiveTab('pos'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'pos'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <ShoppingCart size={14} />
                  <span>POS Kasir Penjualan</span>
                </button>

                {/* Tab: Stok HP */}
                <button
                  onClick={() => { setActiveTab('stok_hp'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'stok_hp'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Stok HP Second</span>
                </button>

                {/* Tab: Stok Aksesoris */}
                <button
                  onClick={() => { setActiveTab('stok_aksesoris'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'stok_aksesoris'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <Package size={14} />
                  <span>Stok Aksesoris</span>
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                <span>2. Divisi Service HP</span>
              </p>
              <div className="space-y-1">
                {/* Tab: Service HP */}
                <button
                  onClick={() => { setActiveTab('service_hp'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'service_hp'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <Wrench size={14} />
                  <span>Jasa Service HP</span>
                </button>

                {/* Tab: Stok Spareparts */}
                <button
                  onClick={() => { setActiveTab('stok_spareparts'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'stok_spareparts'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <Cpu size={14} />
                  <span>Stok Spareparts</span>
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                <span>3. Keuangan & Jurnal</span>
              </p>
              <div className="space-y-1">
                {/* Tab: Laporan Keuangan */}
                <button
                  onClick={() => { setActiveTab('laporan_keuangan'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'laporan_keuangan'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <Briefcase size={14} />
                  <span>Laporan Keuangan</span>
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 mb-2">
                Server & Utilitas
              </p>
              <div className="space-y-1">
                {/* Tab: Customers */}
                <button
                  onClick={() => { setActiveTab('customer_roster'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'customer_roster'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <Users size={14} />
                  <span>Daftar Pelanggan</span>
                </button>

                {/* Tab: Supabase Connection Guide */}
                <button
                  onClick={() => { setActiveTab('supabase_sync'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'supabase_sync'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                      : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                  }`}
                >
                  <Database size={14} />
                  <span className="flex items-center gap-1">
                    Supabase SQL
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded-sm font-mono leading-none font-bold">SQL</span>
                  </span>
                </button>

                {/* Tab: Pengaturan & Multi-user */}
                {activeRole === 'owner' && (
                  <button
                    onClick={() => { setActiveTab('pengaturan'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'pengaturan'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 border border-indigo-500/20'
                        : 'hover:bg-slate-50 text-slate-650 hover:text-slate-900'
                    }`}
                  >
                    <Settings size={14} />
                    <span>Konfigurasi POS</span>
                  </button>
                )}
              </div>
            </div>

          </nav>
        </div>

        {/* Bottom Panel: Logged In Account Details & Lock Screen */}
        <div className="pt-4 border-t border-slate-100 space-y-3 shrink-0 bg-white">
          {currentUser && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1 pl-0.5">Sesi Masuk Aktif</p>
              <h4 className="text-xs font-extrabold text-slate-900 truncate">{currentUser.name}</h4>
              <span className="inline-block text-[9px] text-indigo-700 font-bold capitalize mt-1 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Akses: {currentUser.role}
              </span>
            </div>
          )}
          
          <div className="flex gap-1.5">
            <button
              onClick={refreshDbState}
              disabled={isLoading}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition flex items-center justify-center cursor-pointer"
              title="Refresh data dari database"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-indigo-500" : ""} />
            </button>
            
            {isUnlocked && (
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setCurrentUser(null);
                  setActiveRole('karyawan');
                  localStorage.removeItem('afme_session_unlocked');
                  localStorage.removeItem('afme_session_user');
                  triggerToast('Berhasil mengunci sesi sistem', 'info');
                }}
                className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
              >
                <LogOut size={11} />
                <span>Kunci Layar</span>
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-400 font-mono text-center">
            PRO POS • v2.6.2
          </div>
        </div>

      </aside>

      {/* 3. Main Frame Area (Obsidian themed canvas) */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen bg-slate-50 text-slate-800">
        
        {/* Dynamic header alerts or switch role warnings */}
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Role Status alert overlay */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AFM STORE CLOUD POS</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight capitalize mt-1 flex items-center gap-2">
                {activeTab.replace('_', ' ')} Panel
                {isLoading && <LoaderCircleSpinner />}
              </h2>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              {/* Batch sync button */}
              {isSupabaseConfigured && (
                <button
                  onClick={handleBatchMigrate}
                  className="px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                  title="Migrasikan data buatan lokal Anda ke server Supabase"
                >
                  <CloudLightning size={12} className="text-indigo-500" />
                  <span>Migrasikan Data Offline to Cloud</span>
                </button>
              )}

              {/* Quick role notifier */}
              <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${
                activeRole === 'owner'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : activeRole === 'admin'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <ShieldAlert size={12} />
                <span>
                  Mode: <strong className="uppercase font-mono">{activeRole}</strong>
                  {activeRole === 'karyawan' && ' (Sembunyi Lap. Keu)'}
                </span>
              </div>
            </div>
          </div>

          {/* Core Tab Switched Canvas */}
          <div className="animate-fadeIn">
            
            {activeTab === 'dashboard' && (
              <Dashboard
                products={products}
                transactions={transactions}
                services={services}
                customers={customers}
                activeRole={activeRole}
                onChangeTab={(tab) => setActiveTab(tab)}
                onResetDb={handleResetDatabase}
              />
            )}

            {activeTab === 'pos' && (
              <POS
                products={products}
                activeRole={activeRole}
                cashierName={currentUser?.name || `${activeRole.toUpperCase()} Toko`}
                onCheckout={handleCheckoutTransaction}
                customers={customers}
              />
            )}

            {activeTab === 'stok_hp' && (
              <IPhoneStock
                products={products}
                activeRole={activeRole}
                typeFilter="iphone"
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'stok_aksesoris' && (
              <IPhoneStock
                products={products}
                activeRole={activeRole}
                typeFilter="aksesoris"
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'service_hp' && (
              <ServiceHP
                services={services}
                activeRole={activeRole}
                spareparts={spareparts}
                onSaveService={handleSaveService}
                onDeleteService={handleDeleteService}
                customers={customers}
              />
            )}

            {activeTab === 'stok_spareparts' && (
              <SparepartsInventory
                spareparts={spareparts}
                activeRole={activeRole}
                onSaveSparepart={handleSaveSparepart}
                onDeleteSparepart={handleDeleteSparepart}
              />
            )}

            {activeTab === 'customer_roster' && (
              <CustomerRoster
                customers={customers}
                transactions={transactions}
                services={services}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {activeTab === 'laporan_keuangan' && (
              <LaporanKeuangan
                products={products}
                transactions={transactions}
                services={services}
                activeRole={activeRole}
                expenses={expenses}
                spareparts={spareparts}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                onUpdateTransaction={handleUpdateTransaction}
              />
            )}

            {activeTab === 'supabase_sync' && (
              <SupabaseGuide />
            )}

            {activeTab === 'pengaturan' && (
              <Pengaturan
                activeRole={activeRole}
                onResetDb={handleResetDatabase}
                currentUserUsername={currentUser?.username || ''}
                onUserUpdated={(updatedAcc) => {
                  setCurrentUser(updatedAcc);
                  setActiveRole(updatedAcc.role);
                  localStorage.setItem('afme_session_user', JSON.stringify(updatedAcc));
                  triggerToast('Profil aktif Anda berhasil diperbarui!', 'success');
                }}
              />
            )}

          </div>

        </div>

      </main>

    </div>
  );
}

// Minimalis Loading Spinner
function LoaderCircleSpinner() {
  return (
    <span className="inline-block relative w-4 h-4 ml-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500/50 border border-indigo-400 border-t-transparent animate-spin"></span>
    </span>
  );
}
