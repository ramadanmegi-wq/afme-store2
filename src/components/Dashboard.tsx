import React from 'react';
import { 
  TrendingUp, 
  Smartphone, 
  Wrench, 
  Users, 
  DollarSign, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Activity
} from 'lucide-react';
import { Product, Transaction, Service, Customer, UserRole } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  services: Service[];
  customers: Customer[];
  activeRole: UserRole;
  onChangeTab: (tab: string) => void;
  onResetDb?: () => void;
}

export default function Dashboard({
  products,
  transactions,
  services,
  customers,
  activeRole,
  onChangeTab,
}: DashboardProps) {
  
  // Format mata uang IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Hitung statistik
  const totalSalesVal = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  
  // Hitung profit dari transaksi POS
  const salesProfit = transactions.reduce((sum, t) => sum + t.totalProfit, 0);
  
  // Hitung profit dari service yang sudah selesai
  const finishedServices = services.filter(s => s.status === 'selesai');
  const servicesRevenue = finishedServices.reduce((sum, s) => sum + s.cost, 0);
  const servicesProfit = finishedServices.reduce((sum, s) => sum + (s.cost - s.capitalCost), 0);
  
  const totalRevenueVal = totalSalesVal + servicesRevenue;
  const totalProfitVal = salesProfit + servicesProfit;

  // Stok iPhone available
  const availableIphones = products.filter(p => p.type === 'iphone' && p.status === 'available');
  const soldIphones = products.filter(p => p.type === 'iphone' && p.status === 'sold');

  // Stok Aksesoris menipis (stok < 5)
  const lowStockProducts = products.filter(p => p.type === 'aksesoris' && (p.stock || 0) < 5);
  
  // Service status
  const pendingServices = services.filter(s => s.status === 'pending');
  const prosesServices = services.filter(s => s.status === 'proses');

  const topSellingModels = React.useMemo(() => {
    const models: { [key: string]: number } = {};
    transactions.forEach(t => {
      t.items.forEach(it => {
        models[it.model] = (models[it.model] || 0) + it.quantity;
      });
    });
    return Object.entries(models)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [transactions]);

  // Tren volume & performa penjualan selama 7 hari terakhir
  const last7DaysData = React.useMemo(() => {
    const list = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; // Format YYYY-MM-DD
      
      const formatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
      const label = formatter.format(d);
      
      // Filter transaksi pada tanggal ini
      const dayTransactions = transactions.filter(t => {
        if (!t.date) return false;
        const itemDateStr = t.date.split('T')[0];
        return itemDateStr === dateStr;
      });
      
      const volume = dayTransactions.length;
      const revenue = dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const profit = dayTransactions.reduce((sum, t) => sum + t.totalProfit, 0);
      
      list.push({
        dateStr,
        label,
        volume,
        revenue,
        profit,
      });
    }
    return list;
  }, [transactions]);

  // Tooltip custom untuk visualisasi grafik bermutu tinggi
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 font-sans leading-normal">
          <p className="font-extrabold text-amber-300">{label}</p>
          <div className="space-y-1 text-slate-300">
            <p className="flex justify-between gap-4 font-semibold">
              <span>Volume Penjualan:</span>
              <span className="text-indigo-300 font-extrabold">{data.volume} Transaksi</span>
            </p>
            <p className="flex justify-between gap-4 font-semibold">
              <span>Total Omset:</span>
              <span className="text-white font-extrabold">{formatIDR(data.revenue)}</span>
            </p>
            <p className="flex justify-between gap-4 font-semibold">
              <span>Estimasi Profit:</span>
              <span className="text-emerald-400 font-extrabold">{formatIDR(data.profit)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner (Light banner with premium gradient) */}
      <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-3xl border border-indigo-500 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            Selamat Datang Kembali, <span className="text-amber-300 capitalize">{activeRole}</span>!
          </h1>
          <p className="text-indigo-100 text-xs mt-1">
            AFM Store POS server sinkronisasi cloud siap mengamankan aktivitas kasir Anda.
          </p>
        </div>
        <div className="flex gap-2 text-[10px] bg-slate-900/45 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-indigo-100">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 self-center animate-ping mr-2"></span>
          STAF: <span className="uppercase text-amber-300 font-extrabold">{activeRole}</span>
        </div>
      </div>

      {/* Main Stats Bento-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Pendapatan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm flex items-center justify-between transition hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pendapatan (Omset)</p>
            <p className="text-lg md:text-xl font-extrabold text-slate-900 mt-1 font-sans">
              {(activeRole === 'admin' || activeRole === 'owner') ? formatIDR(totalRevenueVal) : 'Rp **.***.***'}
            </p>
            {activeRole !== 'admin' && activeRole !== 'owner' && (
              <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <ShieldAlert size={10} /> Sensor Karyawan
              </p>
            )}
            {(activeRole === 'admin' || activeRole === 'owner') && (
              <div className="text-[10px] text-slate-500 mt-1">
                POS: {formatIDR(totalSalesVal)} | Servis: {formatIDR(servicesRevenue)}
              </div>
            )}
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Stat 2: Total Profit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm flex items-center justify-between transition hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Profit Bersih</p>
            <p className="text-lg md:text-xl font-extrabold text-emerald-600 mt-1 font-sans">
              {(activeRole === 'admin' || activeRole === 'owner') ? formatIDR(totalProfitVal) : 'Rp **.***.***'}
            </p>
            {activeRole !== 'admin' && activeRole !== 'owner' && (
              <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <ShieldAlert size={10} /> Sensor Karyawan
              </p>
            )}
            {(activeRole === 'admin' || activeRole === 'owner') && (
              <div className="text-[10px] text-slate-500 mt-1">Profit POS & Jasa dikurangi modal</div>
            )}
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Stat 3: HP Second Stock */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm flex items-center justify-between transition hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stok HP Ready</p>
            <p className="text-lg md:text-xl font-extrabold text-slate-900 mt-1">
              {availableIphones.length} <span className="text-xs font-normal text-slate-500">Unit</span>
            </p>
            <div className="text-[10px] text-slate-500 mt-1">
              Terjual: <span className="text-indigo-600 font-semibold">{soldIphones.length} unit</span>
            </div>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Smartphone size={20} />
          </div>
        </div>

        {/* Stat 4: Service HP Aktif */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm flex items-center justify-between transition hover:border-slate-300">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reparasi HP Berjalan</p>
            <p className="text-lg md:text-xl font-extrabold text-slate-900 mt-1">
              {pendingServices.length + prosesServices.length} <span className="text-xs font-normal text-slate-500">Nota</span>
            </p>
            <div className="text-[10px] text-sky-600 mt-1 flex items-center gap-1 font-semibold">
              <Clock size={10} /> {pendingServices.length} Pending | {prosesServices.length} Proses
            </div>
          </div>
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <Wrench size={20} />
          </div>
        </div>
      </div>

      {/* Grid Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Middle: Service & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recharts Area Chart: Tren Volume Penjualan 7 Hari Terakhir */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <TrendingUp className="text-indigo-600 animate-pulse" size={18} />
                  Tren Volume Penjualan Harian
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Analisis visual volume transaksi & omset selama 7 hari terakhir</p>
              </div>
              <div className="flex gap-2 text-xs font-semibold bg-indigo-50/50 px-3 py-1.5 rounded-xl text-indigo-700 border border-indigo-100">
                Lapor: <span className="font-bold text-slate-900">{last7DaysData.reduce((s, d) => s + d.volume, 0)} Penjualan</span>
              </div>
            </div>

            <div className="h-[280px] w-full font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={last7DaysData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10} 
                    allowDecimals={false} 
                  />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#dedede', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                    name="Volume Penjualan"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend / Brief Info */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Rerata Volume</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  {(last7DaysData.reduce((s, d) => s + d.volume, 0) / 7).toFixed(1)} / Hari
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Omset 7H</p>
                <p className="text-sm font-extrabold text-indigo-600 mt-1 font-sans">
                  {(activeRole === 'admin' || activeRole === 'owner') 
                    ? formatIDR(last7DaysData.reduce((s, d) => s + d.revenue, 0)) 
                    : 'Rp **.***.***'
                  }
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Profit 7H</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-1 font-sans">
                  {(activeRole === 'admin' || activeRole === 'owner') 
                    ? formatIDR(last7DaysData.reduce((s, d) => s + d.profit, 0)) 
                    : 'Rp **.***.***'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Services List */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Antrean Servis HP Teraktif</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pantau penyelesaian perbaikan perangkat pelanggan</p>
              </div>
              <button 
                onClick={() => onChangeTab('service_hp')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold transition bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 cursor-pointer"
              >
                Urus Semua ({services.length})
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Pelanggan</th>
                    <th className="py-2.5">Tipe HP</th>
                    <th className="py-2.5">Keluhan</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Biaya Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {services.filter(s => s.status !== 'selesai').slice(0, 4).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{item.customerName}</p>
                        <p className="text-[10px] text-slate-500">{item.customerPhone}</p>
                      </td>
                      <td className="py-3 font-semibold text-indigo-700">{item.devModel}</td>
                      <td className="py-3 text-slate-600 max-w-[150px] truncate">{item.description}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold leading-relaxed ${
                          item.status === 'pending' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          <Clock size={9} /> {item.status === 'pending' ? 'Pending' : 'Proses'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {formatIDR(item.cost)}
                      </td>
                    </tr>
                  ))}
                  {services.filter(s => s.status !== 'selesai').length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                          <CheckCircle className="text-emerald-500" size={24} />
                          <p className="font-bold text-slate-700 text-xs">Semua antrean servis telah rampung!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Business Flow Guidelines for Staff */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
              <Activity className="text-indigo-500 animate-pulse" size={15} /> SOP Manajemen AFM Store Pro
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="w-6 h-6 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-mono text-xs font-bold mb-2 border border-indigo-150">1</span>
                <p className="font-bold text-slate-800 text-xs text-indigo-700">Inventaris Stok HP</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Input spesifikasi HP bekas, harga beli modal, biaya reparasi, peroleh ID unik otomatis.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="w-6 h-6 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-mono text-xs font-bold mb-2 border border-amber-150">2</span>
                <p className="font-bold text-slate-800 text-xs text-amber-700">Pelayanan POS Kasir</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Pilih barang, input nominal diskon kasir bila disetujui, dukung pemotongan via Tukar Tambah.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="w-6 h-6 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-mono text-xs font-bold mb-2 border border-emerald-150">3</span>
                <p className="font-bold text-slate-800 text-xs text-emerald-700">Arsip Cloud Database</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Semua penjualan & biaya operasional langsung diposkan asinkron ke server Supabase Anda.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Top performance metrics */}
        <div className="space-y-6">
          {/* Top Selling Products */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-1.5">
              <span>🔥 Produk Terlaris Hari Ini</span>
            </h3>
            {topSellingModels.length > 0 ? (
              <div className="space-y-3">
                {topSellingModels.map(([model, qty], index) => (
                  <div key={model} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100/50 transition border border-slate-150">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-400 w-4">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs max-w-[130px] truncate">{model}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Penjualan Kasir</p>
                      </div>
                    </div>
                    <span className="bg-indigo-55 text-indigo-700 border border-indigo-100 text-xs px-2.5 py-1 rounded-xl font-bold">
                      {qty}x
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada records penjualan di pos kasir.
              </div>
            )}
          </div>

          {/* Low Stock Warning Panel (Stok Menipis & Empty state) */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-rose-600 text-xs mb-4">⚠️ Peringatan Stok Menipis</h3>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">{p.model}</span>
                    <span className="text-[10.5px] font-bold text-rose-600">{p.stock || 0} Pcs</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                Semua stok aksesoris aman di atas batas minimum.
              </div>
            )}
          </div>

          {/* Quick Customer Directory Summary */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-slate-900 text-xs">Direktori Pelanggan</h3>
              <Users className="text-indigo-500" size={14} />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{customers.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-4">Pelanggan teridentifikasi transaksi POS</p>
            
            <div className="space-y-2 max-h-[170px] overflow-y-auto">
              {customers.slice(0, 3).map((c) => (
                <div key={c.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-[10px] text-slate-550">{c.phone}</p>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-lg font-mono font-bold">OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
