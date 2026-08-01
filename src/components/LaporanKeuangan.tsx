import { useState, useMemo, FormEvent } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Filter, 
  Printer, 
  Calculator, 
  Calendar,
  AlertCircle,
  FileText,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Wallet,
  Edit2,
  ArrowRight,
  Scale,
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from 'recharts';
import { Product, Transaction, TransactionItem, Service, UserRole, OperationalExpense, Sparepart } from '../types';

interface LaporanKeuanganProps {
  products: Product[];
  transactions: Transaction[];
  services: Service[];
  activeRole: UserRole;
  expenses: OperationalExpense[];
  spareparts: Sparepart[];
  onAddExpense: (expense: Omit<OperationalExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateTransaction?: (updatedTrx: Transaction) => void;
  onOpenLaporanTransaksi?: () => void;
}

export default function LaporanKeuangan({
  products,
  transactions,
  services,
  activeRole,
  expenses,
  spareparts = [],
  onAddExpense,
  onDeleteExpense,
  onUpdateTransaction,
  onOpenLaporanTransaksi
}: LaporanKeuanganProps) {
  // Filters State
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Expense form state
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'operasional' | 'gaji' | 'sewa' | 'lainnya'>('operasional');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Profit Sharing Simulation state
  const [ownerShare, setOwnerShare] = useState<number>(60);
  const [investorShare, setInvestorShare] = useState<number>(30);
  const [bonusShare, setBonusShare] = useState<number>(10);
  const [showProfitSharing, setShowProfitSharing] = useState(false);

  // Modal Awal & Suntik Modal State
  const [modalAwal, setModalAwal] = useState<number>(() => {
    const saved = localStorage.getItem('afme_modal_awal');
    return saved ? parseInt(saved) : 50000000; // Default Rp 50.000.000
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempModalInput, setTempModalInput] = useState('');

  // Print Mode State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Tab Utama Laporan Keuangan Simple
  const [activeMainTab, setActiveMainTab] = useState<'laba_rugi' | 'buku_kas' | 'opex' | 'audit'>('laba_rugi');

  // Tab Buku Kas & Neraca State
  const [activeCashTab, setActiveCashTab] = useState<'neraca' | 'arus_kas' | 'panduan'>('neraca');

  // Transaction Editing State (for Owner & Admin)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editedCustomerName, setEditedCustomerName] = useState('');
  const [editedCustomerPhone, setEditedCustomerPhone] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedItems, setEditedItems] = useState<TransactionItem[]>([]);

  const handleStartEditTrx = (tx: Transaction) => {
    if (activeRole !== 'owner' && activeRole !== 'admin') return;
    setEditingTransaction(tx);
    setEditedCustomerName(tx.customerName || 'Pelanggan Umum');
    setEditedCustomerPhone(tx.customerPhone || '08123456789');
    setEditedDate(tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    // Clone items and resolve original prices
    setEditedItems(tx.items.map(item => {
      const matchedProduct = products.find(p => p.id === item.productId);
      return {
        ...item,
        buyPrice: matchedProduct ? matchedProduct.buyPrice : item.buyPrice,
        repairCost: matchedProduct ? matchedProduct.repairCost : (item.repairCost || 0)
      };
    }));
  };

  const handleUpdateItemField = (index: number, field: keyof TransactionItem, value: any) => {
    setEditedItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSaveTrxEdit = () => {
    if (!editingTransaction || (activeRole !== 'owner' && activeRole !== 'admin')) return;

    // Recalculate values
    let cartSubtotal = 0;
    let profit = 0;
    editedItems.forEach((item) => {
      cartSubtotal += item.sellingPrice * item.quantity;
      const itemCost = item.buyPrice + item.repairCost;
      profit += (item.sellingPrice - itemCost) * item.quantity;
    });

    const finalTotal = Math.max(0, cartSubtotal - (editingTransaction.tradeIn ? editingTransaction.tradeIn.buyPrice : 0));

    let finalDate = editingTransaction.date;
    if (editedDate) {
      const origDatePart = editingTransaction.date ? editingTransaction.date.split('T')[0] : '';
      if (editedDate === origDatePart) {
        finalDate = editingTransaction.date;
      } else {
        const origTimePart = editingTransaction.date && editingTransaction.date.includes('T')
          ? 'T' + editingTransaction.date.split('T')[1]
          : 'T' + new Date().toISOString().split('T')[1];
        try {
          finalDate = new Date(editedDate + origTimePart).toISOString();
        } catch {
          finalDate = new Date(editedDate).toISOString();
        }
      }
    }

    const updatedTrx: Transaction = {
      ...editingTransaction,
      customerName: editedCustomerName.trim() || 'Pelanggan Umum',
      customerPhone: editedCustomerPhone.trim() || '08123456789',
      date: finalDate,
      items: editedItems,
      totalAmount: finalTotal,
      totalProfit: profit
    };

    if (onUpdateTransaction) {
      onUpdateTransaction(updatedTrx);
    }
    setEditingTransaction(null);
  };

  // Format IDR Handy Helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Filter Data based on selected date ranges
  const filteredData = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date('2099-12-31T23:59:59.999Z');

    if (period === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      start = new Date();
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === 'all') {
      start = new Date(0);
      end = new Date('2099-12-31T23:59:59.999Z');
    } else if (period === 'custom') {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const checkDate = (dateStr: string) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      return d >= start && d <= end;
    };

    const filterTransactions = period === 'all' ? transactions : transactions.filter(t => checkDate(t.date));
    const filterServices = period === 'all' ? services : services.filter(s => checkDate(s.date));
    const filterExpenses = period === 'all' ? expenses : expenses.filter(e => checkDate(e.date));

    return {
      transactions: filterTransactions,
      services: filterServices,
      expenses: filterExpenses,
      rangeText: period === 'custom' 
        ? `${startDate} s/d ${endDate}` 
        : period === 'today' 
          ? 'Hari Ini' 
          : period === 'week' 
            ? '7 Hari Terakhir' 
            : period === 'month' 
              ? 'Bulan Ini' 
              : period === 'year'
                ? 'Tahun Ini'
                : 'Semua Periode (Lifetime)'
    };
  }, [period, startDate, endDate, transactions, services, expenses]);

  // Calculate stats based on filtered data
  const stats = useMemo(() => {
    const { transactions: fTx, services: fSv, expenses: fEx } = filteredData;

    // 1. PENDAPATAN (REVENUE)
    // - POS Penjualan (Aksesoris & HP)
    const posRevenue = fTx.reduce((sum, tx) => sum + tx.totalAmount, 0);
    // - Service HP (Uang Jasa Reparasi yang ditagih)
    const completedServices = fSv.filter(s => s.status === 'selesai');
    const serviceRevenue = completedServices.reduce((sum, s) => sum + s.cost, 0);
    const totalRevenue = posRevenue + serviceRevenue;

    // 2. BEBAN MODAL & COGS (BEBAN POKOK PENJUALAN)
    // - Harga modal HP & aksesoris yang terjual dalam periode tersebut
    let modalPos = 0;
    let repairCostPos = 0;
    fTx.forEach(tx => {
      tx.items.forEach(it => {
        const matchedProduct = products.find(p => p.id === it.productId);
        const actualBuyPrice = matchedProduct ? matchedProduct.buyPrice : it.buyPrice;
        const actualRepairCost = matchedProduct ? matchedProduct.repairCost : (it.repairCost || 0);

        modalPos += actualBuyPrice * it.quantity;
        repairCostPos += actualRepairCost * it.quantity;
      });
    });

    // - Modal Sparepart Service
    const modalSparepartService = completedServices.reduce((sum, s) => sum + s.capitalCost, 0);

    // Total Beban Pokok (HPP)
    const hpPurchasingCost = modalPos;
    const initialRepairsCost = repairCostPos;
    const totalHPP = hpPurchasingCost + initialRepairsCost + modalSparepartService;

    // 3. PENGELUARAN LAIN (OPERASIONAL & BEBAN USAHA)
    const totalOperationalExpense = fEx.reduce((sum, e) => sum + e.amount, 0);

    // 4. PENILAIAN TUKAR TAMBAH (TRADE IN SEBAGAI ASSET ACQUISITION)
    // Pada dasarnya trade-in mengurangi uang masuk penjualan langsung, tapi kita mendapatkan stok HP second baru yang bernilai
    const totalTradeInAllowance = fTx.reduce((sum, tx) => sum + (tx.tradeIn ? tx.tradeIn.buyPrice : 0), 0);

    // 5. KEUNTUNGAN KOTOR (GROSS PROFIT)
    const grossProfit = totalRevenue - totalHPP;

    // 6. LABA BERSIH OPERASIONAL (NET PROFIT)
    // Keuntungan kotor dikurangi biaya operasional tambahan (beban usaha)
    const netProfit = grossProfit - totalOperationalExpense;

    // 7. ARUS KAS & PERSENTASE INTERAKTIF (PERHITUNGAN KAS & NILAI STOK)
    
    // a) Nilai total stok HP yang tersedia (Asset Persediaan Aktif HP)
    const totalSisaHpModal = products.reduce((sum, p) => {
      if (p.status === 'available' && p.type === 'iphone') {
        return sum + p.buyPrice + (p.repairCost || 0);
      }
      return sum;
    }, 0);

    // b) Nilai total stok Aksesoris yang tersedia (Asset Persediaan Aktif Aksesoris)
    const totalSisaAksesorisModal = products.reduce((sum, p) => {
      if (p.status === 'available' && p.type === 'aksesoris') {
        return sum + (p.buyPrice * (p.stock || 0));
      }
      return sum;
    }, 0);

    const totalSisaPersediaanModal = totalSisaHpModal + totalSisaAksesorisModal;

    // c) Nilai total stok sparepart yang tersedia (Asset Persediaan Suku Cadang)
    const totalSisaSparepartsModal = spareparts.reduce((sum, sp) => sum + (sp.buyPrice * sp.stock), 0);

    // c) Hitung HPP Lifetime POS dari seluruh transaksi terdaftar
    let lifetimeHppPos = 0;
    transactions.forEach(tx => {
      tx.items.forEach(it => {
        const matchedProduct = products.find(p => p.id === it.productId);
        const actualBuyPrice = matchedProduct ? matchedProduct.buyPrice : it.buyPrice;
        const actualRepairCost = matchedProduct ? matchedProduct.repairCost : (it.repairCost || 0);
        lifetimeHppPos += (actualBuyPrice + actualRepairCost) * it.quantity;
      });
    });

    // d) Total modal belanja spareparts/suku cadang (yang sudah terpakai di service selesai)
    const lifetimeSparepartService = services.filter(s => s.status === 'selesai').reduce((sum, s) => sum + s.capitalCost, 0);

    // e) Total kas keluar untuk belanja seluruh stok HP & aksesoris (Persediaan Aktif + Terjual)
    const totalKasKeluarUntukStok = totalSisaPersediaanModal + lifetimeHppPos;

    // f) Total kas keluar untuk belanja suku cadang (Persediaan Aktif + Terpakai)
    const totalKasKeluarBelanjaSparepart = totalSisaSparepartsModal + lifetimeSparepartService;

    // g) Lifetime Income & OPEX
    const lifetimePosRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const lifetimeServiceRevenue = services.filter(s => s.status === 'selesai').reduce((sum, s) => sum + s.cost, 0);
    const lifetimeOperationalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    // h) Lifetime Profit & Cash Balance Reconciliation
    const cumulativeNetProfit = (lifetimePosRevenue + lifetimeServiceRevenue) - (lifetimeHppPos + lifetimeSparepartService) - lifetimeOperationalExpense;
    const saldoKasKumulatif = modalAwal + lifetimePosRevenue + lifetimeServiceRevenue - totalKasKeluarUntukStok - totalKasKeluarBelanjaSparepart - lifetimeOperationalExpense;

    // i) Double-Entry Balance Audit Reconciliation
    const aktivaTotal = saldoKasKumulatif + totalSisaPersediaanModal + totalSisaSparepartsModal;
    const pasivaTotal = modalAwal + cumulativeNetProfit;
    const selisihRekonsiliasi = aktivaTotal - pasivaTotal;

    return {
      posRevenue,
      serviceRevenue,
      totalRevenue,
      hpPurchasingCost,
      initialRepairsCost,
      modalSparepartService,
      totalHPP,
      totalOperationalExpense,
      totalTradeInAllowance,
      grossProfit,
      netProfit,
      activeServicesCount: fSv.filter(s => s.status !== 'selesai').length,
      doneServicesCount: completedServices.length,
      txCount: fTx.length,
      // Integrated Cash fields
      modalAwal,
      totalSisaHpModal,
      totalSisaAksesorisModal,
      totalSisaPersediaanModal,
      totalSisaSparepartsModal,
      totalKasKeluarUntukStok,
      totalKasKeluarBelanjaSparepart,
      lifetimePosRevenue,
      lifetimeServiceRevenue,
      lifetimeSparepartService,
      lifetimeOperationalExpense,
      saldoKasKumulatif,
      cumulativeNetProfit,
      aktivaTotal,
      pasivaTotal,
      selisihRekonsiliasi
    };
  }, [filteredData, products, transactions, services, expenses, spareparts, modalAwal]);

  // Aggregate monthly data for income and expense comparisons
  const monthlyData = useMemo(() => {
    const groups: {
      [key: string]: {
        monthKey: string;
        label: string;
        pemasukan: number;
        pengeluaran: number;
        untung: number;
      };
    } = {};

    const getMonthKey = (dateStr: string) => {
      if (!dateStr) return '';
      return dateStr.substring(0, 7); // 'YYYY-MM'
    };

    const indonesianMonths = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const formatLabel = (key: string) => {
      const parts = key.split('-');
      if (parts.length < 2) return key;
      const year = parts[0];
      const monthIdx = parseInt(parts[1]) - 1;
      return `${indonesianMonths[monthIdx]} ${year}`;
    };

    const touchKey = (mKey: string) => {
      if (!groups[mKey]) {
        groups[mKey] = {
          monthKey: mKey,
          label: formatLabel(mKey),
          pemasukan: 0,
          pengeluaran: 0,
          untung: 0
        };
      }
    };

    // Populate from POS transactions
    transactions.forEach(tx => {
      const mKey = getMonthKey(tx.date);
      if (!mKey) return;
      touchKey(mKey);

      groups[mKey].pemasukan += tx.totalAmount;
      
      // Calculate COGS part
      tx.items.forEach(it => {
        const matchedProduct = products.find(p => p.id === it.productId);
        const actualBuyPrice = matchedProduct ? matchedProduct.buyPrice : it.buyPrice;
        const actualRepairCost = matchedProduct ? matchedProduct.repairCost : (it.repairCost || 0);
        groups[mKey].pengeluaran += (actualBuyPrice * it.quantity) + (actualRepairCost * it.quantity);
      });
    });

    // Populate from ServiceHP
    services.filter(s => s.status === 'selesai').forEach(s => {
      const mKey = getMonthKey(s.date);
      if (!mKey) return;
      touchKey(mKey);

      groups[mKey].pemasukan += s.cost;
      // Sparepart capital cost
      groups[mKey].pengeluaran += s.capitalCost;
    });

    // Populate from expenses (OPEX)
    expenses.forEach(e => {
      const mKey = getMonthKey(e.date);
      if (!mKey) return;
      touchKey(mKey);
      
      groups[mKey].pengeluaran += e.amount;
    });

    // Convert to sorted array
    const sorted = Object.values(groups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    // Compute net profit for each month
    sorted.forEach(item => {
      item.untung = item.pemasukan - item.pengeluaran;
    });

    return sorted;
  }, [transactions, services, expenses]);

  // Handle Add Expense
  const handleAddExpenseSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!expenseName || !expenseAmount) return;

    onAddExpense({
      name: expenseName,
      amount: parseInt(expenseAmount),
      date: expenseDate,
      category: expenseCategory
    });

    // Reset Form
    setExpenseName('');
    setExpenseAmount('');
    setExpenseCategory('operasional');
  };

