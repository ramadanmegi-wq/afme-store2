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
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  Minus,
  X,
  Check,
  RefreshCw,
  User
} from 'lucide-react';
import { Transaction, Service, UserRole, Product } from '../types';

interface LaporanTransaksiProps {
  transactions: Transaction[];
  services: Service[];
  activeRole: UserRole;
  onUpdateTransaction?: (trx: Transaction) => Promise<void>;
  products?: Product[];
  onSaveProduct?: (prod: Product) => Promise<void>;
}

export default function LaporanTransaksi({
  transactions,
  services,
  activeRole,
  onUpdateTransaction,
  products,
  onSaveProduct
}: LaporanTransaksiProps) {
  const [selectedTab, setSelectedTab] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'semua' | 'pos' | 'service'>('semua');

  // States for Editing/Redoing
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  
  const handleStartEdit = (trx: Transaction) => {
    if (!isAdminOrOwner) return;
    setEditingTransaction(JSON.parse(JSON.stringify(trx)));
    setSearchProductQuery('');
  };

  const handleUpdateTradeInValue = (val: number) => {
    if (!editingTransaction || !editingTransaction.tradeIn) return;
    const tradeIn = { ...editingTransaction.tradeIn, buyPrice: Math.max(0, val) };
    
    // Recalculate totals
    const totalAmount = editingTransaction.items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0) - tradeIn.buyPrice;
    const totalModal = editingTransaction.items.reduce((s, it) => s + ((it.buyPrice + (it.repairCost || 0)) * it.quantity), 0);
    const totalProfit = totalAmount - totalModal + (tradeIn.buyPrice - (tradeIn.repairCost || 0));

    setEditingTransaction({
      ...editingTransaction,
      tradeIn,
      totalAmount,
      totalProfit
    });
  };

  const handleUpdateTradeInRepair = (val: number) => {
    if (!editingTransaction || !editingTransaction.tradeIn) return;
    const tradeIn = { ...editingTransaction.tradeIn, repairCost: Math.max(0, val) };
    
    // Recalculate totals
    const totalAmount = editingTransaction.items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0) - tradeIn.buyPrice;
    const totalModal = editingTransaction.items.reduce((s, it) => s + ((it.buyPrice + (it.repairCost || 0)) * it.quantity), 0);
    const totalProfit = totalAmount - totalModal + (tradeIn.buyPrice - tradeIn.repairCost);

    setEditingTransaction({
      ...editingTransaction,
      tradeIn,
      totalAmount,
      totalProfit
    });
  };

  const handleAddItem = (prod: Product) => {
    if (!editingTransaction) return;
    const items = [...editingTransaction.items];
    const exists = items.find(it => it.productId === prod.id);
    if (exists) {
      if (prod.type === 'iphone') return; // 1 iPhone only
      exists.quantity += 1;
    } else {
      items.push({
        productId: prod.id,
        model: prod.model,
        type: prod.type,
        sellingPrice: prod.sellingPrice,
        buyPrice: prod.buyPrice,
        repairCost: prod.repairCost || 0,
        quantity: 1
      });
    }

    const tradeInDeduction = editingTransaction.tradeIn ? editingTransaction.tradeIn.buyPrice : 0;
    const totalAmount = items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0) - tradeInDeduction;
    const totalModal = items.reduce((s, it) => s + ((it.buyPrice + (it.repairCost || 0)) * it.quantity), 0);
    const totalProfit = totalAmount - totalModal + (editingTransaction.tradeIn ? (editingTransaction.tradeIn.buyPrice - (editingTransaction.tradeIn.repairCost || 0)) : 0);

    setEditingTransaction({
      ...editingTransaction,
      items,
      totalAmount,
      totalProfit
    });
  };

  const handleRemoveItem = (productId: string) => {
    if (!editingTransaction) return;
    const items = editingTransaction.items.filter(it => it.productId !== productId);
    
    const tradeInDeduction = editingTransaction.tradeIn ? editingTransaction.tradeIn.buyPrice : 0;
    const totalAmount = items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0) - tradeInDeduction;
    const totalModal = items.reduce((s, it) => s + ((it.buyPrice + (it.repairCost || 0)) * it.quantity), 0);
    const totalProfit = totalAmount - totalModal + (editingTransaction.tradeIn ? (editingTransaction.tradeIn.buyPrice - (editingTransaction.tradeIn.repairCost || 0)) : 0);

    setEditingTransaction({
      ...editingTransaction,
      items,
      totalAmount,
      totalProfit
    });
  };

  const handleUpdateItemPrice = (productId: string, price: number) => {
    if (!editingTransaction) return;
    const items = editingTransaction.items.map(it => {
      if (it.productId === productId) {
        return { ...it, sellingPrice: Math.max(0, price) };
      }
      return it;
    });

    const tradeInDeduction = editingTransaction.tradeIn ? editingTransaction.tradeIn.buyPrice : 0;
    const totalAmount = items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0) - tradeInDeduction;
    const totalModal = items.reduce((s, it) => s + ((it.buyPrice + (it.repairCost || 0)) * it.quantity), 0);
    const totalProfit = totalAmount - totalModal + (editingTransaction.tradeIn ? (editingTransaction.tradeIn.buyPrice - (editingTransaction.tradeIn.repairCost || 0)) : 0);

    setEditingTransaction({
      ...editingTransaction,
      items,
      totalAmount,
      totalProfit
    });
  };

  const handleUpdateItemQty = (productId: string, qty: number) => {
    if (!editingTransaction) return;
    const items = editingTransaction.items.map(it => {
      if (it.productId === productId) {
        return { ...it, quantity: Math.max(1, qty) };
      }
      return it;
    });

    const tradeInDeduction = editingTransaction.tradeIn ? editingTransaction.tradeIn.buyPrice : 0;
    const totalAmount = items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0) - tradeInDeduction;
    const totalModal = items.reduce((s, it) => s + ((it.buyPrice + (it.repairCost || 0)) * it.quantity), 0);
    const totalProfit = totalAmount - totalModal + (editingTransaction.tradeIn ? (editingTransaction.tradeIn.buyPrice - (editingTransaction.tradeIn.repairCost || 0)) : 0);

    setEditingTransaction({
      ...editingTransaction,
      items,
      totalAmount,
      totalProfit
    });
  };

  const handleSaveTransactionEdit = async () => {
    if (!isAdminOrOwner || !editingTransaction || !onUpdateTransaction) return;
    setIsSavingEdit(true);
    
    try {
      const originalTrx = transactions.find(t => t.id === editingTransaction.id);
      
      if (originalTrx && products && onSaveProduct) {
        const originalItems = originalTrx.items;
        const editedItems = editingTransaction.items;

        const originalMap: Record<string, number> = {};
        originalItems.forEach(it => {
          originalMap[it.productId] = (originalMap[it.productId] || 0) + it.quantity;
        });

        const editedMap: Record<string, number> = {};
        editedItems.forEach(it => {
          editedMap[it.productId] = (editedMap[it.productId] || 0) + it.quantity;
        });

        const allProductIds = Array.from(new Set([
          ...originalItems.map(it => it.productId),
          ...editedItems.map(it => it.productId)
        ]));

        for (const pid of allProductIds) {
          const oldQty = originalMap[pid] || 0;
          const newQty = editedMap[pid] || 0;
          const diff = newQty - oldQty;

          if (diff !== 0) {
            const prod = products.find(p => p.id === pid);
            if (prod) {
              if (prod.type === 'aksesoris') {
                const updatedProduct = {
                  ...prod,
                  stock: Math.max(0, (prod.stock || 0) - diff),
                  status: (Math.max(0, (prod.stock || 0) - diff) > 0) ? 'available' as const : 'sold' as const
                };
                await onSaveProduct(updatedProduct);
              } else if (prod.type === 'iphone') {
                const updatedProduct = {
                  ...prod,
                  status: (newQty > 0) ? 'sold' as const : 'available' as const
                };
                await onSaveProduct(updatedProduct);
              }
            }
          }
        }
      }

      await onUpdateTransaction(editingTransaction);
      setEditingTransaction(null);
    } catch (e) {
      console.error("Gagal menyimpan perubahan transaksi:", e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Product list for catalog in edit modal
  const availableInventory = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      if (p.status !== 'available') return false;
      if (p.type === 'aksesoris' && (p.stock || 0) <= 0) return false;
      if (searchProductQuery.trim() !== '') {
        const q = searchProductQuery.toLowerCase();
        return (p.model || '').toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.imei && p.imei.includes(q));
      }
      return true;
    }).slice(0, 5);
  }, [products, searchProductQuery]);
  
  // Helper: Safely parse date string or Date instance without timezone skew
  const parseDateString = (dateInput: any): Date => {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    const str = String(dateInput).trim();
    if (!str) return new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
    return new Date();
  };

  // Helper: Format local date to YYYY-MM-DD string without UTC shift
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date filter range state (default empty to show ALL transactions by default)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterCashier, setFilterCashier] = useState<string>('semua');

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

  // Quick Date Filter Handlers
  const handleSetQuickDate = (mode: 'all' | 'today' | 'week' | 'month') => {
    const now = new Date();
    if (mode === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (mode === 'today') {
      const todayStr = getLocalDateString(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === 'week') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(getLocalDateString(past));
      setEndDate(getLocalDateString(now));
    } else if (mode === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(getLocalDateString(firstDay));
      setEndDate(getLocalDateString(now));
    }
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
    (transactions || []).forEach(tx => {
      const txDate = parseDateString(tx.date);
      const dateStr = getLocalDateString(txDate);
      const itemsList = tx.items || [];
      const itemsSummary = itemsList.length > 0
        ? itemsList.map(it => `${it.model || 'Barang'} (${it.quantity || 1}x)`).join(', ')
        : 'Pembelian Barang';
      const totalQty = itemsList.reduce((s, it) => s + (it.quantity || 1), 0);

      list.push({
        id: tx.id,
        date: dateStr,
        fullDate: txDate,
        type: 'pos',
        customerName: tx.customerName || 'Pelanggan Umum',
        customerPhone: tx.customerPhone || '',
        cashierName: tx.cashierName || 'Kasir',
        summaryText: itemsSummary,
        amount: tx.totalAmount || 0,
        profit: tx.totalProfit || 0,
        itemsCount: totalQty,
        originalData: tx
      });
    });

    // Process Services (Include all services)
    (services || []).forEach(s => {
      const svcDate = parseDateString(s.date);
      const dateStr = getLocalDateString(svcDate);
      const statusNote = s.status === 'selesai' ? '' : ` [${(s.status || 'proses').toUpperCase()}]`;

      list.push({
        id: s.id,
        date: dateStr,
        fullDate: svcDate,
        type: 'service',
        customerName: s.customerName || 'Pelanggan Jasa',
        customerPhone: s.customerPhone || '',
        cashierName: s.cashierName || 'Teknisi',
        summaryText: `Reparasi ${s.devModel || 'HP'} (${s.description || 'Jasa'})${statusNote}`,
        amount: s.cost || 0,
        profit: Math.max(0, (s.cost || 0) - (s.capitalCost || 0)),
        itemsCount: 1,
        originalData: s
      });
    });

    // Sort by Date Descending
    return list.sort((a, b) => b.fullDate.getTime() - a.fullDate.getTime());
  }, [transactions, services]);

  // Unique list of Cashiers/Staff inputters
  const uniqueCashiers = useMemo(() => {
    const set = new Set<string>();
    allRawItems.forEach(item => {
      if (item.cashierName && item.cashierName.trim()) {
        set.add(item.cashierName.trim());
      }
    });
    return Array.from(set).sort();
  }, [allRawItems]);

  // Apply Search, Type, Cashier, and Date range filters
  const filteredRawItems = useMemo(() => {
    return allRawItems.filter(item => {
      // Date range filter
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Type filter
      if (filterType === 'pos' && item.type !== 'pos') return false;
      if (filterType === 'service' && item.type !== 'service') return false;

      // Cashier / Staff filter
      if (filterCashier !== 'semua' && item.cashierName !== filterCashier) return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchCustomer = (item.customerName || '').toLowerCase().includes(query);
        const matchSummary = (item.summaryText || '').toLowerCase().includes(query);
        const matchId = (item.id || '').toLowerCase().includes(query);
        const matchCashier = (item.cashierName || '').toLowerCase().includes(query);
        if (!matchCustomer && !matchSummary && !matchId && !matchCashier) return false;
      }

      return true;
    });
  }, [allRawItems, startDate, endDate, filterType, filterCashier, searchQuery]);

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
              <img src="${localStorage.getItem('afme_custom_logo') || window.location.origin + '/logo.png'}" alt="AFME STORE Logo" style="width: 48px; height: 48px; object-fit: contain; border-radius: 12px; background: #020617; border: 1px solid #f59e0b; padding: 2px; margin: 0 auto 8px auto; display: block;" />
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

          {/* Quick Date Preset & Date Inputs */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-medium text-slate-600 text-[11px]">
              <button
                onClick={() => handleSetQuickDate('all')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${!startDate && !endDate ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'hover:text-slate-900'}`}
              >
                Semua
              </button>
              <button
                onClick={() => handleSetQuickDate('today')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${startDate && startDate === endDate ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'hover:text-slate-900'}`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => handleSetQuickDate('week')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${startDate && startDate !== endDate ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'hover:text-slate-900'}`}
              >
                7 Hari
              </button>
              <button
                onClick={() => handleSetQuickDate('month')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer hover:text-slate-900`}
              >
                Bulan Ini
              </button>
            </div>

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

        {/* Search, Type Filter, Staff Filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

          <div className="flex items-center gap-2">
            <User size={13} className="text-slate-400" />
            <select
              value={filterCashier}
              onChange={(e: any) => setFilterCashier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-850 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Kasir / Staf Penginput</option>
              {uniqueCashiers.map(cName => (
                <option key={cName} value={cName}>Akun: {cName}</option>
              ))}
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
                            <th className="py-2.5 px-4 text-center">Aksi</th>
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
                                }}`}>
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
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 text-slate-800 font-bold text-[11px] rounded-lg border border-slate-200 shadow-2xs">
                                  <User size={11} className="text-indigo-600 shrink-0" />
                                  <span>{item.cashierName || 'Staff Kasir'}</span>
                                </span>
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
                               <td className="py-3 px-4 text-center whitespace-nowrap">
                                {isAdminOrOwner && item.type === 'pos' ? (
                                  <button
                                    onClick={() => handleStartEdit(item.originalData)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer border border-amber-200"
                                    title="Edit atau Redo Transaksi Penjualan"
                                  >
                                    <Pencil size={11} />
                                    <span>Edit/Redo</span>
                                  </button>
                                ) : item.type === 'pos' ? (
                                  <span className="text-[10px] text-slate-400 italic font-medium">Laporan POS</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic font-medium">Servis Selesai</span>
                                )}
                              </td>
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

      {/* ========================================================= */}
      {/* EDIT / REDO TRANSACTION MODAL                             */}
      {/* ========================================================= */}
      {editingTransaction && isAdminOrOwner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-200">
                  Mode Edit &amp; Redo Transaksi
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  ID Transaksi: <span className="font-mono text-indigo-600">{editingTransaction.id.toUpperCase()}</span>
                </h3>
              </div>
              <button 
                onClick={() => setEditingTransaction(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Items and Selection (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Customer Information */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Informasi Pelanggan &amp; Nota Transaksi
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Nama Pembeli</label>
                      <input 
                        type="text"
                        value={editingTransaction.customerName}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, customerName: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Nomor HP</label>
                      <input 
                        type="text"
                        value={editingTransaction.customerPhone}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, customerPhone: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Kasir / Staff Petugas (Akun Penginput)</label>
                      <input 
                        type="text"
                        value={editingTransaction.cashierName || ''}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, cashierName: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                        placeholder="Nama Akun Penginput..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Waktu Transaksi</label>
                      <input 
                        type="datetime-local"
                        value={editingTransaction.date ? new Date(new Date(editingTransaction.date).getTime() - new Date(editingTransaction.date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setEditingTransaction({ ...editingTransaction, date: new Date(e.target.value).toISOString() });
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Transaction Cart Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Daftar Keranjang Belanja
                  </h4>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {editingTransaction.items.map((it) => {
                      const isIphone = it.type === 'iphone';
                      return (
                        <div key={it.productId} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition gap-3">
                          <div className="min-w-0 flex-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              isIphone ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {isIphone ? 'iPhone' : 'Aksesoris'}
                            </span>
                            <p className="font-extrabold text-slate-900 text-xs mt-0.5 truncate">{it.model}</p>
                            
                            {/* Interactive Price Override */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-400">Harga:</span>
                              <input 
                                type="number"
                                value={it.sellingPrice}
                                onChange={(e) => handleUpdateItemPrice(it.productId, Number(e.target.value))}
                                className="w-32 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Quantity Controls (Only for accessories) */}
                            {!isIphone ? (
                              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <button 
                                  type="button"
                                  onClick={() => handleUpdateItemQty(it.productId, it.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-2 text-xs font-bold font-mono text-slate-800">{it.quantity}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleUpdateItemQty(it.productId, it.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-450 font-black px-2 py-1 bg-slate-100 rounded-lg">1 Unit</span>
                            )}

                            {/* Remove Item */}
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(it.productId)}
                              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 flex items-center justify-center transition cursor-pointer"
                              title="Hapus barang dari transaksi ini"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {editingTransaction.items.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                        Keranjang kosong. Tambahkan barang di bawah.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Search and Add New items to transaction */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Tambahkan Barang Baru ke Transaksi
                  </h4>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search size={12} />
                    </span>
                    <input 
                      type="text"
                      placeholder="Cari model barang, IMEI, atau SKU aksesoris..."
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {searchProductQuery.trim() !== '' && (
                    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-sm animate-fadeIn">
                      {availableInventory.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50">
                          <div>
                            <p className="font-extrabold text-slate-800">{p.model}</p>
                            <p className="text-[9.5px] text-slate-400 font-mono">
                              {p.type === 'iphone' ? `IMEI: ${p.imei}` : `SKU: ${p.sku || '-'} • Stok: ${p.stock || 0}`}
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleAddItem(p)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[10.5px] font-bold transition cursor-pointer"
                          >
                            + Tambah
                          </button>
                        </div>
                      ))}

                      {availableInventory.length === 0 && (
                        <p className="p-3 text-center text-slate-400 text-[11px]">Tidak ada produk yang cocok / tersedia</p>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Financial Calculations & Trade-In (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* 4. Trade-In Form details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Detail Tukar Tambah (Trade-In)
                    </h4>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      editingTransaction.tradeIn ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {editingTransaction.tradeIn ? 'Aktif' : 'Tidak Ada'}
                    </span>
                  </div>

                  {editingTransaction.tradeIn ? (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">Model HP Ditukar</label>
                        <input 
                          type="text"
                          value={editingTransaction.tradeIn.model}
                          onChange={(e) => {
                            if (!editingTransaction.tradeIn) return;
                            setEditingTransaction({
                              ...editingTransaction,
                              tradeIn: { ...editingTransaction.tradeIn, model: e.target.value }
                            });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">IMEI HP Ditukar</label>
                          <input 
                            type="text"
                            value={editingTransaction.tradeIn.imei}
                            onChange={(e) => {
                              if (!editingTransaction.tradeIn) return;
                              setEditingTransaction({
                                ...editingTransaction,
                                tradeIn: { ...editingTransaction.tradeIn, imei: e.target.value }
                              });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Harga Beli HP (Dihargai)</label>
                          <input 
                            type="number"
                            value={editingTransaction.tradeIn.buyPrice}
                            onChange={(e) => handleUpdateTradeInValue(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">Estimasi Biaya Reparasi Toko</label>
                        <input 
                          type="number"
                          value={editingTransaction.tradeIn.repairCost}
                          onChange={(e) => handleUpdateTradeInRepair(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const items = editingTransaction.items;
                          const totalAmount = items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0);
                          const totalModal = items.reduce((s, it) => s + ((it.buyPrice + (it.repairCost || 0)) * it.quantity), 0);
                          const totalProfit = totalAmount - totalModal;

                          setEditingTransaction({
                            ...editingTransaction,
                            tradeIn: undefined,
                            totalAmount,
                            totalProfit
                          });
                        }}
                        className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[10.5px] font-bold transition flex items-center justify-center gap-1 border border-rose-100 cursor-pointer"
                      >
                        <Trash2 size={11} />
                        <span>Hapus Fitur Tukar Tambah</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingTransaction({
                            ...editingTransaction,
                            tradeIn: {
                              model: 'iPhone X 64GB',
                              imei: '358123456789012',
                              buyPrice: 1500000,
                              repairCost: 0
                            },
                            totalAmount: editingTransaction.totalAmount - 1500000,
                            totalProfit: editingTransaction.totalProfit + 1500000
                          });
                        }}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-indigo-200 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Tambahkan Tukar Tambah (Trade-In)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. Financial Summary Panel */}
                <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-lg">
                  <h4 className="text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                    Kalkulator Rekapitulasi Keuangan
                  </h4>

                  <div className="space-y-2 text-xs border-b border-slate-800 pb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Harga Barang</span>
                      <span className="font-mono">
                        {formatIDR(editingTransaction.items.reduce((s, it) => s + (it.sellingPrice * it.quantity), 0))}
                      </span>
                    </div>

                    {editingTransaction.tradeIn && (
                      <div className="flex justify-between text-amber-450 font-semibold">
                        <span>Potongan Tukar Tambah</span>
                        <span className="font-mono">
                          -{formatIDR(editingTransaction.tradeIn.buyPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400 font-black uppercase">Final Omset</span>
                      <span className="text-xl font-extrabold text-amber-400 font-mono">
                        {formatIDR(editingTransaction.totalAmount)}
                      </span>
                    </div>

                    {isAdminOrOwner && (
                      <div className="flex justify-between items-baseline pt-2">
                        <span className="text-[10px] text-slate-400 font-black uppercase">Laba Bersih Toko</span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">
                          {formatIDR(editingTransaction.totalProfit)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                disabled={isSavingEdit}
              >
                Batalkan
              </button>
              
              <button 
                type="button"
                onClick={handleSaveTransactionEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                disabled={isSavingEdit}
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Simpan Perubahan &amp; Redo</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Hidden print area template to avoid direct style interference */}
      <div id="laporan-transaksi-print-area" className="hidden"></div>
    </div>
  );
}
