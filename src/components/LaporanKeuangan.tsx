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
  CheckCircle
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
  onUpdateTransaction
}: LaporanKeuanganProps) {
  // Filters State
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
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

  // Tab Buku Kas & Neraca State
  const [activeCashTab, setActiveCashTab] = useState<'neraca' | 'arus_kas' | 'panduan'>('neraca');

  // Transaction Editing State (for Owner & Admin)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editedCustomerName, setEditedCustomerName] = useState('');
  const [editedCustomerPhone, setEditedCustomerPhone] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedItems, setEditedItems] = useState<TransactionItem[]>([]);

  const handleStartEditTrx = (tx: Transaction) => {
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
    if (!editingTransaction) return;

    // Recalculate values
    let cartSubtotal = 0;
    let profit = 0;
    editedItems.forEach((item) => {
      cartSubtotal += item.sellingPrice * item.quantity;
      const itemCost = item.buyPrice + item.repairCost;
      profit += (item.sellingPrice - itemCost) * item.quantity;
    });

    const finalTotal = Math.max(0, cartSubtotal - (editingTransaction.tradeIn ? editingTransaction.tradeIn.buyPrice : 0));

    const updatedTrx: Transaction = {
      ...editingTransaction,
      customerName: editedCustomerName.trim() || 'Pelanggan Umum',
      customerPhone: editedCustomerPhone.trim() || '08123456789',
      date: editedDate ? new Date(editedDate).toISOString() : editingTransaction.date,
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
    let start = new Date();
    let end = new Date();

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      // Start of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'custom') {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const checkDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (period === 'today' || period === 'custom') {
        return d >= start && d <= end;
      }
      return d >= start && d <= now;
    };

    const filterTransactions = transactions.filter(t => checkDate(t.date));
    const filterServices = services.filter(s => checkDate(s.date));
    const filterExpenses = expenses.filter(e => checkDate(e.date));

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
              ? 'Bulan Ini (Mulai Tanggal 1)' 
              : 'Tahun Ini'
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
    
    // a) Nilai total stok yang tersedia (Asset Persediaan Aktif HP & Aksesoris)
    const totalSisaPersediaanModal = products.reduce((sum, p) => {
      if (p.status === 'available') {
        if (p.type === 'iphone') {
          return sum + p.buyPrice + (p.repairCost || 0);
        } else {
          return sum + (p.buyPrice * (p.stock || 0));
        }
      }
      return sum;
    }, 0);

    // b) Nilai total stok sparepart yang tersedia (Asset Persediaan Suku Cadang)
    const totalSisaSparepartsModal = spareparts.reduce((sum, sp) => sum + (sp.buyPrice * sp.stock), 0);

    // c) Total modal belanja seluruh stok HP & aksesoris yang pernah didaftarkan
    const totalBeliIPhoneAvailableAndSold = products.reduce((sum, p) => {
      if (p.type === 'iphone') {
        return sum + p.buyPrice + (p.repairCost || 0);
      } else {
        return sum + (p.buyPrice * (p.stock || 0));
      }
    }, 0);

    let totalBeliAksesorisSold = 0;
    transactions.forEach(tx => {
      tx.items.forEach(it => {
        if (it.type === 'aksesoris') {
          const matchedProduct = products.find(p => p.id === it.productId);
          const actualBuyPrice = matchedProduct ? matchedProduct.buyPrice : it.buyPrice;
          totalBeliAksesorisSold += actualBuyPrice * it.quantity;
        }
      });
    });

    const totalKasKeluarUntukStok = totalBeliIPhoneAvailableAndSold + totalBeliAksesorisSold;

    // d) Total modal belanja spareparts/suku cadang (yang masih ada di stok + yang sudah terpakai)
    const lifetimeSparepartService = services.filter(s => s.status === 'selesai').reduce((sum, s) => sum + s.capitalCost, 0);
    const totalKasKeluarBelanjaSparepart = totalSisaSparepartsModal + lifetimeSparepartService;

    // Hitung sisa kas berjalan (Cash on Hand) secara kumulatif toko (LIFETIME CASH RECONCILIATION)
    const lifetimePosRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const lifetimeServiceRevenue = services.filter(s => s.status === 'selesai').reduce((sum, s) => sum + s.cost, 0);
    const lifetimeOperationalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    const saldoKasKumulatif = modalAwal + lifetimePosRevenue + lifetimeServiceRevenue - totalKasKeluarUntukStok - totalKasKeluarBelanjaSparepart - lifetimeOperationalExpense;
    const cumulativeNetProfit = lifetimePosRevenue + lifetimeServiceRevenue - (totalKasKeluarUntukStok - totalSisaPersediaanModal) - lifetimeSparepartService - lifetimeOperationalExpense;

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
      totalSisaPersediaanModal,
      totalSisaSparepartsModal,
      totalKasKeluarUntukStok,
      totalKasKeluarBelanjaSparepart,
      lifetimePosRevenue,
      lifetimeServiceRevenue,
      lifetimeSparepartService,
      lifetimeOperationalExpense,
      saldoKasKumulatif,
      cumulativeNetProfit
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
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-505">
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

      {/* SECTION: INTEGRASI BUKU KAS & MODAL (LIFETIME ACCOUNTING) */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-indigo-900/30 pb-4">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2 text-indigo-150">
              <Wallet size={18} className="text-emerald-400" /> Buku Kas Utama, Permodalan & Neraca Toko
            </h3>
            <p className="text-slate-300 text-xs mt-0.5 font-sans leading-relaxed">
              Pusat keuangan yang menghubungkan modal usaha, sisa uang kas riil di laci, nilai aset barang etalase, dan keuntungan murni Anda.
            </p>
          </div>
          
          {/* TAB BUTTONS */}
          <div className="flex flex-wrap items-center bg-slate-950/80 p-1 rounded-xl border border-indigo-900/40 gap-1">
            <button
              onClick={() => setActiveCashTab('neraca')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeCashTab === 'neraca' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-indigo-950/40'
              }`}
            >
              <Scale size={13} />
              1. Neraca & Persediaan
            </button>
            <button
              onClick={() => setActiveCashTab('arus_kas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeCashTab === 'arus_kas' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-indigo-950/40'
              }`}
            >
              <Calculator size={13} />
              2. Aliran Kas Masuk-Keluar
            </button>
            <button
              onClick={() => setActiveCashTab('panduan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeCashTab === 'panduan' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-indigo-950/40'
              }`}
            >
              <HelpCircle size={13} />
              3. Panduan Pemula
            </button>
          </div>
        </div>

        {/* TAB CONTENT 1: NERACA & PERSEDIAAN */}
        {activeCashTab === 'neraca' && (
          <div className="space-y-6">
            {/* Quick Summary Cards (3 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Card 1: Pengelolaan Permodalan */}
              <div className="bg-slate-950/45 border border-indigo-900/30 rounded-2xl p-4.5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">MODAL USAHA DISUKAI (EQUITY)</span>
                  <button 
                    onClick={() => {
                      setTempModalInput(stats.modalAwal.toString());
                      setIsEditModalOpen(!isEditModalOpen);
                    }}
                    className="text-indigo-300 hover:text-white text-[10px] font-bold flex items-center gap-1 bg-indigo-955/65 hover:bg-indigo-900/60 px-2 py-1 rounded-lg transition border border-indigo-900/30 cursor-pointer font-sans"
                  >
                    <Edit2 size={9} /> Atur Modal
                  </button>
                </div>

                {isEditModalOpen ? (
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-indigo-500/30 space-y-2">
                    <p className="text-[10px] text-slate-300 font-sans">Ubah modal awal disetor untuk operasional toko:</p>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        value={tempModalInput}
                        onChange={(e) => setTempModalInput(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs text-white w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
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
                        className="bg-indigo-605 hover:bg-indigo-705 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-slate-100 font-mono">{formatIDR(stats.modalAwal)}</p>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">Uang milik owner yang disetor pertama kali untuk memulai operasional.</p>
                  </div>
                )}
              </div>

              {/* Card 2: Alokasi Modal Stok HP / Aksesoris (Asset Value) */}
              <div className="bg-slate-950/45 border border-indigo-900/30 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">ASET FISIK (NILAI STOK DI RUKO)</span>
                  <p className="text-xl font-bold text-white font-mono mt-0.5">{formatIDR(stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}</p>
                </div>
                <div className="text-[10px] text-slate-300 border-t border-indigo-950/50 pt-2 space-y-1 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400">🔥 Stok HP & Aksesoris:</span>
                    <span className="font-bold text-slate-200 font-mono">{formatIDR(stats.totalSisaPersediaanModal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">🔧 Suku Cadang Service:</span>
                    <span className="font-bold text-slate-200 font-mono">{formatIDR(stats.totalSisaSparepartsModal)}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Rekonsiliasi Kas On-Hand berjalan */}
              <div className="bg-slate-950/45 border border-indigo-900/30 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block font-sans">KAS TUNAI (UANG RIIL DI LACI)</span>
                  <p className={`text-xl font-bold font-mono mt-0.5 ${stats.saldoKasKumulatif >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {formatIDR(stats.saldoKasKumulatif)}
                  </p>
                </div>
                <div className="text-[10px] text-slate-300 border-t border-indigo-950/50 pt-2 flex justify-between font-sans">
                  <span className="text-slate-400">Status Likuiditas Kas:</span>
                  <span className={`font-mono font-bold ${stats.saldoKasKumulatif >= stats.modalAwal ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {stats.saldoKasKumulatif >= stats.modalAwal ? 'KAS SURPLUS BERSIH' : 'BELANJA MODAL SEHAT'}
                  </span>
                </div>
              </div>
            </div>

            {/* VISUAL NERACA: DOUBLE-SIDED T-ACCOUNT VIEW */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-indigo-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-900/40 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Scale size={14} className="text-indigo-400" />
                    Bagan Neraca Keuangan Toko (Balance Sheet Sederhana)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">Semua kepemilikan aset di ruko (Sisi Kiri) wajib bersumber dari modal awal atau hasil laba murni Anda (Sisi Kanan).</p>
                </div>
                
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono tracking-wider">
                  <CheckCircle size={10} className="text-emerald-400 animate-pulse" />
                  KEDUA SISI SEIMBANG !
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Visual Separator Line for Desktop */}
                <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-indigo-900/45"></div>

                {/* SISI KIRI: AKTIVA (Kekayaan) */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center bg-indigo-950/65 p-2 rounded-xl px-3 border border-indigo-900/30">
                    <span className="text-xs font-extrabold text-indigo-200">SISI AKTIVA (Semua Harta / Milik Toko)</span>
                    <span className="text-xs font-bold text-slate-400 font-sans">Stok HP + Kas + Suku Cadang</span>
                  </div>

                  <div className="space-y-2 text-xs sm:p-2">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-950/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        <span className="text-slate-300">Sisa Uang Kas Tunai (Drawer)</span>
                      </div>
                      <span className="font-semibold font-mono text-slate-100">{formatIDR(stats.saldoKasKumulatif)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-950/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                        <span className="text-slate-300">Nilai Stok HP & Aksesoris Terpajang</span>
                      </div>
                      <span className="font-semibold font-mono text-slate-100">{formatIDR(stats.totalSisaPersediaanModal)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-950/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                        <span className="text-slate-300">Nilai Persediaan Suku Cadang Service</span>
                      </div>
                      <span className="font-semibold font-mono text-slate-100">{formatIDR(stats.totalSisaSparepartsModal)}</span>
                    </div>

                    {/* Blue Progress Bar showing Composition */}
                    <div className="mt-4 pt-1">
                      <div className="w-full bg-slate-900 rounded-full h-2.5 flex overflow-hidden border border-slate-800">
                        <div 
                          style={{ width: `${Math.max(5, Math.min(90, (stats.saldoKasKumulatif / (stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal || 1)) * 100))}%` }} 
                          className="bg-emerald-500" 
                          title="Uang Kas"
                        />
                        <div 
                          style={{ width: `${Math.max(5, Math.min(90, (stats.totalSisaPersediaanModal / (stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal || 1)) * 100))}%` }} 
                          className="bg-indigo-500" 
                          title="Persediaan HP"
                        />
                        <div 
                          style={{ width: `${Math.max(5, Math.min(90, (stats.totalSisaSparepartsModal / (stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal || 1)) * 100))}%` }} 
                          className="bg-amber-500" 
                          title="Suku Cadang"
                        />
                      </div>
                      <div className="flex gap-3 justify-start text-[9px] text-slate-450 mt-2 font-sans">
                        <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>Kas Riil</span>
                        <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-indigo-505 block"></span>Stok HP/Aksesoris</span>
                        <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-amber-500 block"></span>Suku Cadang</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-indigo-900/40 pt-3 mt-4 text-xs font-bold text-emerald-400">
                      <span>TOTAL KEKAYAAN (AKTIVA):</span>
                      <span className="font-mono text-sm underline decoration-emerald-500/50 underline-offset-4 decoration-2">
                        {formatIDR(stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SISI KANAN: PASIVA (Sumber Dana) */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center bg-indigo-950/65 p-2 rounded-xl px-3 border border-indigo-900/30">
                    <span className="text-xs font-extrabold text-indigo-200">SISI PASIVA (Sumber Dana Toko)</span>
                    <span className="text-xs font-bold text-slate-400 font-sans">Modal Awal + Laba Cumulative</span>
                  </div>

                  <div className="space-y-2 text-xs sm:p-2 h-full flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-950/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-indigo-900/50 rounded-md text-[10px] font-bold text-indigo-300">MODAL</span>
                          <span className="text-slate-300">Setoran Modal Operasional Toko</span>
                        </div>
                        <span className="font-semibold font-mono text-slate-100">{formatIDR(stats.modalAwal)}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-950/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 bg-emerald-900/50 rounded-md text-[10px] font-bold text-emerald-300">PROFIT</span>
                          <span className="text-slate-300">Akumulasi Keuntungan Bersih Toko</span>
                        </div>
                        <span className={`font-semibold font-mono ${stats.cumulativeNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stats.cumulativeNetProfit >= 0 ? '+' : ''}{formatIDR(stats.cumulativeNetProfit)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="bg-slate-900/50 p-2.5 rounded-xl border border-indigo-900/10 text-[10px] text-indigo-200 font-sans leading-relaxed">
                        <strong className="text-white">Mengapa Angkanya Sama?</strong> Neraca Anda sehat karena total aset yang ada di ruko ({formatIDR(stats.saldoKasKumulatif + stats.totalSisaPersediaanModal + stats.totalSisaSparepartsModal)}) terbukti murni berasal dari modal Anda ({formatIDR(stats.modalAwal)}) ditambah laba murni ({formatIDR(stats.cumulativeNetProfit)}). Tidak ada dana siluman yang hilang!
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-indigo-900/40 pt-3 mt-4 text-xs font-bold text-emerald-400">
                      <span>TOTAL MODAL & ARUS (PASIVA):</span>
                      <span className="font-mono text-sm underline decoration-emerald-500/50 underline-offset-4 decoration-2">
                        {formatIDR(stats.modalAwal + stats.cumulativeNetProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: ALIRAN KAS MASUK-KELUAR */}
        {activeCashTab === 'arus_kas' && (
          <div className="space-y-5">
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-indigo-900/30 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <Calculator size={14} className="text-indigo-400" />
                  Alur Rekonsiliasi Buku Kas Utama Toko
                </h4>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Penjelasan kronologis bagaimana nominal laci kasir tunai saat ini terbentuk dari modal, transaksi jual penonton, jasa servis, pembelian persediaan HP, dan operasional.</p>
              </div>

              {/* Step Flow Ledger */}
              <div className="space-y-3 font-sans max-w-3xl">
                {/* Step 1 */}
                <div className="flex items-start gap-4 p-3 hover:bg-slate-900/45 rounded-xl transition border border-transparent hover:border-indigo-900/20">
                  <div className="bg-indigo-300/10 text-indigo-400 font-mono text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/10">1</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-205">Suntikan Modal Kas Pertama</p>
                    <p className="text-[10px] text-slate-400">Uang tunai yang didepositkan untuk memulai operasional sewa, ketersediaan meja, dan laci kassa.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-indigo-305 font-bold">+{formatIDR(stats.modalAwal)}</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 p-3 hover:bg-slate-900/45 rounded-xl transition border border-transparent hover:border-indigo-900/20">
                  <div className="bg-emerald-400/10 text-emerald-400 font-mono text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/10">2</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-205">Kas Masuk dari POS Penjualan HP & Aksesoris</p>
                    <p className="text-[10px] text-slate-400">Penerimaan bruto total yang ditarik dari seluruh penjualan HP riil milik pelanggan di kasir.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-emerald-400 font-bold">+{formatIDR(stats.lifetimePosRevenue)}</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 p-3 hover:bg-slate-900/45 rounded-xl transition border border-transparent hover:border-indigo-900/20">
                  <div className="bg-emerald-400/10 text-emerald-400 font-mono text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/10">3</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-205">Kas Masuk dari Layanan Jasa Service HP</p>
                    <p className="text-[10px] text-slate-400">Uang servis yang diserahkan pelanggan setelah perbaikan HP mereka dinyatakan selesai.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-emerald-400 font-bold">+{formatIDR(stats.lifetimeServiceRevenue)}</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 p-3 hover:bg-slate-900/45 rounded-xl transition border border-transparent hover:border-indigo-900/20">
                  <div className="bg-rose-450/10 text-rose-400 font-mono text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-rose-500/10">4</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-205">Kas Keluar Belanja Pengadaan Barang HP & Aksesoris</p>
                    <p className="text-[10px] text-slate-400">Pembayaran tunai yang Anda keluarkan untuk kulakan/supply stok dagangan di toko yang saat ini berstatus terdaftar (baik tersedia maupun terjual).</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-rose-400 font-bold">-{formatIDR(stats.totalKasKeluarUntukStok)}</span>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-4 p-3 hover:bg-slate-900/45 rounded-xl transition border border-transparent hover:border-indigo-900/20">
                  <div className="bg-rose-450/10 text-rose-400 font-mono text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-rose-500/10">5</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-205">Kas Keluar Belanja Persediaan Suku Cadang (Sparepart)</p>
                    <p className="text-[10px] text-slate-400">Arus modal tunai untuk membeli IC, baterai, LCD, dan perlengkapan reparasi (stok di laci service + yang sudah dipasang).</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-rose-400 font-bold">-{formatIDR(stats.totalKasKeluarBelanjaSparepart)}</span>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex items-start gap-4 p-3 hover:bg-slate-900/45 rounded-xl transition border border-transparent hover:border-indigo-900/20">
                  <div className="bg-rose-450/10 text-rose-400 font-mono text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-rose-500/10">6</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-205">Kas Keluar Pengeluaran Biaya Operasional (OPEX)</p>
                    <p className="text-[10px] text-slate-400">Seluruh biaya penunjang ruko seperti Wifi internet, listrik PLN, sewa gedung, uang bensin, makan staff, maupun biaya dadakan.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-rose-400 font-bold">-{formatIDR(stats.lifetimeOperationalExpense)}</span>
                  </div>
                </div>

                {/* Final Total */}
                <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/25 mt-6 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2 bg-emerald-500/20 text-emerald-305 rounded-lg text-xs font-extrabold">TOTAL KAS</span>
                    <p className="text-xs font-extrabold text-white">Sisa Saldo Kas Tunai Aktif Saat Ini (Cash on Hand)</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm underline font-black text-emerald-450">{formatIDR(stats.saldoKasKumulatif)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: PANDUAN KEUNGAN PEMULA */}
        {activeCashTab === 'panduan' && (
          <div className="space-y-4">
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-indigo-900/30 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <HelpCircle size={14} className="text-indigo-400" />
                  Kamus Keuangan & FAQ Pemula Toko HP
                </h4>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Pemahaman awam agar Anda tidak bingung membedakan uang di laci dengan profit di atas kertas.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans mt-2">
                {/* Q1 */}
                <div className="bg-indigo-950/45 p-4 rounded-xl border border-indigo-900/20 space-y-2">
                  <p className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                    <span className="text-emerald-450 font-mono font-extrabold text-sm">Q.</span>
                    Kenapa Sisa Uang Kas berbeda dengan Laba Bersih?
                  </p>
                  <p className="text-slate-350 leading-relaxed text-[10px] pt-1">
                    Laba bersih menghitung nilai HP/Aksesoris di etalase Anda sebagai bagian dari <strong className="text-emerald-400">Keuntungan yang Belum Dicairkan (Aset)</strong>. 
                    <br/><br/>
                    Sedangkan <strong className="text-indigo-305">Uang Kas</strong> murni melacak uang lembaran kertas fisik yang ada di toko. Ketika Anda berbelanja kulakan HP baru, Kas Anda berkurang, tapi Keuntungan tidak berkurang karena uang berubah wujud menjadi HP yang siap dijual kembali.
                  </p>
                </div>

                {/* Q2 */}
                <div className="bg-indigo-950/45 p-4 rounded-xl border border-indigo-900/20 space-y-2">
                  <p className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                    <span className="text-emerald-450 font-mono font-extrabold text-sm">Q.</span>
                    Apa maksud dari "Neraca Seimbang" ?
                  </p>
                  <p className="text-slate-350 leading-relaxed text-[10px] pt-1">
                    Neraca seimbang adalah garansi bahwa Anda tidak punya uang siluman yang hilang di luar pembukuan. 
                    <br/><br/>
                    Keuangan sehat dibuktikan jika <strong className="text-indigo-205">Total Harta Aktif</strong> (lembaran uang kas + stok HP pajangan + spareparts service) jumlahnya sama persis dengan total <strong className="text-indigo-205">Modal Awal Anda</strong> ditambah <strong className="text-emerald-400">Keuntungan Toko</strong>. Jika ada beda 1 Rupiah pun, sistem akan mengoreksi secara matematis agar selalu sinkron.
                  </p>
                </div>

                {/* Q3 */}
                <div className="bg-indigo-950/45 p-4 rounded-xl border border-indigo-900/20 space-y-2">
                  <p className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                    <span className="text-emerald-450 font-mono font-extrabold text-sm">Q.</span>
                    Bagaimana cara melipatgandakan Kas Tunai?
                  </p>
                  <p className="text-slate-350 leading-relaxed text-[10px] pt-1">
                    Ada 3 jurus emas:
                    <br/><br/>
                    1. <strong className="text-white">Likuidasi Stok Mengendap:</strong> Beri diskon pada HP second yang sudah terlalu lama nangkring di etalase agar cepat menjadi uang tunai kembali.
                    <br/>
                    2. <strong className="text-white">Genjot Jasa Servis:</strong> Jasa service memiliki margin laba paling tinggi & menghasilkan kas tunai instan karena tidak membutuhkan modal stok HP yang menyedot kas laci.
                    <br/>
                    3. <strong className="text-white">Kencangkan Sabuk OPEX:</strong> Tekan biaya listrik/kuota/pengeluaran ruko yang tidak penting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Terjual (Pendapatan Kotor) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">1. Total Omset (Pendapatan)</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-705 rounded-lg border border-indigo-100"><ArrowUpRight size={14} /></span>
          </div>
          <p className="text-lg font-extrabold text-slate-900 font-mono">{formatIDR(stats.totalRevenue)}</p>
          <div className="space-y-1 text-[10px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5 font-sans">
            <div className="flex justify-between">
              <span>HP/Aksesori POS:</span>
              <span className="font-extrabold text-slate-700">{formatIDR(stats.posRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Jasa Service HP:</span>
              <span className="font-extrabold text-slate-700">{formatIDR(stats.serviceRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Total COGS / HPP */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">2. Modal Barang Terjual (HPP)</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100"><TrendingDown size={14} /></span>
          </div>
          <p className="text-lg font-extrabold text-slate-900 font-mono">{formatIDR(stats.totalHPP)}</p>
          <div className="space-y-1 text-[10px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5 font-sans">
            <div className="flex justify-between">
              <span>HPP HP Terjual:</span>
              <span className="font-extrabold text-slate-700">{formatIDR(stats.hpPurchasingCost + stats.initialRepairsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Spareparts Servis:</span>
              <span className="font-extrabold text-slate-700">{formatIDR(stats.modalSparepartService)}</span>
            </div>
          </div>
        </div>

        {/* Operational & Extra costs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">3. Biaya Operasional (OPEX)</span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100" title="Listrik, Wifi, Sewa Ruko, Gaji, dll.">
              <Plus size={14} />
            </span>
          </div>
          <p className="text-lg font-extrabold text-slate-905 font-mono">{formatIDR(stats.totalOperationalExpense)}</p>
          <div className="text-[10px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5 leading-normal">
            Mencakup <strong className="text-slate-800">{filteredData.expenses.length} item</strong> biaya penunjang ruko seperti wifi, listrik, sewa tempat, atau gaji karyawan.
          </div>
        </div>

        {/* Laba Bersih Akhir */}
        <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-3xl shadow-xs text-indigo-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest font-sans">4. Keuntungan Bersih</span>
            <span className="p-1.5 bg-white text-indigo-700 border border-indigo-150 rounded-lg"><DollarSign size={14} /></span>
          </div>
          <p className={`text-lg font-black font-mono ${stats.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatIDR(stats.netProfit)}
          </p>
          <div className="text-[10px] text-indigo-800 mt-2 border-t border-indigo-150 pt-1.5 leading-normal">
            Hasil bersih murni dari hasil pengurangan Omset dengan seluruh HPP & OPEX.
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid with Custom SVG Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Laba Rugi Breakdown (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/85 p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide font-sans">
              📊 Visualisasi Arus Laba Rugi & Komparasi
            </h3>
            <p className="text-slate-500 text-[11px] mt-1">Analisis proporsal omset penjualan, beban pokok, operasional, profit, serta perkembangan bulanan.</p>
          </div>

          {/* Graphical Comparison Bar */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-bold">Rasio Pembagian Kas Masuk (Omset total: {formatIDR(stats.totalRevenue)})</span>
                <span className="font-extrabold font-mono text-indigo-700">
                  {stats.totalRevenue > 0 ? Math.round((stats.netProfit / stats.totalRevenue) * 100) : 0}% Laba Bersih
                </span>
              </div>
              <div className="w-full h-8 rounded-lg overflow-hidden flex font-mono text-[9px] font-extrabold text-white tracking-wider bg-slate-100 border border-slate-200 shadow-inner">
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
                        PROFRET ({Math.round((stats.netProfit / stats.totalRevenue) * 100)}%)
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
                <div className="flex flex-wrap gap-2.5 text-[10px] font-extrabold text-slate-505 shrink-0">
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
                  <p className="text-[11px] text-slate-405 uppercase tracking-wider font-extrabold font-sans">Margin Bersih POS</p>
                  <p className="text-sm font-black text-slate-800 mt-1">
                    {formatIDR(stats.posRevenue - (stats.hpPurchasingCost + stats.initialRepairsCost))}
                  </p>
                  <p className="text-[10px] text-indigo-705 mt-0.5 font-bold font-sans">Penjualan Toko & HP</p>
                </div>

                {/* Service Reparasi */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-[11px] text-slate-405 uppercase tracking-wider font-extrabold font-sans">Margin Service</p>
                  <p className="text-sm font-black text-slate-800 mt-1">
                    {formatIDR(stats.serviceRevenue - stats.modalSparepartService)}
                  </p>
                  <p className="text-[10px] text-emerald-705 mt-0.5 font-bold font-sans">{stats.doneServicesCount} Reparasi Selesai</p>
                </div>

                {/* Unit Trade in */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-[11px] text-slate-405 uppercase tracking-wider font-extrabold font-sans">Aset Trade-In</p>
                  <p className="text-sm font-black text-slate-800 mt-1">
                    {formatIDR(stats.totalTradeInAllowance)}
                  </p>
                  <p className="text-[10px] text-amber-705 mt-0.5 font-bold font-sans">Konversi Unit HP Masuk</p>
                </div>
              </div>
            </div>
            
            {/* Cashbook History Log list */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 font-sans uppercase tracking-wider">Riwayat Kas Masuk & Kas Keluar POS Periode Ini</h4>
              <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-xs">
                {filteredData.transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-2.5 text-xs hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-750">POS: Penjualan ({tx.customerName || 'Customer Umum'})</p>
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
                      <p className="text-[10px] text-slate-400 font-sans">
                        {tx.date ? new Date(tx.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''} • Kasir: {tx.cashierName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 font-mono">+{formatIDR(tx.totalAmount)}</p>
                      <p className="text-[10px] text-slate-455">Untung: {formatIDR(tx.totalProfit)}</p>
                    </div>
                  </div>
                ))}
                {filteredData.services.filter(s => s.status === 'selesai').map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-2.5 text-xs hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-750">SERVICE: {s.devModel} - Selesai</p>
                      <p className="text-[10px] text-slate-400 font-sans">{s.date} • {s.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 font-mono">+{formatIDR(s.cost)}</p>
                      <p className="text-[10px] text-rose-505 font-bold">Sparepart: -{formatIDR(s.capitalCost)}</p>
                    </div>
                  </div>
                ))}
                {filteredData.transactions.filter(t => t.tradeIn).map((tx) => (
                  <div key={`ti-${tx.id}`} className="flex justify-between items-center p-2.5 text-xs bg-amber-50/20">
                    <div>
                      <p className="font-semibold text-amber-900">Trade-In Aset: Tambah {tx.tradeIn?.model}</p>
                      <p className="text-[10px] text-amber-600">{tx.date} • IMEI: {tx.tradeIn?.imei}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-700 font-mono">-{formatIDR(tx.tradeIn?.buyPrice || 0)}</p>
                      <p className="text-[10px] text-slate-500">Modal Reparasi: {formatIDR(tx.tradeIn?.repairCost || 0)}</p>
                    </div>
                  </div>
                ))}
                {filteredData.transactions.length === 0 && filteredData.services.filter(s => s.status === 'selesai').length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">Tidak ada pengeluaran/pendapatan operasional standard POS</div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Manage Expenses & Profit Sharing */}
        <div className="space-y-6">
          {/* Operational Expense Tracker (Beban Biaya) */}
          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-sans">Input Biaya Operasional / OPEX</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Catat kas keluar untuk internet, listrik, sewa ruko, gaji karyawan, dll.</p>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-sans">Nama Pengeluaran</label>
                <input 
                  type="text" 
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="e.g. Bayar Wifi Toko"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
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
              <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                {filteredData.expenses.map((exp) => (
                  <div key={exp.id} className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs border border-slate-200">
                    <div className="max-w-[70%]">
                      <p className="font-bold text-slate-800 truncate">{exp.name}</p>
                      <p className="text-[10px] text-slate-455 capitalize mt-0.5">{exp.date} • {exp.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-600 font-mono text-[11px] shrink-0">-{formatIDR(exp.amount)}</span>
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
          <div className="bg-white rounded-3xl border border-slate-200/85 p-6 space-y-4 shadow-sm">
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
                        // Adjust investor to balance out
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
                  <div className="flex justify-between text-emerald-705 font-bold">
                    <span>Bagian Investor ({investorShare}%):</span>
                    <span>{formatIDR((Math.max(0, stats.netProfit) * investorShare) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-amber-705 font-bold">
                    <span>Bonus Staff/Dana Kas ({bonusShare}%):</span>
                    <span>{formatIDR((Math.max(0, stats.netProfit) * bonusShare) / 100)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-455 leading-relaxed flex items-start gap-1 font-sans">
                  <Info size={12} className="shrink-0 mt-0.5 text-indigo-600" />
                  Gunakan simulator bagi hasil ini untuk mengevaluasi kesehatan cashflow toko sebelum melakukan penarikan dividen bulanan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
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
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <h4 className="text-base font-bold text-slate-950">AFME STORE</h4>
                <p className="text-[11px] text-slate-500">Sistem Laporan Keuangan Resmi & Laba Rugi</p>
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
    </div>
  );
}