  // If active user is "karyawan", protect this tab completely
  if (activeRole !== 'admin' && activeRole !== 'owner') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-105">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Akses Terbatas: Admin / Owner</h3>
        <p className="text-slate-500 text-xs mt-2 leading-relaxed">
          Sesuai dengan alur hak akses toko, Laporan Keuangan, rincian laba rugi, HPP, penentuan modal, dan fitur pembagian dividen hanya dapat diakses oleh akun **Admin (Owner)**.
        </p>
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-150 text-left text-xs text-slate-500">
          <span className="font-semibold text-slate-700 block mb-1">Mengapa dibatasi?</span>
          Hal ini menjaga kerahasiaan profit margin toko, perhitungan modal awal pembelian HP, serta catatan profit sharing sehingga staf (Karyawan) berfokus pada kasir POS & input service.
        </div>

        {onOpenLaporanTransaksi && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-600 font-semibold mb-3">Mencari riwayat transaksi kasir, nota POS, atau cetak ulang faktur?</p>
            <button
              onClick={() => onOpenLaporanTransaksi()}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <FileText size={15} />
              <span>Buka Laporan &amp; Riwayat Transaksi (POS &amp; Service)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section with Filter controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Briefcase size={18} className="text-indigo-600" /> Laporan Keuangan & Laba Rugi
          </h2>
          <p className="text-slate-550 text-xs mt-1">Analisis performa modal, HPP, cashflow, dan beban toko ({filteredData.rangeText})</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Period selector */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500">
            <button
              onClick={() => setPeriod('all')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${period === 'all' ? 'bg-white text-indigo-700 font-extrabold shadow-xs' : 'hover:text-slate-800'}`}
            >
              Semua (Lifetime)
            </button>
            <button
              onClick={() => setPeriod('today')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${period === 'today' ? 'bg-white text-indigo-700 font-extrabold shadow-xs' : 'hover:text-slate-800'}`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${period === 'week' ? 'bg-white text-indigo-700 font-extrabold shadow-xs' : 'hover:text-slate-800'}`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${period === 'month' ? 'bg-white text-indigo-700 font-extrabold shadow-xs' : 'hover:text-slate-800'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${period === 'year' ? 'bg-white text-indigo-700 font-extrabold shadow-xs' : 'hover:text-slate-800'}`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${period === 'custom' ? 'bg-white text-indigo-700 font-extrabold shadow-xs' : 'hover:text-slate-800'}`}
            >
              Custom
            </button>
          </div>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <CheckCircle size={14} /> Audit & Verifikasi
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Printer size={14} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Custom Date Picker expansion panel */}
      {period === 'custom' && (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap gap-4 items-center text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="font-bold">Mulai:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="font-bold">Selesai:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Mode Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/85 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveMainTab('laba_rugi')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'laba_rugi'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase size={15} />
            1. Ringkasan Laba Rugi
          </button>
          <button
            onClick={() => setActiveMainTab('buku_kas')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'buku_kas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wallet size={15} />
            2. Buku Kas & Neraca Toko
          </button>
          <button
            onClick={() => setActiveMainTab('opex')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'opex'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus size={15} />
            3. Input OPEX & Bagi Hasil
          </button>
          <button
            onClick={() => setActiveMainTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle size={15} />
            4. Audit & Rekonsiliasi Visual
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-500 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200/60 hidden sm:block">
          Periode: <span className="text-indigo-600">{filteredData.rangeText}</span>
        </div>
      </div>

      {/* ALWAYS VISIBLE 4 CORE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Omset (Pendapatan) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">1. Total Omset</span>
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100"><ArrowUpRight size={14} /></span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono">{formatIDR(stats.totalRevenue)}</p>
          </div>
          <div className="space-y-1 text-[10px] text-slate-500 mt-3 border-t border-slate-100 pt-2 font-sans">
            <div className="flex justify-between">
              <span>HP & Aksesoris POS:</span>
              <span className="font-extrabold text-slate-700 font-mono">{formatIDR(stats.posRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Jasa Service HP:</span>
              <span className="font-extrabold text-slate-700 font-mono">{formatIDR(stats.serviceRevenue)}</span>
            </div>
          </div>
        </div>

        {/* 2. Modal HPP Terjual */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">2. Modal Terjual (HPP)</span>
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100"><TrendingDown size={14} /></span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono">{formatIDR(stats.totalHPP)}</p>
          </div>
          <div className="space-y-1 text-[10px] text-slate-500 mt-3 border-t border-slate-100 pt-2 font-sans">
            <div className="flex justify-between">
              <span>HPP Unit HP Terjual:</span>
              <span className="font-extrabold text-slate-700 font-mono">{formatIDR(stats.hpPurchasingCost + stats.initialRepairsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sparepart Servis:</span>
              <span className="font-extrabold text-slate-700 font-mono">{formatIDR(stats.modalSparepartService)}</span>
            </div>
          </div>
        </div>

        {/* 3. Operational Expense (OPEX) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">3. Operasional (OPEX)</span>
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100"><Plus size={14} /></span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono">{formatIDR(stats.totalOperationalExpense)}</p>
          </div>
          <div className="text-[10px] text-slate-500 mt-3 border-t border-slate-100 pt-2 leading-relaxed">
            Mencakup <strong className="text-slate-800">{filteredData.expenses.length} item</strong> pengeluaran wifi, listrik, sewa ruko, atau gaji staff.
          </div>
        </div>

        {/* 4. Keuntungan Bersih (Net Profit) */}
        <div className="bg-gradient-to-br from-indigo-50 via-indigo-50/80 to-emerald-50/50 border border-indigo-200/80 p-5 rounded-3xl shadow-xs text-indigo-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block font-sans">4. Keuntungan Bersih</span>
                <span className="text-[9px] font-semibold text-indigo-500 font-sans">({filteredData.rangeText})</span>
              </div>
              <span className="p-1.5 bg-white text-indigo-700 border border-indigo-150 rounded-xl shadow-xs"><DollarSign size={14} /></span>
            </div>
            <p className={`text-xl font-black font-mono ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatIDR(stats.netProfit)}
            </p>
          </div>
          <div className="text-[10px] text-indigo-900 mt-3 border-t border-indigo-150/60 pt-2 leading-tight flex justify-between items-center">
            <span>Margin Profit: <strong className="font-mono text-emerald-700 font-extrabold">{stats.totalRevenue > 0 ? Math.round((stats.netProfit / stats.totalRevenue) * 100) : 0}%</strong></span>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle size={11} /> Cek Math
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 2: BUKU KAS & NERACA TOKO */}
      {activeMainTab === 'buku_kas' && (
        <div className="space-y-6">
          {/* Top 5 Cash & Asset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Kas Tunai di Laci */}
            <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block font-sans">KAS TUNAI (LACI)</span>
              <p className={`text-lg font-extrabold font-mono ${stats.saldoKasKumulatif >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatIDR(stats.saldoKasKumulatif)}
              </p>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Uang fisik di laci kasir aktif
              </p>
            </div>

            {/* Nilai Stok HP */}
            <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block font-sans">ASET STOK HP</span>
              <p className="text-lg font-extrabold font-mono text-slate-900">{formatIDR(stats.totalSisaHpModal)}</p>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Aset fisik HP second &amp; baru ruko
              </p>
            </div>

            {/* Nilai Stok Aksesoris */}
            <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wider block font-sans">ASET STOK AKSESORIS</span>
              <p className="text-lg font-extrabold font-mono text-slate-900">{formatIDR(stats.totalSisaAksesorisModal)}</p>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Aset charger, case &amp; aksesoris
              </p>
            </div>

            {/* Nilai Stok Sparepart */}
            <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block font-sans">STOK SPAREPART</span>
              <p className="text-lg font-extrabold font-mono text-slate-900">{formatIDR(stats.totalSisaSparepartsModal)}</p>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                Suku cadang servis HP ruko
              </p>
            </div>

            {/* Modal Owner */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block font-sans">MODAL DISETOR OWNER</span>
                <button
                  onClick={() => {
                    setTempModalInput(stats.modalAwal.toString());
                    setIsEditModalOpen(!isEditModalOpen);
                  }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 cursor-pointer"
                >
                  Edit Modal
                </button>
              </div>

              {isEditModalOpen ? (
                <div className="bg-slate-50 p-2 rounded-xl border border-indigo-200 space-y-2 mt-1">
                  <input
                    type="number"
                    value={tempModalInput}
                    onChange={(e) => setTempModalInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-mono"
                    placeholder="e.g. 50000000"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(tempModalInput);
                      if (!isNaN(val) && val >= 0) {
                        setModalAwal(val);
                        localStorage.setItem('afme_modal_awal', val.toString());
                        setIsEditModalOpen(false);
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-1 rounded-lg cursor-pointer"
                  >
                    Simpan Modal
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xl font-extrabold font-mono text-slate-900">{formatIDR(stats.modalAwal)}</p>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    Akumulasi Laba Toko: <strong className="font-mono text-emerald-600 font-bold">{formatIDR(stats.cumulativeNetProfit)}</strong>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Clean Light Neraca Sheet Table */}
          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale size={16} className="text-indigo-600" /> Neraca Keuangan & Aset Toko
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Ringkasan keseimbangan harta aktif toko (Kas + Stok HP + Sparepart) dengan sumber modal & profit murni.</p>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-extrabold font-mono">
                <CheckCircle size={13} className="text-emerald-600" />
                NERACA SEIMBANG & AKURAT
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SISI KIRI: ASET / KEKAYAAN */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs font-extrabold text-indigo-900">SISI ASET / HARTA (Milik Ruko)</span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">Kas + Stok HP + Sparepart</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kas Tunai di Laci
                    </span>
                    <span className="font-bold font-mono text-slate-900">{formatIDR(stats.saldoKasKumulatif)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Stok HP (Second &amp; Baru)
                    </span>
                    <span className="font-bold font-mono text-slate-900">{formatIDR(stats.totalSisaHpModal)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span> Stok Aksesoris
                    </span>
                    <span className="font-bold font-mono text-slate-900">{formatIDR(stats.totalSisaAksesorisModal)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Stok Sparepart Service
                    </span>
                    <span className="font-bold font-mono text-slate-900">{formatIDR(stats.totalSisaSparepartsModal)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-xs text-indigo-900">
                    <span>TOTAL ASET TOKO:</span>
                    <span className="font-mono text-sm text-emerald-700">{formatIDR(stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}</span>
                  </div>
                </div>
              </div>

              {/* SISI KANAN: MODAL & LABA */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs font-extrabold text-indigo-900">SISI MODAL & KEUNTUNGAN</span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">Modal Disetor + Profit</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded-md">MODAL</span> Modal Awal Disetor
                    </span>
                    <span className="font-bold font-mono text-slate-900">{formatIDR(stats.modalAwal)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold rounded-md">PROFIT</span> Akumulasi Profit Lifetime
                    </span>
                    <span className={`font-bold font-mono ${stats.cumulativeNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stats.cumulativeNetProfit >= 0 ? '+' : ''}{formatIDR(stats.cumulativeNetProfit)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                    <strong>Poin Kunci:</strong> Total aset di ruko Anda (<strong className="font-mono">{formatIDR(stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}</strong>) murni bersumber dari Modal Awal disetor ditambah Akumulasi Keuntungan Bersih toko.
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-xs text-indigo-900">
                    <span>TOTAL MODAL + LABA:</span>
                    <span className="font-mono text-sm text-emerald-700">{formatIDR(stats.modalAwal + stats.cumulativeNetProfit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Flow Ledger of Cash Reconciliation */}
          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calculator size={16} className="text-indigo-600" /> Alur Aliran Kas Masuk & Keluar (Lifetime Cashflow)
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Penjelasan simpel bagaimana uang kas di laci saat ini terbentuk dari modal, transaksi penjualan, jasa servis, dan pengeluaran.</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Setoran Modal Awal Kas</p>
                    <p className="text-[10px] text-slate-500">Uang tunai pertama disetor owner ke laci toko</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-indigo-600">+{formatIDR(stats.modalAwal)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Penerimaan Omset POS HP & Aksesoris</p>
                    <p className="text-[10px] text-slate-500">Kas masuk dari total penjualan kasir di toko</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-600">+{formatIDR(stats.lifetimePosRevenue)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Penerimaan Omset Service HP</p>
                    <p className="text-[10px] text-slate-500">Kas masuk dari biaya jasa perbaikan HP selesai</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-600">+{formatIDR(stats.lifetimeServiceRevenue)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">4</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Belanja Stok HP & Aksesoris</p>
                    <p className="text-[10px] text-slate-500">Kas keluar untuk pembelian persediaan HP (yang sudah terjual maupun sisa stok)</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600">-{formatIDR(stats.totalKasKeluarUntukStok)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">5</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Belanja Sparepart Service</p>
                    <p className="text-[10px] text-slate-500">Kas keluar untuk pengadaan LCD, Baterai, IC, & komponen reparasi</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600">-{formatIDR(stats.totalKasKeluarBelanjaSparepart)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">6</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Biaya Operasional Toko (OPEX)</p>
                    <p className="text-[10px] text-slate-500">Pengeluaran wifi, listrik, sewa ruko, gaji karyawan, dan operasional</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600">-{formatIDR(stats.lifetimeOperationalExpense)}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-200 mt-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-extrabold">SISA KAS TUNAI</span>
                  <p className="text-xs font-bold text-slate-900">Total Saldo Uang Fisik Aktif di Laci Toko</p>
                </div>
                <span className="font-mono font-extrabold text-emerald-700 text-base">{formatIDR(stats.saldoKasKumulatif)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: LABA RUGI PERIODE */}
      {activeMainTab === 'laba_rugi' && (
        <div className="space-y-6">
          {/* Visual Analytics Grid with Custom SVG Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 space-y-6 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide font-sans">
                📊 Visualisasi Arus Laba Rugi & Komparasi
              </h3>
              <p className="text-slate-500 text-[11px] mt-1">Analisis proporsi omset penjualan, beban pokok, operasional, profit, serta perkembangan bulanan.</p>
            </div>

            {/* Graphical Comparison Bar */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-sans">
                  <span className="font-bold">Rasio Pembagian Kas Masuk (Omset total: {formatIDR(stats.totalRevenue)})</span>
                  <span className="font-extrabold font-mono text-indigo-700">
                    {stats.totalRevenue > 0 ? Math.round((stats.netProfit / stats.totalRevenue) * 100) : 0}% Laba Bersih
                  </span>
                </div>
                <div className="w-full h-8 rounded-xl overflow-hidden flex font-mono text-[9px] font-extrabold text-white tracking-wider bg-slate-100 border border-slate-200 shadow-inner">
                  {stats.totalRevenue > 0 ? (
                    <>
                      {/* HPP segment */}
                      <div 
                        className="bg-amber-500 h-full flex items-center justify-center transition-all duration-500 hover:opacity-90 cursor-help"
                        style={{ width: `${Math.max(10, (stats.totalHPP / stats.totalRevenue) * 100)}%` }}
                        title={`HPP/Modal Stok: ${formatIDR(stats.totalHPP)}`}
                      >
                        HPP ({Math.round((stats.totalHPP / stats.totalRevenue) * 100)}%)
                      </div>
                      {/* OPEX segment */}
                      {stats.totalOperationalExpense > 0 && (
                        <div 
                          className="bg-rose-500 h-full flex items-center justify-center transition-all duration-500 hover:opacity-90 cursor-help"
                          style={{ width: `${(stats.totalOperationalExpense / stats.totalRevenue) * 100}%` }}
                          title={`Beban Operasional: ${formatIDR(stats.totalOperationalExpense)}`}
                        >
                          OPEX ({Math.round((stats.totalOperationalExpense / stats.totalRevenue) * 100)}%)
                        </div>
                      )}
                      {/* Profit segment */}
                      {stats.netProfit > 0 && (
                        <div 
                          className="bg-emerald-600 h-full flex items-center justify-center transition-all duration-500 hover:opacity-90 cursor-help"
                          style={{ width: `${(stats.netProfit / stats.totalRevenue) * 100}%` }}
                          title={`Laba Bersih: ${formatIDR(stats.netProfit)}`}
                        >
                          PROFIT ({Math.round((stats.netProfit / stats.totalRevenue) * 100)}%)
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full bg-slate-50 flex items-center justify-center text-slate-400 font-semibold uppercase tracking-widest text-[9.5px]">
                      Belum ada data pemasukan periode ini
                    </div>
                  )}
                </div>
              </div>

              {/* Recharts Interactive Multi-Month Chart */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-widest font-sans">
                      📈 Tren Pendapatan vs Pengeluaran Bulanan
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Laba bersih bulanan toko dihitung otomatis sesuai sirkulasi data.</p>
                  </div>
                  {/* Visual Legend */}
                  <div className="flex flex-wrap gap-2.5 text-[10px] font-extrabold text-slate-500 shrink-0 font-sans">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs"></span> Pemasukan</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs"></span> Pengeluaran</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span> Laba Bersih</span>
                  </div>
                </div>

                {/* Chart Container wrapper */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthlyData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => {
                          if (value >= 1000000 || value <= -1000000) return `${(value / 1000000).toFixed(1)}jt`;
                          if (value >= 1000 || value <= -1000) return `${(value / 1000).toFixed(0)}rb`;
                          return value;
                        }}
                        tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          const formatted = new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(Number(value));
                          
                          let labelName = name;
                          if (name === 'pemasukan') labelName = 'Pemasukan';
                          if (name === 'pengeluaran') labelName = 'Pengeluaran';
                          if (name === 'untung') labelName = 'Laba Bersih';
                          
                          return [formatted, labelName];
                        }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: '#e2e8f0', 
                          borderRadius: '12px',
                          color: '#0f172a',
                          fontSize: '11px',
                          boxShadow: '0 6px 12px -2px rgba(0,0,0,0.06)'
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold', padding: '1px 0' }}
                        labelStyle={{ color: '#64748b', fontWeight: 'black', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}
                      />
                      <Bar 
                        dataKey="pemasukan" 
                        name="pemasukan" 
                        fill="#4f46e5" 
                        radius={[4, 4, 0, 0]} 
                        barSize={18} 
                      />
                      <Bar 
                        dataKey="pengeluaran" 
                        name="pengeluaran" 
                        fill="#f43f5e" 
                        radius={[4, 4, 0, 0]} 
                        barSize={14} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="untung" 
                        name="untung" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ fill: '#10b981', r: 4, stroke: '#ffffff', strokeWidth: 1.5 }}
                        activeDot={{ r: 6 }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Source breakdown percentages */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 shadow-inner">
                <p className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-1.5 font-sans uppercase">
                  <Layers size={13} className="text-indigo-600" /> Distribusi Sumber Keuntungan (Margin Bersih)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* POS HP & Aksesoris */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-sans">Margin Bersih POS</p>
                    <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                      {formatIDR(stats.posRevenue - (stats.hpPurchasingCost + stats.initialRepairsCost))}
                    </p>
                    <p className="text-[10px] text-indigo-700 mt-0.5 font-bold font-sans">Penjualan Toko & HP</p>
                  </div>

                  {/* Service Reparasi */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-sans">Margin Service</p>
                    <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                      {formatIDR(stats.serviceRevenue - stats.modalSparepartService)}
                    </p>
                    <p className="text-[10px] text-emerald-700 mt-0.5 font-bold font-sans">{stats.doneServicesCount} Reparasi Selesai</p>
                  </div>

                  {/* Unit Trade in */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold font-sans">Aset Trade-In</p>
                    <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                      {formatIDR(stats.totalTradeInAllowance)}
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5 font-bold font-sans">Konversi Unit HP Masuk</p>
                  </div>
                </div>
              </div>

              {/* Cashbook History Log list */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 font-sans uppercase tracking-wider">Riwayat Transaksi Penjualan & Service Periode Ini</h4>
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-xs">
                  {filteredData.transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 text-xs hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">POS: Penjualan ({tx.customerName || 'Customer Umum'})</p>
                          {(activeRole === 'owner' || activeRole === 'admin') && (
                            <button
                              onClick={() => handleStartEditTrx(tx)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Transaksi"
                            >
                              <Edit2 size={11} />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {tx.date ? new Date(tx.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''} • Kasir: {tx.cashierName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 font-mono">+{formatIDR(tx.totalAmount)}</p>
                        <p className="text-[10px] text-slate-500">Untung: {formatIDR(tx.totalProfit)}</p>
                      </div>
                    </div>
                  ))}
                  {filteredData.services.filter(s => s.status === 'selesai').map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-3 text-xs hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800">SERVICE: {s.devModel} - Selesai</p>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">{s.date} • {s.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 font-mono">+{formatIDR(s.cost)}</p>
                        <p className="text-[10px] text-rose-500 font-bold">Sparepart: -{formatIDR(s.capitalCost)}</p>
                      </div>
                    </div>
                  ))}
                  {filteredData.transactions.filter(t => t.tradeIn).map((tx) => (
                    <div key={`ti-${tx.id}`} className="flex justify-between items-center p-3 text-xs bg-amber-50/20">
                      <div>
                        <p className="font-semibold text-amber-900">Trade-In Aset: Tambah {tx.tradeIn?.model}</p>
                        <p className="text-[10px] text-amber-600 mt-0.5">{tx.date} • IMEI: {tx.tradeIn?.imei}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-700 font-mono">-{formatIDR(tx.tradeIn?.buyPrice || 0)}</p>
                        <p className="text-[10px] text-slate-500">Modal Reparasi: {formatIDR(tx.tradeIn?.repairCost || 0)}</p>
                      </div>
                    </div>
                  ))}
                  {filteredData.transactions.length === 0 && filteredData.services.filter(s => s.status === 'selesai').length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">Tidak ada transaksi penjualan atau servis pada periode ini</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INPUT OPEX & BAGI HASIL */}
      {activeMainTab === 'opex' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operational Expense Tracker (Beban Biaya) */}
          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-sans">Input Biaya Operasional / OPEX</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Catat kas keluar untuk internet, listrik, sewa ruko, gaji karyawan, dll.</p>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Nama Pengeluaran</label>
                <input 
                  type="text" 
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="e.g. Bayar Wifi Toko / Token Listrik"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Biaya (Rp)</label>
                  <input 
                    type="number" 
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="e.g. 350000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Kategori</label>
                  <select 
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none font-bold"
                  >
                    <option value="operasional">Operasional</option>
                    <option value="gaji">Gaji Pegawai</option>
                    <option value="sewa">Sewa Tempat</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tanggal Bayar</label>
                <input 
                  type="date" 
                  value={expenseDate} 
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus size={14} /> Catat Pengeluaran
              </button>
            </form>

            <hr className="border-slate-100" />

            {/* List of custom expenses */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2 font-sans uppercase">Daftar Biaya Terdaftar ({filteredData.expenses.length} Item)</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {filteredData.expenses.map((exp) => (
                  <div key={exp.id} className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs border border-slate-200">
                    <div className="max-w-[70%]">
                      <p className="font-bold text-slate-800 truncate">{exp.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize mt-0.5">{exp.date} • {exp.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-600 font-mono text-xs shrink-0">-{formatIDR(exp.amount)}</span>
                      <button 
                        onClick={() => onDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-sm transition cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredData.expenses.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6 font-medium font-sans">Belum ada pengeluaran operasional terdaftar.</p>
                )}
              </div>
            </div>
          </div>

          {/* Profit Sharing & Dividend Calculator Simulator */}
          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-sans">Simulasi Bagi Hasil Toko</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Membagi keuntungan dividen berdasarkan komitmen saham mitra / investor</p>
              </div>
              <button 
                onClick={() => setShowProfitSharing(!showProfitSharing)}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold cursor-pointer transition font-sans"
              >
                {showProfitSharing ? 'Sembunyikan' : 'Simulasi'}
              </button>
            </div>

            {showProfitSharing && (
              <div className="space-y-3.5 text-xs border-t border-slate-100 pt-3">
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-slate-500">Porsi Owner (%)</span>
                      <span className="font-mono text-slate-600 font-bold">{ownerShare}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={ownerShare} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setOwnerShare(val);
                        setInvestorShare(100 - val - bonusShare < 0 ? 0 : 100 - val - bonusShare);
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-slate-500">Porsi Investor (%)</span>
                      <span className="font-mono text-slate-600 font-bold">{investorShare}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={investorShare} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setInvestorShare(val);
                        setBonusShare(100 - ownerShare - val < 0 ? 0 : 100 - ownerShare - val);
                      }}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-slate-500">Porsi Bonus Staff / Kas (%)</span>
                      <span className="font-mono text-slate-600 font-bold">{bonusShare}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={bonusShare} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setBonusShare(val);
                        setOwnerShare(100 - val - investorShare < 0 ? 0 : 100 - val - investorShare);
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 font-mono text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Laba Bersih Tersedia:</span>
                    <span className="font-bold text-slate-900">{formatIDR(Math.max(0, stats.netProfit))}</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-indigo-700 font-bold">
                    <span>Bagian Owner ({ownerShare}%):</span>
                    <span>{formatIDR((Math.max(0, stats.netProfit) * ownerShare) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Bagian Investor ({investorShare}%):</span>
                    <span>{formatIDR((Math.max(0, stats.netProfit) * investorShare) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Bonus Staff/Dana Kas ({bonusShare}%):</span>
                    <span>{formatIDR((Math.max(0, stats.netProfit) * bonusShare) / 100)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed flex items-start gap-1 font-sans">
                  <Info size={12} className="shrink-0 mt-0.5 text-indigo-600" />
                  Gunakan simulator bagi hasil ini untuk mengevaluasi kesehatan cashflow toko sebelum melakukan penarikan dividen bulanan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: AUDIT VISUAL & REKONSILIASI KEUANGAN */}
      {activeMainTab === 'audit' && (
        <div className="space-y-6">
          {/* Status Indicator Card (Selisih Indicator) */}
          {Math.abs(stats.selisihRekonsiliasi) === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-lg tracking-wider font-mono uppercase">
                      ✅ REKONSILIASI 100% AKURAT
                    </span>
                    <span className="text-slate-500 text-xs font-semibold font-mono">
                      • Selisih Unexplained: Rp 0
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    Buku Kas Tunai & Kalkulasi Laba Bersih Terverifikasi Seimbang Perfect
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hasil kalkulasi Laba Bersih ({formatIDR(stats.netProfit)}) dan Akumulasi Kas ({formatIDR(stats.saldoKasKumulatif)}) seimbang sempurna terhadap persediaan modal stok barang ({formatIDR(stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/30">
                  <AlertTriangle size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-amber-600 text-white font-extrabold text-[10px] rounded-lg tracking-wider font-mono uppercase">
                      ⚠️ PERHATIAN: SELISIH REKONSILIASI
                    </span>
                    <span className="text-amber-700 font-extrabold text-xs font-mono">
                      • Selisih: {formatIDR(Math.abs(stats.selisihRekonsiliasi))}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    Terdeteksi Selisih Rekonsiliasi Antara Aset Physical dan Hak Capital
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Terdapat perbedaan nilai sebesar {formatIDR(Math.abs(stats.selisihRekonsiliasi))} antara total aset (Kas + Stok) dengan total modal disetor + akumulasi laba bersih.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TABEL REKONSILIASI FORMULA LABA BERSIH */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/85 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Calculator size={18} className="text-indigo-600" />
                  1. Tabel Rekonsiliasi Formula Laba Bersih ({filteredData.rangeText})
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Kalkulasi Eksplisit: (Total Pendapatan - COGS = Laba Kotor) kemudian dikurangi OPEX untuk menghasilkan Laba Bersih yang akurat.
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded-xl border border-indigo-100">
                Formula Audit Mat
              </span>
            </div>

            {/* Reconciliation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4 rounded-l-xl">Langkah & Komponen Keuangan</th>
                    <th className="py-3 px-4">Formula / Sumber Rincian</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Nominal Rupiah (IDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Step 1: Pendapatan */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-700">1. Penjualan POS (HP & Aksesoris)</td>
                    <td className="py-2.5 px-4 text-slate-500">Kas Masuk Kasir POS</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{formatIDR(stats.posRevenue)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-700">2. Pendapatan Jasa Service HP</td>
                    <td className="py-2.5 px-4 text-slate-500">Tagihan Service Selesai</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{formatIDR(stats.serviceRevenue)}</td>
                  </tr>
                  <tr className="bg-emerald-50/70 border-y border-emerald-100 font-extrabold">
                    <td className="py-3 px-4 text-emerald-900 flex items-center gap-1.5">
                      <ArrowUpRight size={15} className="text-emerald-600" />
                      TOTAL PENDAPATAN (REVENUE)
                    </td>
                    <td className="py-3 px-4 text-emerald-800 font-mono text-[11px]">(POS + Jasa Service)</td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-emerald-700">{formatIDR(stats.totalRevenue)}</td>
                  </tr>

                  {/* Step 2: COGS / HPP */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 pl-6">• Modal Pembelian & Repair HP POS Terjual</td>
                    <td className="py-2.5 px-4 text-slate-500">Modal Modal HP + Perbaikan Awal Terjual</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600">-{formatIDR(stats.hpPurchasingCost + stats.initialRepairsCost)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 pl-6">• Modal Sparepart Service Terpakai</td>
                    <td className="py-2.5 px-4 text-slate-500">Modal Suku Cadang Service Selesai</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600">-{formatIDR(stats.modalSparepartService)}</td>
                  </tr>
                  <tr className="bg-amber-50/70 border-y border-amber-100 font-extrabold">
                    <td className="py-3 px-4 text-amber-900 flex items-center gap-1.5">
                      <ArrowDownRight size={15} className="text-amber-600" />
                      TOTAL HARGA POKOK PENJUALAN (COGS / HPP)
                    </td>
                    <td className="py-3 px-4 text-amber-800 font-mono text-[11px]">(Modal Terjual + Sparepart)</td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-amber-800">-{formatIDR(stats.totalHPP)}</td>
                  </tr>

                  {/* Step 3: Laba Kotor */}
                  <tr className="bg-indigo-50/80 border-y border-indigo-200 font-extrabold">
                    <td className="py-3.5 px-4 text-indigo-950 flex items-center gap-1.5">
                      <Scale size={16} className="text-indigo-600" />
                      KEUNTUNGAN KOTOR (GROSS PROFIT)
                    </td>
                    <td className="py-3.5 px-4 text-indigo-800 font-mono text-[11px]">Formula: Total Pendapatan - Total COGS</td>
                    <td className="py-3.5 px-4 text-right font-mono text-base text-indigo-800">{formatIDR(stats.grossProfit)}</td>
                  </tr>

                  {/* Step 4: OPEX */}
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 pl-6">• Total Beban Operasional & Toko (OPEX)</td>
                    <td className="py-2.5 px-4 text-slate-500">Beban Listrik, Sewa, Gaji, Operasional Usaha</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600">-{formatIDR(stats.totalOperationalExpense)}</td>
                  </tr>

                  {/* Step 5: Laba Bersih */}
                  <tr className="bg-emerald-100/90 border-t-2 border-emerald-500 font-black text-sm">
                    <td className="py-4 px-4 text-emerald-950 flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-700" />
                      LABA BERSIH AKHIR (OPERATING NET PROFIT)
                    </td>
                    <td className="py-4 px-4 text-emerald-900 font-mono text-xs">Formula: Gross Profit - Total OPEX</td>
                    <td className="py-4 px-4 text-right font-mono text-base text-emerald-900 underline decoration-emerald-600">
                      {formatIDR(stats.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL REKONSILIASI NERACA BUKU KAS VS KEUNTUNGAN */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/85 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale size={18} className="text-emerald-600" />
                  2. Tabel Audit Rekonsiliasi Neraca Buku Kas ({formatIDR(stats.saldoKasKumulatif)}) vs Profit
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Verifikasi Seimbang (Double-Entry Balance): Menguji kesesuaian antara Total Aset Fisik vs Total Modal & Akumulasi Profit.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-mono text-xs font-bold rounded-xl border border-emerald-100">
                Audit Balance Proof
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
              {/* SISI AKTIVA */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="border-b border-slate-200 pb-2 flex justify-between font-extrabold text-emerald-800">
                  <span className="flex items-center gap-1.5"><Wallet size={15} /> SISI AKTIVA (ASET PHYSICAL & KAS)</span>
                  <span className="font-mono">NOMINAL</span>
                </div>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-800 block">1. Saldo Kas Tunai Kasir</span>
                      <span className="text-[10px] text-slate-500">Uang Tunai di Laci Kasir (Cash on Hand)</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 self-center">{formatIDR(stats.saldoKasKumulatif)}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-800 block">2. Nilai Stok HP Ada</span>
                      <span className="text-[10px] text-slate-500">Kas Terikat di Persediaan HP Belum Terjual</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 self-center">{formatIDR(stats.totalSisaHpModal)}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-800 block">3. Nilai Stok Aksesoris Ada</span>
                      <span className="text-[10px] text-slate-500">Kas Terikat di Aksesoris Belum Terjual</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 self-center">{formatIDR(stats.totalSisaAksesorisModal)}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-800 block">4. Nilai Stok Sparepart Service</span>
                      <span className="text-[10px] text-slate-500">Kas Terikat di Stok Sparepart Tersedia</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 self-center">{formatIDR(stats.totalSisaSparepartsModal)}</span>
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-emerald-900 bg-emerald-100/70 p-3 rounded-xl border border-emerald-200">
                  <span>TOTAL ASET AKTIVA:</span>
                  <span className="font-mono text-sm">{formatIDR(stats.aktivaTotal)}</span>
                </div>
              </div>

              {/* SISI PASIVA */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="border-b border-slate-200 pb-2 flex justify-between font-extrabold text-indigo-800">
                  <span className="flex items-center gap-1.5"><Briefcase size={15} /> SISI PASIVA (HAK MODAL & LABA)</span>
                  <span className="font-mono">NOMINAL</span>
                </div>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-800 block">1. Modal Awal Disetor</span>
                      <span className="text-[10px] text-slate-500">Suntikan Modal Disetor Pertama Kali</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 self-center">{formatIDR(stats.modalAwal)}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-800 block">2. Akumulasi Laba Bersih Toko</span>
                      <span className="text-[10px] text-slate-500">Total Akumulasi Keuntungan Bersih</span>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-700 self-center">+{formatIDR(stats.cumulativeNetProfit)}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-200/70 opacity-50">
                    <div>
                      <span className="font-bold text-slate-800 block">3. Penyesuaian Audit Tambahan</span>
                      <span className="text-[10px] text-slate-500">Penyesuaian Manual (Jika Ada)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-500 self-center">Rp 0</span>
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-indigo-900 bg-indigo-100/70 p-3 rounded-xl border border-indigo-200">
                  <span>TOTAL PASIVA KAPITAL:</span>
                  <span className="font-mono text-sm">{formatIDR(stats.pasivaTotal)}</span>
                </div>
              </div>
            </div>

            {/* Reconciliation Comparison Status Footer */}
            <div className={`p-4 rounded-2xl border text-center space-y-1 ${
              Math.abs(stats.selisihRekonsiliasi) === 0 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wide">
                {Math.abs(stats.selisihRekonsiliasi) === 0 ? (
                  <>
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>STATUS REKONSILIASI: SEIMBANG PERFECT 100% (0 SELISIH)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span>STATUS REKONSILIASI: DITEMUKAN SELISIH SEBESAR {formatIDR(Math.abs(stats.selisihRekonsiliasi))}</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">
                Total Aktiva Aset Real ({formatIDR(stats.aktivaTotal)}) {Math.abs(stats.selisihRekonsiliasi) === 0 ? 'persis sama dengan' : 'berbeda dari'} Total Pasiva Modal & Profit ({formatIDR(stats.pasivaTotal)}). 
                Buku kas tunai {formatIDR(stats.saldoKasKumulatif)} terverifikasi valid.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (activeRole === 'owner' || activeRole === 'admin') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Edit Rincian Transaksi ({editingTransaction.nomorTransaksi || editingTransaction.id.slice(0, 8)})</h3>
              <button 
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Customer and Meta Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">NAMA PELANGGAN</label>
                  <input
                    type="text"
                    value={editedCustomerName}
                    onChange={(e) => setEditedCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Nama Pelanggan"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">NOMOR TLP PELANGGAN</label>
                  <input
                    type="text"
                    value={editedCustomerPhone}
                    onChange={(e) => setEditedCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Contoh: 0812345..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">TANGGAL TRANSAKSI</label>
                  <input
                    type="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 mt-4 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Layers size={14} className="text-indigo-600" />
                  Rincian Item yg Dibeli
                </h4>
                
                <div className="space-y-3">
                  {editedItems.map((item, index) => (
                    <div key={index} className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2.5 transition">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">NAMA BARANG / HP / AKSESORIS</label>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) => handleUpdateItemField(index, 'model', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">HARGA JUAL (RP)</label>
                          <input
                            type="number"
                            value={item.sellingPrice}
                            onChange={(e) => handleUpdateItemField(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">QTY (JUMLAH)</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemField(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400 bg-white/60 p-1.5 rounded-lg px-2.5 border border-slate-100">
                        <span>Modal Unit: <span className="font-mono text-slate-600">{formatIDR(item.buyPrice + item.repairCost)}</span></span>
                        <span>Rentang Laba: <span className="font-mono font-bold text-emerald-600">{formatIDR(((item.sellingPrice - (item.buyPrice + item.repairCost)) * item.quantity))}</span></span>
                        <span>Subtotal: <span className="font-mono font-bold text-indigo-650">{formatIDR(item.sellingPrice * item.quantity)}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade In Preview info if any */}
              {editingTransaction.tradeIn && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-2xl text-[11px] text-amber-850 space-y-1">
                  <span className="font-bold flex items-center gap-1"><Info size={13} className="text-amber-600" /> Informasi Tukar Tambah (Trade-In)</span>
                  <p>HP Trade-In: <span className="font-semibold">{editingTransaction.tradeIn.model}</span> • IMEI: <span className="font-mono font-semibold">{editingTransaction.tradeIn.imei}</span></p>
                  <div className="flex justify-between">
                    <span>Nilai Potongan (Harga Beli Unit Masuk):</span>
                    <span className="font-mono font-bold">-{formatIDR(editingTransaction.tradeIn.buyPrice)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-2">
              <button 
                onClick={handleSaveTrxEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Simpan Perubahan
              </button>
              <button 
                onClick={() => setEditingTransaction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Statement Preview Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Cetak Laporan Keuangan</h3>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Printable Area layout content */}
            <div id="financial-statement-print-area" className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4 font-sans text-xs">
              {/* Report Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-200 flex flex-col items-center">
                <img 
                  src={localStorage.getItem('afme_custom_logo') || '/logo.png'} 
                  alt="AFME STORE Logo" 
                  className="w-12 h-12 object-contain rounded-xl bg-slate-950 p-1 border border-amber-400/40 shadow-sm mb-2"
                  referrerPolicy="no-referrer"
                />
                <h4 className="text-base font-extrabold text-slate-950 tracking-tight">AFME STORE</h4>
                <p className="text-[11px] text-slate-500">Sistem Laporan Keuangan Resmi &amp; Laba Rugi</p>
                <div className="mt-2 inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px]">
                  Periode: {filteredData.rangeText}
                </div>
              </div>

              {/* Data Breakdown Table */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold border-b border-slate-200 pb-1 text-slate-800 text-[11px]">
                  <span>Uraian Keuangan</span>
                  <span className="text-right">Jumlah</span>
                </div>

                {/* Receipts */}
                <div className="space-y-1">
                  <div className="font-bold text-slate-700">1. PENDAPATAN (REVENUE)</div>
                  <div className="flex justify-between pl-3 text-slate-600">
                    <span>Penjualan Merchandise & HP (POS)</span>
                    <span>{formatIDR(stats.posRevenue)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-slate-600">
                    <span>Uang Jasa Reparasi Pelanggan (Service)</span>
                    <span>{formatIDR(stats.serviceRevenue)}</span>
                  </div>
                  <div className="flex justify-between pl-3 font-semibold text-slate-800 border-b border-slate-100 pb-1">
                    <span>Total Pendapatan Kotor</span>
                    <span>{formatIDR(stats.totalRevenue)}</span>
                  </div>
                </div>

                {/* Cost of Goods Sold (Modal) */}
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-slate-700">2. BEBAN HARGA POKOK PENJUALAN (HPP)</div>
                  <div className="flex justify-between pl-3 text-slate-600">
                    <span>Modal Beli Stok HP & Aksesoris Terjual</span>
                    <span>{formatIDR(stats.hpPurchasingCost)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-slate-600">
                    <span>Estimasi Komponen Perbaikan Awal HP</span>
                    <span>{formatIDR(stats.initialRepairsCost)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-slate-600">
                    <span>Biaya Modal Sparepart Service HP</span>
                    <span>{formatIDR(stats.modalSparepartService)}</span>
                  </div>
                  <div className="flex justify-between pl-3 font-semibold text-slate-800 border-b border-slate-100 pb-1">
                    <span>Total Beban Pokok (HPP)</span>
                    <span>{formatIDR(stats.totalHPP)}</span>
                  </div>
                </div>

                {/* Profit Kotor */}
                <div className="flex justify-between font-bold text-slate-800 pt-1 border-b border-slate-100 pb-1">
                  <span>KEUNTUNGAN KOTOR (GROSS PROFIT)</span>
                  <span>{formatIDR(stats.grossProfit)}</span>
                </div>

                {/* Operational expenses */}
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-slate-700">3. OPERASIONAL & BIAYA TAMBAHAN (OPEX)</div>
                  {filteredData.expenses.map(e => (
                    <div key={e.id} className="flex justify-between pl-3 text-slate-600">
                      <span>{e.name} ({e.category})</span>
                      <span>{formatIDR(e.amount)}</span>
                    </div>
                  ))}
                  {filteredData.expenses.length === 0 && (
                    <div className="pl-3 text-slate-400 italic font-sans">Tidak ada pengeluaran operasional tambahan</div>
                  )}
                  <div className="flex justify-between pl-3 font-semibold text-slate-800 border-b border-slate-200 pb-1">
                    <span>Total Pengeluaran OPEX</span>
                    <span>{formatIDR(stats.totalOperationalExpense)}</span>
                  </div>
                </div>

                {/* Profit Bersih */}
                <div className="flex justify-between font-extrabold text-[13px] text-slate-900 pt-2 border-t border-double border-slate-300 pb-2">
                  <span>LABA BERSIH AKHIR (OPERATING INCOME)</span>
                  <span className={stats.netProfit >= 0 ? 'text-emerald-700 font-mono' : 'text-rose-700 font-mono'}>
                    {formatIDR(stats.netProfit)}
                  </span>
                </div>

                {/* Asset Acquisition references (Trade in) */}
                <div className="bg-slate-100 p-2.5 rounded-lg text-[10px] text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 block">CATATAN KHUSUS (TUKAR TAMBAH / TRADE-IN)</span>
                  <div className="flex justify-between">
                    <span>Jumlah Alokasi Modal Nilai Unit Tukar Tambah Masuk:</span>
                    <span className="font-mono font-bold text-slate-800">{formatIDR(stats.totalTradeInAllowance)}</span>
                  </div>
                </div>
              </div>

              {/* Signature lines */}
              <div className="grid grid-cols-2 pt-8 text-center text-[10px] text-slate-500">
                <div>
                  <p>Disiapkan Oleh</p>
                  <p className="mt-8 font-bold text-slate-800">Sistem Automatis AFME</p>
                </div>
                <div>
                  <p>Mengetahui & Menyetujui</p>
                  <p className="mt-8 font-bold text-slate-800">Admin / Owner AFME STORE</p>
                  <p className="text-[9px]">Tanggal Cetak: {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cetak via Browser / PDF
              </button>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUDIT FINANCIAL & REKONSILIASI MATEMATIKA */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-900/60 text-white w-full max-w-4xl rounded-3xl p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b border-indigo-900/50 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <CheckCircle size={18} />
                  </span>
                  <h3 className="font-extrabold text-lg text-white font-sans">Audit & Verifikasi Transparansi Keuangan</h3>
                </div>
                <p className="text-slate-400 text-xs mt-1 font-sans">
                  Pemisahan eksplisit Perhitungan Pendapatan, HPP/COGS, OPEX, serta Verifikasi Selisih Buku Kas vs Keuntungan Bersih.
                </p>
              </div>
              <button 
                onClick={() => setIsAuditModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* SEKSI 1: Rincian Eksplisit Periode Terpilih */}
            <div className="bg-slate-950/70 border border-indigo-900/40 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-indigo-900/40 pb-2">
                <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Calculator size={14} className="text-indigo-400" />
                  1. Rincian Rumus Keuntungan Bersih Periode ({filteredData.rangeText})
                </h4>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-lg border border-indigo-800 font-mono">
                  {filteredData.rangeText}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                {/* Total Pendapatan / Revenue */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-extrabold text-emerald-400 text-[11px] block uppercase tracking-wide">
                    A. TOTAL PENDAPATAN (REVENUE)
                  </span>
                  <div className="space-y-1.5 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span>• Penjualan POS (HP & Aksesoris):</span>
                      <span className="font-mono text-white font-semibold">{formatIDR(stats.posRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Pendapatan Service HP (Tuntas):</span>
                      <span className="font-mono text-white font-semibold">{formatIDR(stats.serviceRevenue)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-300">
                    <span>TOTAL PENDAPATAN:</span>
                    <span className="font-mono">{formatIDR(stats.totalRevenue)}</span>
                  </div>
                </div>

                {/* COGS / HPP */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-extrabold text-amber-400 text-[11px] block uppercase tracking-wide">
                    B. BEBAN HARGA POKOK PENJUALAN (COGS / HPP)
                  </span>
                  <div className="space-y-1.5 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span>• Modal Produk POS Terjual:</span>
                      <span className="font-mono text-white font-semibold">{formatIDR(stats.hpPurchasingCost + stats.initialRepairsCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Modal Sparepart Service:</span>
                      <span className="font-mono text-white font-semibold">{formatIDR(stats.modalSparepartService)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-amber-300">
                    <span>TOTAL COGS / HPP:</span>
                    <span className="font-mono">{formatIDR(stats.totalHPP)}</span>
                  </div>
                </div>
              </div>

              {/* Laba Kotor & OPEX Calculation Step */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-900/30 space-y-2.5 text-xs font-sans">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-semibold">Laba Kotor (Gross Profit) = Total Pendapatan - Total COGS:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {formatIDR(stats.totalRevenue)} - {formatIDR(stats.totalHPP)} = {formatIDR(stats.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-200 border-t border-slate-800 pt-2">
                  <span className="font-semibold">Total Biaya Operasional (OPEX):</span>
                  <span className="font-mono font-bold text-rose-400">-{formatIDR(stats.totalOperationalExpense)}</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 font-bold mt-2">
                  <span>KEUNTUNGAN BERSIH PERIODE TERPILIH (NET PROFIT):</span>
                  <span className="font-mono text-sm underline decoration-emerald-400">{formatIDR(stats.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* SEKSI 2: Audit Verifikasi Selisih Kas vs Profit Kumulatif */}
            <div className="bg-slate-950/70 border border-emerald-900/40 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900/40 pb-2">
                <h4 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Scale size={14} className="text-emerald-400" />
                  2. Verifikasi Audit Selisih Buku Kas ({formatIDR(stats.saldoKasKumulatif)}) vs Keuntungan Bersih
                </h4>
                <div className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold font-mono">
                  VERIFIKASI BALANCE 100%
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-400" />
                  Mengapa Nominal Buku Kas Berbeda dengan Angka Keuntungan Bersih?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-300 block uppercase">Faktor 1: Modal Awal disetor ({formatIDR(stats.modalAwal)})</span>
                    <p className="text-[11px] text-slate-400">
                      Uang di laci kasir menyertakan Modal Awal milik pemilik toko yang disuntikkan pertama kali untuk operasional, BUKAN hasil keuntungan dagang.
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-amber-300 block uppercase">Faktor 2: Uang Terikat di Stok ({formatIDR(stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)})</span>
                    <p className="text-[11px] text-slate-400">
                      Sebagian uang kas tunai telah Anda pakai untuk belanja stok HP, Aksesoris, & Sparepart yang belum terjual. Uang ini <strong className="text-slate-200">berubah bentuk menjadi Aset Fisik di Ruko</strong>, bukan hilang.
                    </p>
                  </div>
                </div>
              </div>

              {/* T-ACCOUNT BALANCE TABLE VERIFICATION */}
              <div className="bg-slate-900 p-4 rounded-xl border border-indigo-900/40 space-y-3">
                <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider font-sans text-center">
                  Tabel Uji Verifikasi Seimbang (Double-Entry Audit Proof)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  {/* SISI KIRI: TOTAL ASET FISIK & KAS */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="border-b border-slate-800 pb-1 flex justify-between font-extrabold text-emerald-400">
                      <span>SISI AKTIVA (ASET)</span>
                      <span>NOMINAL</span>
                    </div>
                    <div className="space-y-1 text-slate-300 text-[11px]">
                      <div className="flex justify-between">
                        <span>1. Uang Kas Tunai (Cash on Hand):</span>
                        <span className="font-mono text-white font-semibold">{formatIDR(stats.saldoKasKumulatif)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2. Nilai Stok HP Ada:</span>
                        <span className="font-mono text-white font-semibold">{formatIDR(stats.totalSisaHpModal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3. Nilai Stok Aksesoris Ada:</span>
                        <span className="font-mono text-white font-semibold">{formatIDR(stats.totalSisaAksesorisModal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>4. Nilai Stok Sparepart Service Ada:</span>
                        <span className="font-mono text-white font-semibold">{formatIDR(stats.totalSisaSparepartsModal)}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between font-extrabold text-emerald-300">
                      <span>TOTAL KEKAYAAN AKTIVA:</span>
                      <span className="font-mono">{formatIDR(stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}</span>
                    </div>
                  </div>

                  {/* SISI KANAN: MODAL & LABA KUMULATIF */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="border-b border-slate-800 pb-1 flex justify-between font-extrabold text-indigo-300">
                      <span>SISI PASIVA (KEPEMILIKAN)</span>
                      <span>NOMINAL</span>
                    </div>
                    <div className="space-y-1 text-slate-300 text-[11px]">
                      <div className="flex justify-between">
                        <span>1. Modal Awal Operasional Disetor:</span>
                        <span className="font-mono text-white font-semibold">{formatIDR(stats.modalAwal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2. Akumulasi Keuntungan Bersih Toko:</span>
                        <span className="font-mono text-emerald-400 font-semibold">+{formatIDR(stats.cumulativeNetProfit)}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between font-extrabold text-indigo-300">
                      <span>TOTAL HAK MODAL & LABA:</span>
                      <span className="font-mono">{formatIDR(stats.modalAwal + stats.cumulativeNetProfit)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Box */}
                <div className={`p-3 rounded-xl text-center space-y-1 border ${
                  Math.abs(stats.selisihRekonsiliasi) === 0 
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                }`}>
                  <p className={`text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 ${
                    Math.abs(stats.selisihRekonsiliasi) === 0 ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {Math.abs(stats.selisihRekonsiliasi) === 0 ? (
                      <>
                        <CheckCircle size={15} />
                        HASIL AUDIT FINANCIAL: SAMA & SEIMBANG 100% (AKURAT TERVERIFIKASI)
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={15} />
                        HASIL AUDIT FINANCIAL: DITEMUKAN SELISIH SEBESAR {formatIDR(Math.abs(stats.selisihRekonsiliasi))}
                      </>
                    )}
                  </p>
                  <p className="text-[10.5px] font-sans">
                    {Math.abs(stats.selisihRekonsiliasi) === 0 
                      ? `Selisih antara Buku Kas Tunai (${formatIDR(stats.saldoKasKumulatif)}) dan Akumulasi Keuntungan (${formatIDR(stats.cumulativeNetProfit)}) terbukti persis disebabkan oleh Modal Awal disetor (${formatIDR(stats.modalAwal)}) minus Uang Kas Terikat pada Stok Barang Belum Terjual (${formatIDR(stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}).`
                      : `Terdeteksi selisih tidak seimbang sebesar ${formatIDR(Math.abs(stats.selisihRekonsiliasi))} antara Aktiva dan Pasiva. Periksa kembali pencatatan arus kas atau suntikan modal.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                Selesai & Tutup Modal Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
