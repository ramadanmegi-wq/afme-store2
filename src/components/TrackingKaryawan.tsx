import React, { useState, useMemo } from 'react';
import { 
  Target, 
  TrendingUp, 
  ShoppingBag, 
  UserCheck, 
  Award, 
  DollarSign, 
  Calendar, 
  Search, 
  Edit3, 
  CheckCircle2, 
  Users, 
  Smartphone,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowUpRight,
  Package,
  UserPlus,
  Trash2,
  X
} from 'lucide-react';
import { Transaction, Product, AppAccount, UserRole } from '../types';
import { getAccounts } from '../db/mockDb';

interface TrackingKaryawanProps {
  transactions: Transaction[];
  products: Product[];
  activeRole: UserRole;
  currentUserName: string;
}

interface StaffTarget {
  salesProfitTargetRp?: number;
  salesTargetRp?: number;
  salesTargetUnits: number;
  purchaseTargetUnits: number;
  purchaseTargetRp: number;
}

interface StaffStatItem {
  salesCount: number;
  salesOmset: number;
  salesProfit: number;
  hpUnitsSold: number;
  purchaseCount: number;
  purchaseTotalRp: number;
  purchaseUnitsHp: number;
}

export default function TrackingKaryawan({
  transactions,
  products,
  activeRole,
  currentUserName,
}: TrackingKaryawanProps) {
  // Date filter state: 'this_month' | 'today' | 'all'
  const [dateFilter, setDateFilter] = useState<'this_month' | 'today' | 'all'>('this_month');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [activeLogTab, setActiveLogTab] = useState<'penjualan' | 'belanja'>('penjualan');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Custom staff list stored in localStorage
  const [customStaff, setCustomStaff] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('afme_custom_staff');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Gagal membaca custom staff:', e);
    }
    return [];
  });

  // Modal State for Adding New Staff
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffProfitTarget, setNewStaffProfitTarget] = useState<number>(10000000);
  const [newStaffSalesUnits, setNewStaffSalesUnits] = useState<number>(10);
  const [newStaffPurchaseUnits, setNewStaffPurchaseUnits] = useState<number>(15);

  // Target modal state
  const [isTargetModalOpen, setIsTargetModalOpen] = useState<boolean>(false);
  const [editingStaffName, setEditingStaffName] = useState<string>('');
  const [inputProfitTarget, setInputProfitTarget] = useState<number>(10000000);
  const [inputSalesTargetUnits, setInputSalesTargetUnits] = useState<number>(10);
  const [inputPurchaseTargetUnits, setInputPurchaseTargetUnits] = useState<number>(15);
  const [inputPurchaseTargetRp, setInputPurchaseTargetRp] = useState<number>(40000000);

  // Load saved targets from localStorage (Khusus Karyawan: Aldi & Friya default)
  const [staffTargets, setStaffTargets] = useState<Record<string, StaffTarget>>(() => {
    try {
      const saved = localStorage.getItem('afme_staff_targets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Gagal membaca targets:', e);
    }
    return {
      'Aldi': { salesProfitTargetRp: 10000000, salesTargetUnits: 10, purchaseTargetUnits: 15, purchaseTargetRp: 40000000 },
      'Friya': { salesProfitTargetRp: 10000000, salesTargetUnits: 10, purchaseTargetUnits: 15, purchaseTargetRp: 40000000 },
    };
  });

  // Unique list of tracked employees ONLY (Default: Aldi & Friya + custom employees)
  const allStaffNames = useMemo(() => {
    const defaultList = ['Aldi', 'Friya'];
    const combined = [...defaultList, ...customStaff];
    const unique = new Set<string>();

    combined.forEach(name => {
      const trimmed = name.trim();
      if (trimmed && !trimmed.toLowerCase().includes('owner') && !trimmed.toLowerCase().includes('admin') && !trimmed.toLowerCase().includes('megi')) {
        unique.add(trimmed);
      }
    });

    return Array.from(unique);
  }, [customStaff]);

  // Helper to match any raw cashier/purchaser string to tracked staff
  const findTrackedStaff = (rawName?: string): string | null => {
    if (!rawName) return null;
    const lower = rawName.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
    if (!lower) return null;

    // Direct check against tracked names
    for (const staff of allStaffNames) {
      const staffLower = staff.toLowerCase();
      if (lower === staffLower || lower.includes(staffLower) || staffLower.includes(lower)) {
        return staff;
      }
    }

    return null;
  };

  // Helper date matching
  const isDateInFilter = (dateString: string) => {
    if (dateFilter === 'all') return true;
    const d = new Date(dateString);
    const now = new Date();

    if (dateFilter === 'today') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    if (dateFilter === 'this_month') {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    return true;
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isDateInFilter(t.date));
  }, [transactions, dateFilter]);

  // Calculate statistics per tracked staff member
  const staffStatsMap = useMemo(() => {
    const stats: Record<string, StaffStatItem> = {};

    // Initialize stats ONLY for tracked employees
    allStaffNames.forEach(name => {
      stats[name] = {
        salesCount: 0,
        salesOmset: 0,
        salesProfit: 0,
        hpUnitsSold: 0,
        purchaseCount: 0,
        purchaseTotalRp: 0,
        purchaseUnitsHp: 0,
      };
    });

    // Process transactions (Sales)
    filteredTransactions.forEach(t => {
      const matchedStaff = findTrackedStaff(t.cashierName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      stats[matchedStaff].salesCount += 1;
      stats[matchedStaff].salesOmset += t.totalAmount;
      
      let trxProfit = 0;
      let hpUnits = 0;
      t.items.forEach(item => {
        trxProfit += (item.price - item.buyPrice) * item.qty;
        if (item.productType === 'iphone') {
          hpUnits += item.qty;
        }
      });
      stats[matchedStaff].salesProfit += trxProfit;
      stats[matchedStaff].hpUnitsSold += hpUnits;
    });

    // Process products (Stock purchases)
    products.forEach(p => {
      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      const cost = p.type === 'iphone' ? (p.buyPrice + (p.repairCost || 0)) : (p.buyPrice * (p.stock || 1));
      stats[matchedStaff].purchaseCount += 1;
      stats[matchedStaff].purchaseTotalRp += cost;
      if (p.type === 'iphone') {
        stats[matchedStaff].purchaseUnitsHp += 1;
      }
    });

    return stats;
  }, [allStaffNames, filteredTransactions, products]);

  // Overall totals
  const overallTotals = useMemo(() => {
    let totalOmset = 0;
    let totalProfit = 0;
    let totalBelanjaHpRp = 0;
    let totalBelanjaHpUnits = 0;

    (Object.values(staffStatsMap) as StaffStatItem[]).forEach(st => {
      totalOmset += st.salesOmset;
      totalProfit += st.salesProfit;
      totalBelanjaHpRp += st.purchaseTotalRp;
      totalBelanjaHpUnits += st.purchaseUnitsHp;
    });

    return { totalOmset, totalProfit, totalBelanjaHpRp, totalBelanjaHpUnits };
  }, [staffStatsMap]);

  // Handler: Add New Employee
  const handleAddStaff = () => {
    const trimmed = newStaffName.trim();
    if (!trimmed) return;

    // Capitalize first letter
    const formattedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    if (allStaffNames.some(s => s.toLowerCase() === formattedName.toLowerCase())) {
      alert('Karyawan dengan nama ini sudah terdaftar!');
      return;
    }

    const updatedCustom = [...customStaff, formattedName];
    setCustomStaff(updatedCustom);
    localStorage.setItem('afme_custom_staff', JSON.stringify(updatedCustom));

    const updatedTargets = {
      ...staffTargets,
      [formattedName]: {
        salesProfitTargetRp: Number(newStaffProfitTarget) || 10000000,
        salesTargetUnits: Number(newStaffSalesUnits) || 10,
        purchaseTargetUnits: Number(newStaffPurchaseUnits) || 15,
        purchaseTargetRp: 40000000,
      }
    };
    setStaffTargets(updatedTargets);
    localStorage.setItem('afme_staff_targets', JSON.stringify(updatedTargets));

    setNewStaffName('');
    setIsAddStaffModalOpen(false);
  };

  // Handler: Remove Custom Staff
  const handleRemoveStaff = (staffName: string) => {
    if (staffName === 'Aldi' || staffName === 'Friya') {
      alert('Aldi dan Friya adalah karyawan utama yang tidak dapat dihapus.');
      return;
    }
    if (confirm(`Yakin ingin menghapus karyawan ${staffName} dari daftar tracking?`)) {
      const updated = customStaff.filter(s => s !== staffName);
      setCustomStaff(updated);
      localStorage.setItem('afme_custom_staff', JSON.stringify(updated));
    }
  };

  // Handler to open target edit modal
  const handleOpenTargetModal = (staffName: string) => {
    setEditingStaffName(staffName);
    const existing = staffTargets[staffName] || {
      salesProfitTargetRp: 10000000,
      salesTargetUnits: 10,
      purchaseTargetUnits: 15,
      purchaseTargetRp: 40000000
    };
    setInputProfitTarget(existing.salesProfitTargetRp || existing.salesTargetRp || 10000000);
    setInputSalesTargetUnits(existing.salesTargetUnits || 10);
    setInputPurchaseTargetUnits(existing.purchaseTargetUnits || 15);
    setInputPurchaseTargetRp(existing.purchaseTargetRp || 40000000);
    setIsTargetModalOpen(true);
  };

  // Handler to save target
  const handleSaveTarget = () => {
    if (!editingStaffName) return;
    const updated = {
      ...staffTargets,
      [editingStaffName]: {
        salesProfitTargetRp: Number(inputProfitTarget),
        salesTargetUnits: Number(inputSalesTargetUnits),
        purchaseTargetUnits: Number(inputPurchaseTargetUnits),
        purchaseTargetRp: Number(inputPurchaseTargetRp)
      }
    };
    setStaffTargets(updated);
    localStorage.setItem('afme_staff_targets', JSON.stringify(updated));
    setIsTargetModalOpen(false);
  };

  // Format IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filtered sales log table
  const salesLogsFiltered = useMemo(() => {
    return filteredTransactions.filter(t => {
      const matched = findTrackedStaff(t.cashierName);
      const matchStaff = selectedStaffFilter === 'all' || matched === selectedStaffFilter || (t.cashierName && t.cashierName.includes(selectedStaffFilter));
      const matchSearch = t.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (t.cashierName && t.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [filteredTransactions, selectedStaffFilter, searchTerm]);

  // Filtered stock purchase log table
  const purchaseLogsFiltered = useMemo(() => {
    return products.filter(p => {
      if (!p.purchaserName) return false;
      const matchStaff = selectedStaffFilter === 'all' || p.purchaserName === selectedStaffFilter;
      const matchSearch = p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.imei && p.imei.includes(searchTerm)) ||
                          (p.purchaserName && p.purchaserName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [products, selectedStaffFilter, searchTerm]);

  // Restriction check: Only Admin & Owner can view target tracking
  if (activeRole !== 'owner' && activeRole !== 'admin') {
    return (
      <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-8 text-center space-y-3 my-8 max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto font-black text-lg">
          <Target size={24} />
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Akses Khusus Owner &amp; Admin Toko</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Menu Target &amp; Tracking Karyawan ini khusus diakses oleh Owner dan Admin Toko untuk pemantauan target pencapaian penjualan serta keaktifan belanja stok HP karyawan (Aldi &amp; Friya).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner & Date Filter */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-extrabold uppercase tracking-widest">
              <Target size={13} className="text-amber-400" />
              <span>KPI &amp; Target Karyawan</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Tracking Penjualan &amp; Belanja Stok Karyawan
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Pantau realisasi target pencapaian omset penjualan dan keaktifan penanggung jawab belanja stok HP second/aksesoris per staf.
            </p>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 self-start md:self-auto shrink-0 shadow-inner">
            <button
              onClick={() => setDateFilter('this_month')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateFilter === 'this_month'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar size={13} />
              <span>Bulan Ini</span>
            </button>

            <button
              onClick={() => setDateFilter('today')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Hari Ini</span>
            </button>

            <button
              onClick={() => setDateFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Semua Waktu</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overview Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TOTAL OMSET PENJUALAN</span>
          <p className="text-2xl font-black font-mono text-indigo-600">{formatIDR(overallTotals.totalOmset)}</p>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Estimasi Keuntungan:</span>
            <strong className="text-emerald-600 font-mono font-bold">{formatIDR(overallTotals.totalProfit)}</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TOTAL TRANSAKSI KASIR</span>
          <p className="text-2xl font-black font-mono text-slate-900">{filteredTransactions.length} <span className="text-xs font-sans text-slate-500 font-normal">Nota</span></p>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            Pencapaian transaksi seluruh staf
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TOTAL BELANJA STOK HP</span>
          <p className="text-2xl font-black font-mono text-amber-600">{formatIDR(overallTotals.totalBelanjaHpRp)}</p>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Total Unit HP Restock:</span>
            <strong className="text-slate-800 font-mono font-bold">{overallTotals.totalBelanjaHpUnits} Unit</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">STAF &amp; TIM TERDAFTAR</span>
          <p className="text-2xl font-black font-mono text-slate-900">{allStaffNames.length} <span className="text-xs font-sans text-slate-500 font-normal">Personel</span></p>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            Penanggung jawab aktif di sistem
          </p>
        </div>
      </div>

      {/* 3. Employee Target Cards & Leaderboard Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-600" size={18} />
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight uppercase">
              Rincian Pencapaian Target Per Karyawan
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {(activeRole === 'owner' || activeRole === 'admin') && (
              <button
                onClick={() => setIsAddStaffModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/15 transition cursor-pointer"
              >
                <UserPlus size={14} />
                <span>+ Tambah Karyawan Baru</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allStaffNames.map((staffName) => {
            const st = staffStatsMap[staffName] || {
              salesCount: 0,
              salesOmset: 0,
              salesProfit: 0,
              hpUnitsSold: 0,
              purchaseCount: 0,
              purchaseTotalRp: 0,
              purchaseUnitsHp: 0,
            };

            const target = staffTargets[staffName] || {
              salesProfitTargetRp: 10000000,
              salesTargetUnits: 10,
              purchaseTargetUnits: 15,
              purchaseTargetRp: 40000000
            };

            const profitTargetVal = target.salesProfitTargetRp || target.salesTargetRp || 10000000;
            const salesProfitPct = Math.min(100, Math.round((st.salesProfit / (profitTargetVal || 1)) * 100));
            const salesUnitsPct = Math.min(100, Math.round((st.hpUnitsSold / (target.salesTargetUnits || 1)) * 100));
            const purchasePct = Math.min(100, Math.round((st.purchaseUnitsHp / (target.purchaseTargetUnits || 1)) * 100));
            const isCustom = staffName !== 'Aldi' && staffName !== 'Friya';

            return (
              <div 
                key={staffName}
                className="bg-white rounded-3xl border border-slate-200/85 p-5 shadow-sm space-y-5 relative hover:border-indigo-300 transition-all duration-200"
              >
                {/* Header Staf */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-indigo-600/20">
                      {staffName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{staffName}</span>
                        {staffName === currentUserName && (
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-extrabold">Anda</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">Penanggung Jawab Transaksi</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {(activeRole === 'owner' || activeRole === 'admin') && (
                      <button
                        onClick={() => handleOpenTargetModal(staffName)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                        title="Atur Target Karyawan Ini"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    {isCustom && (activeRole === 'owner' || activeRole === 'admin') && (
                      <button
                        onClick={() => handleRemoveStaff(staffName)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Hapus Karyawan Ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Progress 1: Target Laba Penjualan (Rp) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <TrendingUp size={13} className="text-indigo-600" />
                      Target Laba Penjualan
                    </span>
                    <span className="font-mono font-extrabold text-indigo-700">{salesProfitPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        salesProfitPct >= 100 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : salesProfitPct >= 60 
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                      }`}
                      style={{ width: `${salesProfitPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 pt-0.5">
                    <span>Realisasi Laba: <strong className="text-slate-900">{formatIDR(st.salesProfit)}</strong></span>
                    <span>Target Laba: <strong>{formatIDR(profitTargetVal)}</strong></span>
                  </div>
                </div>

                {/* Target Progress 2: Penjualan (Unit HP) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Package size={13} className="text-emerald-600" />
                      Target Penjualan Unit HP
                    </span>
                    <span className="font-mono font-extrabold text-emerald-700">{salesUnitsPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        salesUnitsPct >= 100 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${salesUnitsPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 pt-0.5">
                    <span>Terjual: <strong className="text-slate-900">{st.hpUnitsSold} Unit</strong></span>
                    <span>Target: <strong>{target.salesTargetUnits || 10} Unit</strong></span>
                  </div>
                </div>

                {/* Target Progress 3: Belanja Stok HP (Units) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <ShoppingBag size={13} className="text-amber-600" />
                      Target Belanja Stok HP
                    </span>
                    <span className="font-mono font-extrabold text-amber-700">{purchasePct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        purchasePct >= 100 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : 'bg-gradient-to-r from-amber-500 to-amber-600'
                      }`}
                      style={{ width: `${purchasePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 pt-0.5">
                    <span>Realisasi: <strong className="text-slate-900">{st.purchaseUnitsHp} Unit</strong></span>
                    <span>Target: <strong>{target.purchaseTargetUnits} Unit</strong></span>
                  </div>
                </div>

                {/* Key Metrics Grid per Staff */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Transaksi</span>
                    <p className="font-mono font-extrabold text-slate-800">{st.salesCount} Nota ({st.hpUnitsSold} HP)</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Profit Dihasilkan</span>
                    <p className="font-mono font-extrabold text-emerald-600">{formatIDR(st.salesProfit)}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200/60 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Total Modal Belanja Stok:</span>
                    <span className="font-mono font-extrabold text-slate-900">{formatIDR(st.purchaseTotalRp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Filterable Logs: Detailed Sales vs Stock Purchases Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Main Log Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveLogTab('penjualan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeLogTab === 'penjualan'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={14} />
              <span>Log Transaksi Penjualan ({salesLogsFiltered.length})</span>
            </button>

            <button
              onClick={() => setActiveLogTab('belanja')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeLogTab === 'belanja'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag size={14} />
              <span>Log Belanja Stok ({purchaseLogsFiltered.length})</span>
            </button>
          </div>

          {/* Search & Staff Filter */}
          <div className="flex items-center gap-2">
            {/* Filter Staf */}
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Staf Penanggung Jawab</option>
              {allStaffNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari kata kunci..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* LOG TAB 1: Penjualan */}
        {activeLogTab === 'penjualan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                  <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                  <th className="py-3 px-4">Kasir / Staf Penjual</th>
                  <th className="py-3 px-4">No. Nota &amp; Pelanggan</th>
                  <th className="py-3 px-4">Rincian Barang Terjual</th>
                  <th className="py-3 px-4 text-right">Total Transaksi</th>
                  <th className="py-3 px-4 text-right">Estimasi Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {salesLogsFiltered.map((t) => {
                  let totalProfit = 0;
                  t.items.forEach(i => {
                    totalProfit += (i.price - i.buyPrice) * i.qty;
                  });

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(t.date).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          <UserCheck size={12} />
                          <span>{t.cashierName || 'Staff AFME'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{t.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-500">{t.customerName || 'Pelanggan Umum'}</span>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        {t.items.map((item, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700">
                            • {item.productModel} x{item.qty}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        {formatIDR(t.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        +{formatIDR(totalProfit)}
                      </td>
                    </tr>
                  );
                })}

                {salesLogsFiltered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      Tidak ditemukan riwayat transaksi penjualan sesuai filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* LOG TAB 2: Belanja Stok */}
        {activeLogTab === 'belanja' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                  <th className="py-3 px-4">Model Barang / HP</th>
                  <th className="py-3 px-4">Penanggung Jawab Belanja</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Modal Beli (Rp)</th>
                  <th className="py-3 px-4 text-right">Harga Jual (Rp)</th>
                  <th className="py-3 px-4 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {purchaseLogsFiltered.map((p) => {
                  const cost = p.type === 'iphone' ? (p.buyPrice + (p.repairCost || 0)) : (p.buyPrice * (p.stock || 1));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block">{p.model}</span>
                        {p.imei && <span className="text-[10px] text-slate-500 font-mono">IMEI: {p.imei}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-800">
                        <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/70">
                          <UserCheck size={12} className="text-amber-600" />
                          <span>{p.purchaserName}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          p.type === 'iphone' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {p.type === 'iphone' ? 'HP Second/Baru' : 'Aksesoris'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatIDR(cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatIDR(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.status === 'available' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status === 'available' ? 'Tersedia' : 'Laku Terjual'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {purchaseLogsFiltered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      Belum ada catatan belanja stok HP dengan penanggung jawab sesuai filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: Atur Target Karyawan */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="text-indigo-600" size={20} />
                <h3 className="font-black text-slate-900 text-sm uppercase">
                  Atur Target Bulanan: {editingStaffName}
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Laba Penjualan (Rp)
                </label>
                <input
                  type="number"
                  value={inputProfitTarget}
                  onChange={(e) => setInputProfitTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {formatIDR(inputProfitTarget)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Penjualan Unit HP (Unit)
                </label>
                <input
                  type="number"
                  value={inputSalesTargetUnits}
                  onChange={(e) => setInputSalesTargetUnits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Jumlah unit HP yang ditargetkan terjual per bulan
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Belanja Stok HP (Unit)
                </label>
                <input
                  type="number"
                  value={inputPurchaseTargetUnits}
                  onChange={(e) => setInputPurchaseTargetUnits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Jumlah HP second/baru yang ditargetkan untuk di-restock
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md cursor-pointer"
              >
                Simpan Target
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 6. MODAL: Tambah Karyawan Baru */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="text-indigo-600" size={20} />
                <h3 className="font-black text-slate-900 text-sm uppercase">
                  Tambah Karyawan Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Karyawan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi, Mas Joko, Rina"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Laba Penjualan Bulanan (Rp)
                </label>
                <input
                  type="number"
                  value={newStaffProfitTarget}
                  onChange={(e) => setNewStaffProfitTarget(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {formatIDR(newStaffProfitTarget)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Penjualan Unit HP Bulanan (Unit)
                </label>
                <input
                  type="number"
                  value={newStaffSalesUnits}
                  onChange={(e) => setNewStaffSalesUnits(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Belanja Stok HP Bulanan (Unit)
                </label>
                <input
                  type="number"
                  value={newStaffPurchaseUnits}
                  onChange={(e) => setNewStaffPurchaseUnits(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                disabled={!newStaffName.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md cursor-pointer"
              >
                Tambah Karyawan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
