import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  TrendingUp, 
  Filter, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ShoppingBag, 
  Wrench,
  AlertCircle,
  EyeOff
} from 'lucide-react';
import { Transaction, Service, UserRole } from '../types';

interface LaporanTransaksiProps {
  transactions: Transaction[];
  services: Service[];
  activeRole: UserRole;
}

export default function LaporanTransaksi({
  transactions,
  services,
  activeRole
}: LaporanTransaksiProps) {
  const [selectedTab, setSelectedTab] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'semua' | 'pos' | 'service'>('semua');
  
  // Date filter range state
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2); // default show last 2 months
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Track expanded groups (e.g. specific date, specific week, specific month)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isAdminOrOwner = activeRole === 'admin' || activeRole === 'owner';

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(num);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // 1. Compile & Filter Raw Data (POS & Services)
  const allRawItems = useMemo(() => {
    const list: Array<{
      id: string;
      date: string; // YYYY-MM-DD
      fullDate: Date;
      type: 'pos' | 'service';
      customerName: string;
      customerPhone: string;
      cashierName: string;
      summaryText: string;
      amount: number;
      profit: number;
      itemsCount: number;
      originalData: any;
    }> = [];

    // Process POS Transactions
    transactions.forEach(tx => {
      const txDate = tx.date ? new Date(tx.date) : new Date();
      const dateStr = txDate.toISOString().split('T')[0];
      const itemsSummary = tx.items.map(it => `${it.model} (${it.quantity}x)`).join(', ');
      const totalQty = tx.items.reduce((s, it) => s + it.quantity, 0);

      list.push({
        id: tx.id,
        date: dateStr,
        fullDate: txDate,
        type: 'pos',
        customerName: tx.customerName || 'Pelanggan Umum',
        customerPhone: tx.customerPhone || '',
        cashierName: tx.cashierName || 'Kasir',
        summaryText: itemsSummary || 'Pembelian Barang',
        amount: tx.totalAmount,
        profit: tx.totalProfit,
        itemsCount: totalQty,
        originalData: tx
      });
    });

    // Process Services (Selesai)
    services.filter(s => s.status === 'selesai').forEach(s => {
      let svcDate = new Date();
      if (s.date) {
        // Handle format YYYY-MM-DD
        const parts = s.date.split('-');
        if (parts.length === 3) {
          svcDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          svcDate = new Date(s.date);
        }
      }
      const dateStr = svcDate.toISOString().split('T')[0];

      list.push({
        id: s.id,
        date: dateStr,
        fullDate: svcDate,
        type: 'service',
        customerName: s.customerName || 'Pelanggan Jasa',
        customerPhone: s.customerPhone || '',
        cashierName: 'Teknisi',
        summaryText: `Reparasi ${s.devModel} (${s.description})`,
        amount: s.cost,
        profit: Math.max(0, s.cost - s.capitalCost),
        itemsCount: 1,
        originalData: s
      });
    });

    // Sort by Date Descending
    return list.sort((a, b) => b.fullDate.getTime() - a.fullDate.getTime());
  }, [transactions, services]);

  // Apply Search and Date range filters
  const filteredRawItems = useMemo(() => {
    return allRawItems.filter(item => {
      // Date range filter
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Type filter
      if (filterType === 'pos' && item.type !== 'pos') return false;
      if (filterType === 'service' && item.type !== 'service') return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchCustomer = item.customerName.toLowerCase().includes(query);
        const matchSummary = item.summaryText.toLowerCase().includes(query);
        const matchId = item.id.toLowerCase().includes(query);
        const matchCashier = item.cashierName.toLowerCase().includes(query);
        if (!matchCustomer && !matchSummary && !matchId && !matchCashier) return false;
      }

      return true;
    });
  }, [allRawItems, startDate, endDate, filterType, searchQuery]);

  // Helper: Get ISO week number and year
  const getWeekIdentifier = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    
    // Calculate week start and end date for labels
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - 3);
    const weekEnd = new Date(d);
    weekEnd.setUTCDate(d.getUTCDate() + 3);

    const formatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
    const rangeText = `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;

    return {
      id: `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`,
      label: `Minggu ${weekNo} (${rangeText})`,
      year: d.getUTCFullYear(),
      weekNo
    };
  };

  // Helper: Get Month Label
  const getMonthIdentifier = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    return {
      id: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: formatter.format(date)
    };
  };

  // 2. Groupings
  const groupedData = useMemo(() => {
    const groups: Record<string, {
      id: string;
      label: string;
      totalAmount: number;
      totalProfit: number;
      volume: number;
      itemsCount: number;
      items: typeof filteredRawItems;
    }> = {};

    filteredRawItems.forEach(item => {
      let groupId = '';
      let groupLabel = '';

      if (selectedTab === 'harian') {
        groupId = item.date;
        const formatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        groupLabel = formatter.format(item.fullDate);
      } else if (selectedTab === 'mingguan') {
        const weekInfo = getWeekIdentifier(item.fullDate);
        groupId = weekInfo.id;
        groupLabel = weekInfo.label;
      } else {
        const monthInfo = getMonthIdentifier(item.fullDate);
        groupId = monthInfo.id;
        groupLabel = monthInfo.label;
      }

      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          label: groupLabel,
          totalAmount: 0,
          totalProfit: 0,
          volume: 0,
          itemsCount: 0,
          items: []
        };
      }

      groups[groupId].totalAmount += item.amount;
      groups[groupId].totalProfit += item.profit;
      groups[groupId].volume += 1;
      groups[groupId].itemsCount += item.itemsCount;
      groups[groupId].items.push(item);
    });

    // Sort groups descending by id (which is chronologically sorted since we format as YYYY-MM-DD, YYYY-WXX, or YYYY-MM)
    return Object.values(groups).sort((a, b) => b.id.localeCompare(a.id));
  }, [filteredRawItems, selectedTab]);

  // Calculated overall stats for filtered set
  const summaryStats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalVolume = 0;
    let totalUnits = 0;

    filteredRawItems.forEach(item => {
      totalRevenue += item.amount;
      totalProfit += item.profit;
      totalVolume += 1;
      totalUnits += item.itemsCount;
    });

    return {
      totalRevenue,
      totalProfit,
      totalVolume,
      totalUnits
    };
  }, [filteredRawItems]);

  const handlePrint = () => {
    const printContent = document.getElementById('laporan-transaksi-print-area');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Transaksi - AFME STORE</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; font-size: 11px; line-height: 1.5; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
              .header h1 { margin: 0; font-size: 18px; color: #0f172a; }
              .header p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
              .period-badge { display: inline-block; padding: 3px 8px; background: #e0e7ff; color: #3730a3; border-radius: 9999px; font-weight: bold; margin-top: 8px; font-size: 10px; }
              .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
              .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; }
              .card-title { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.5px; }
              .card-value { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 5px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              .table th, .table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
              .table th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
              .table-group-header { background-color: #f8fafc; font-weight: bold; font-size: 12px; color: #1e293b; }
              .badge { display: inline-block; padding: 1px 4px; border-radius: 4px; font-size: 9px; font-weight: bold; }
              .badge-pos { background-color: #e0f2fe; color: #0369a1; }
              .badge-service { background-color: #ecfdf5; color: #047857; }
              .footer { text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #94a3b8; font-size: 9px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AFME STORE</h1>
              <p>Sistem Laporan Transaksi Resmi (${selectedTab.toUpperCase()})</p>
              <div class="period-badge">Periode: ${startDate || 'Mulai Awal'} s/d ${endDate || 'Hari Ini'}</div>
            </div>

            <div class="summary-cards">
              <div class="card">
                <div class="card-title">Volume Transaksi</div>
                <div class="card-value">${summaryStats.totalVolume} Transaksi</div>
              </div>
              <div class="card">
                <div class="card-title">Unit Terjual / Service</div>
                <div class="card-value">${summaryStats.totalUnits} Unit</div>
              </div>
              <div class="card">
                <div class="card-title">Total Pendapatan</div>
                <div class="card-value">${isAdminOrOwner ? formatIDR(summaryStats.totalRevenue) : 'HIDDEN'}</div>
              </div>
              <div class="card">
                <div class="card-title">Total Profit</div>
                <div class="card-value">${isAdminOrOwner ? formatIDR(summaryStats.totalProfit) : 'HIDDEN'}</div>
              </div>
            </div>

            <h2>Rincian Transaksi per Kelompok</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>No / ID</th>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Pelanggan</th>
                  <th>Rincian Item / Keluhan</th>
                  <th>Kasir / Staf</th>
                  ${isAdminOrOwner ? '<th>Total Omset</th><th>Margin Profit</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${groupedData.map(group => `
                  <tr class="table-group-header">
                    <td colspan="${isAdminOrOwner ? 8 : 6}">${group.label} (${group.volume} Transaksi ${isAdminOrOwner ? `• Omset: ${formatIDR(group.totalAmount)} • Profit: ${formatIDR(group.totalProfit)}` : ''})</td>
                  </tr>
                  ${group.items.map(item => `
                    <tr>
                      <td style="font-family: monospace;">${item.id.slice(0, 8).toUpperCase()}</td>
                      <td>${item.date}</td>
                      <td>
                        <span class="badge ${item.type === 'pos' ? 'badge-pos' : 'badge-service'}">
                          ${item.type === 'pos' ? 'POS' : 'SERVICE'}
                        </span>
                      </td>
                      <td>${item.customerName}</td>
                      <td>${item.summaryText}</td>
                      <td>${item.cashierName}</td>
                      ${isAdminOrOwner ? `
                        <td><strong>${formatIDR(item.amount)}</strong></td>
                        <td><span style="color: #047857; font-weight: bold;">${formatIDR(item.profit)}</span></td>
                      ` : ''}
                    </tr>
                  `).join('')}
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              Dicetak secara otomatis oleh sistem AFME STORE pada ${new Date().toLocaleString('id-ID')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Filtering Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600 animate-pulse" />
            Laporan Transaksi Harian, Mingguan & Bulanan
          </h2>
          <p className="text-slate-550 text-xs mt-1">
            Rekapitulasi volume transaksi, detail penjualan barang, jasa servis, {isAdminOrOwner ? 'omset, dan profit margin murni' : 'dan data aktivitas operasional toko'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <Printer size={14} /> Cetak Laporan
        </button>
      </div>

      {/* 2. Main Filters Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          
          {/* Interval Mode: Harian, Mingguan, Bulanan */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold text-slate-555">
            <button
              onClick={() => { setSelectedTab('harian'); setExpandedGroups({}); }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${selectedTab === 'harian' ? 'bg-white text-indigo-700 font-extrabold shadow-xs border border-slate-100' : 'hover:text-slate-800'}`}
            >
              Harian
            </button>
            <button
              onClick={() => { setSelectedTab('mingguan'); setExpandedGroups({}); }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${selectedTab === 'mingguan' ? 'bg-white text-indigo-700 font-extrabold shadow-xs border border-slate-100' : 'hover:text-slate-800'}`}
            >
              Mingguan
            </button>
            <button
              onClick={() => { setSelectedTab('bulanan'); setExpandedGroups({}); }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${selectedTab === 'bulanan' ? 'bg-white text-indigo-700 font-extrabold shadow-xs border border-slate-100' : 'hover:text-slate-800'}`}
            >
              Bulanan
            </button>
          </div>

          {/* Quick Date Inputs */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-semibold">Mulai:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-transparent border-0 text-slate-800 font-semibold focus:outline-none focus:ring-0 text-xs p-0 w-[110px]"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-semibold">Selesai:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-transparent border-0 text-slate-800 font-semibold focus:outline-none focus:ring-0 text-xs p-0 w-[110px]"
              />
            </div>
          </div>
        </div>

        {/* Search, Type Filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Cari Pelanggan, Kasir, Item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-850 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Jenis Transaksi</option>
              <option value="pos">POS (Penjualan Toko)</option>
              <option value="service">Service HP (Reparasi Jasa)</option>
            </select>
          </div>

          {/* Active filter counter badge */}
          <div className="flex items-center justify-end">
            <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
              Ditemukan: <span className="font-bold text-slate-850">{filteredRawItems.length} Catatan</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Summary Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-450 uppercase tracking-widest font-black">Volume Transaksi</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-black text-slate-900">{summaryStats.totalVolume}</p>
            <span className="text-[10px] text-slate-400 font-bold font-sans">Trx</span>
          </div>
          <p className="text-[10px] text-slate-500">Jumlah slip kas keluar-masuk</p>
        </div>

        {/* Total Unit Sold/Repaired */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-sm space-y-1">
          <p className="text-[10px] text-slate-450 uppercase tracking-widest font-black">Unit Terjual / Servis</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-black text-slate-900">{summaryStats.totalUnits}</p>
            <span className="text-[10px] text-slate-400 font-bold font-sans">Pcs</span>
          </div>
          <p className="text-[10px] text-slate-500">Total akumulasi item barang</p>
        </div>

        {/* Total Omset */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-sm space-y-1 relative overflow-hidden">
          <p className="text-[10px] text-slate-450 uppercase tracking-widest font-black">Total Pendapatan (Omset)</p>
          {isAdminOrOwner ? (
            <>
              <p className="text-lg font-black text-indigo-700 font-sans mt-0.5">
                {formatIDR(summaryStats.totalRevenue)}
              </p>
              <p className="text-[10px] text-slate-500">Masa kotor dari POS & Service</p>
            </>
          ) : (
            <div className="flex flex-col space-y-1 mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-extrabold bg-rose-50 border border-rose-100 rounded-lg p-1.5 w-fit">
                <EyeOff size={11} /> Akses Terbatas
              </span>
              <p className="text-[9.5px] text-slate-400 leading-normal">Hanya Admin / Owner yang dapat melihat detail omset toko.</p>
            </div>
          )}
        </div>

        {/* Total Profit */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/85 shadow-sm space-y-1 relative overflow-hidden">
          <p className="text-[10px] text-slate-450 uppercase tracking-widest font-black">Murni Keuntungan (Laba)</p>
          {isAdminOrOwner ? (
            <>
              <p className="text-lg font-black text-emerald-600 font-sans mt-0.5">
                {formatIDR(summaryStats.totalProfit)}
              </p>
              <p className="text-[10px] text-slate-500">Laba kotor dikurangi biaya modal</p>
            </>
          ) : (
            <div className="flex flex-col space-y-1 mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-extrabold bg-rose-50 border border-rose-100 rounded-lg p-1.5 w-fit">
                <EyeOff size={11} /> Akses Terbatas
              </span>
              <p className="text-[9.5px] text-slate-400 leading-normal">Hanya Admin / Owner yang dapat melihat margin profit.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Grouped Transactions List */}
      <div className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-1.5">
          <TrendingUp size={14} className="text-indigo-600" />
          Detail Pengelompokan Laporan ({groupedData.length} Kelompok Terbentuk)
        </h3>

        {groupedData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-250 rounded-2xl">
            <AlertCircle className="mx-auto text-slate-300" size={32} />
            <p className="text-xs font-bold">Tidak ada transaksi ditemukan</p>
            <p className="text-[10.5px] text-slate-400">Sesuaikan rentang tanggal, kata pencarian, atau filter transaksi Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedData.map(group => {
              const isExpanded = !!expandedGroups[group.id];
              return (
                <div key={group.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all duration-200 hover:border-slate-300">
                  
                  {/* Group Bar Header */}
                  <div 
                    onClick={() => toggleGroup(group.id)}
                    className="flex flex-wrap justify-between items-center bg-slate-50/70 p-3.5 text-xs font-bold cursor-pointer hover:bg-slate-50 transition border-b border-slate-200 select-none"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
                      <span className="text-slate-850 font-black">{group.label}</span>
                    </div>

                    <div className="flex items-center gap-3.5 flex-wrap">
                      <span className="text-slate-450 bg-slate-200/60 px-2.5 py-1 rounded-lg text-[10px] font-black">
                        {group.volume} Transaksi • {group.itemsCount} Unit
                      </span>
                      
                      {isAdminOrOwner && (
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-bold">
                            Omset: <span className="text-indigo-700 font-extrabold">{formatIDR(group.totalAmount)}</span>
                          </span>
                          <span className="text-slate-500 font-bold border-l border-slate-300 pl-3">
                            Laba: <span className="text-emerald-700 font-extrabold">{formatIDR(group.totalProfit)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Items Table (Visible when expanded) */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white border-b border-slate-150 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                            <th className="py-2.5 px-4">No / ID</th>
                            <th className="py-2.5 px-3">Waktu</th>
                            <th className="py-2.5 px-3">Jenis</th>
                            <th className="py-2.5 px-3">Pelanggan</th>
                            <th className="py-2.5 px-3">Deskripsi Barang / Jasa</th>
                            <th className="py-2.5 px-3">Kasir / Staf</th>
                            {isAdminOrOwner && (
                              <>
                                <th className="py-2.5 px-3 text-right">Omset (Total)</th>
                                <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {group.items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition duration-150">
                              <td className="py-3 px-4 font-mono text-[10px] text-slate-500 font-bold">
                                {idx + 1}. {item.id.slice(0, 8).toUpperCase()}
                              </td>
                              <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                {item.fullDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  item.type === 'pos' 
                                    ? 'bg-sky-50 text-sky-700 border border-sky-100' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {item.type === 'pos' ? <ShoppingBag size={10} /> : <Wrench size={10} />}
                                  {item.type === 'pos' ? 'POS' : 'SERVICE'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">{item.customerName}</div>
                                {item.customerPhone && (
                                  <div className="text-[10px] text-slate-400 font-sans font-medium">{item.customerPhone}</div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-650 max-w-[220px] truncate" title={item.summaryText}>
                                {item.summaryText}
                              </td>
                              <td className="py-3 px-3 text-slate-500 font-semibold whitespace-nowrap">
                                {item.cashierName}
                              </td>
                              {isAdminOrOwner && (
                                <>
                                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-sans">
                                    {formatIDR(item.amount)}
                                  </td>
                                  <td className="py-3 px-3 text-right font-extrabold text-emerald-600 font-sans">
                                    {formatIDR(item.profit)}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Expand / Collapse bottom helper bar */}
                  {!isExpanded && (
                    <div 
                      onClick={() => toggleGroup(group.id)}
                      className="p-1.5 bg-slate-50/20 text-center text-[10px] font-bold text-slate-400 hover:bg-slate-50/50 hover:text-slate-600 cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <span>Lihat Rincian ({group.volume} transaksi)</span>
                      <ArrowRight size={10} />
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden print area template to avoid direct style interference */}
      <div id="laporan-transaksi-print-area" className="hidden"></div>
    </div>
  );
}
