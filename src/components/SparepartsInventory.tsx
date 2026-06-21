import { useState, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Boxes, 
  Cpu, 
  AlertTriangle,
  HeartCrack,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Sparepart, UserRole } from '../types';

interface SparepartsInventoryProps {
  spareparts: Sparepart[];
  activeRole: UserRole;
  onSaveSparepart: (sparepart: Sparepart) => void;
  onDeleteSparepart: (id: string) => void;
}

export default function SparepartsInventory({
  spareparts,
  activeRole,
  onSaveSparepart,
  onDeleteSparepart,
}: SparepartsInventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [compatibleModels, setCompatibleModels] = useState('');

  // Format IDR function
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Filtered spareparts
  const filteredSpareparts = spareparts.filter(sp => {
    return sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sp.compatibleModels.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Action: Add new
  const handleAddNew = () => {
    setEditingId(null);
    setName('');
    setStock(1);
    setBuyPrice(0);
    setCompatibleModels('');
    setIsFormOpen(true);
  };

  // Action: Edit
  const handleEdit = (sp: Sparepart) => {
    setEditingId(sp.id);
    setName(sp.name);
    setStock(sp.stock);
    setBuyPrice(sp.buyPrice);
    setCompatibleModels(sp.compatibleModels);
    setIsFormOpen(true);
  };

  // Action: Quick Stock Change (+ / -)
  const handleQuickStockChange = (sp: Sparepart, increment: number) => {
    const updatedStock = Math.max(0, sp.stock + increment);
    const updatedSparepart: Sparepart = {
      ...sp,
      stock: updatedStock
    };
    onSaveSparepart(updatedSparepart);
  };

  // Action: Save Form
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !compatibleModels.trim()) return;

    const newSp: Sparepart = {
      id: editingId || `sp-${Date.now()}`,
      name: name.trim(),
      stock: Number(stock),
      buyPrice: Number(buyPrice),
      sellingPrice: 0, // di-unused di POS yang langsung nembak Jasa Service
      compatibleModels: compatibleModels.trim(),
    };

    onSaveSparepart(newSp);
    setIsFormOpen(false);
  };

  // Count alerts
  const lowStockCount = spareparts.filter(s => s.stock > 0 && s.stock <= 2).length;
  const outOfStockCount = spareparts.filter(s => s.stock === 0).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Cpu className="text-indigo-600" size={18} />
            Manajemen Inventori & Stok Spareparts
          </h2>
          <p className="text-xs text-slate-550 mt-1">Kelola ketersediaan suku cadang Baterai, LCD screen, IC charging, dan flexiblenya untuk divisi servis HP.</p>
        </div>

        <button
          onClick={handleAddNew}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <Plus size={14} /> Tambah Sparepart Baru
        </button>
      </div>

      {/* Alert Cards for stock status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total spareparts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-205 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-sans">Katalog Suku Cadang</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{spareparts.length} <span className="text-xs text-slate-455 font-normal">Variasi</span></p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-655 rounded-xl border border-indigo-100">
            <Boxes size={16} />
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-205 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-sans">Persediaan Menipis (≤ 2 Pcs)</p>
            <p className="text-xl font-extrabold text-amber-600 mt-1">{lowStockCount} <span className="text-xs text-slate-455 font-normal">Suku Cadang</span></p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-655 rounded-xl border border-amber-100">
            <AlertTriangle size={16} className="animate-pulse" />
          </div>
        </div>

        {/* Out of stock count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-205 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-sans">Stok Habis (Kosong)</p>
            <p className="text-xl font-extrabold text-rose-600 mt-1">{outOfStockCount} <span className="text-xs text-slate-455 font-normal">Kosong</span></p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <HeartCrack size={16} />
          </div>
        </div>
      </div>

      {/* Admin New Form Drawer */}
      {isFormOpen && (activeRole === 'admin' || activeRole === 'owner') && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-205 rounded-3xl p-6 space-y-4 animate-fadeIn shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              {editingId ? 'Edit Suku Cadang Terpilih' : 'Registrasi Suku Cadang Masuk Baru'}
            </h3>
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer font-sans"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Name */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-500 mb-1.5 font-sans uppercase">Nama Suku Cadang / Sparepart</label>
              <input
                type="text"
                placeholder="Contoh: Baterai iPhone X Standard Capacity"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              />
            </div>

            {/* Compatible model strings */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-500 mb-1.5 font-sans uppercase">Kompatibel Dengan Tipe HP</label>
              <input
                type="text"
                placeholder="Contoh: iPhone X, iPhone XS, iPhone XR"
                value={compatibleModels}
                onChange={(e) => setCompatibleModels(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              />
            </div>

            {/* BuyPrice */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-500 mb-1.5 font-sans uppercase">Harga Beli Modal Sparepart (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={buyPrice || ''}
                onChange={(e) => setBuyPrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Initial Stock */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-500 mb-1.5 font-sans uppercase">Kuantitas Unit Masuk</label>
              <input
                type="number"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
                min={0}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold cursor-pointer font-sans"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Simpan Sparepart
            </button>
          </div>
        </form>
      )}

      {/* Main List Box */}
      <div className="bg-white border border-slate-205 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari spareparts atau kecocokan tipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div className="text-[10px] text-slate-455 font-mono font-bold uppercase tracking-wider">
            Penyaringan asinkron otomatis real-time
          </div>
        </div>

        {/* Database List Table */}
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-450 uppercase tracking-widest leading-none">
                <th className="py-3 px-3">Nama Suku Cadang</th>
                <th className="py-3 px-3 font-sans">Kecocokan Seri HP</th>
                {activeRole === 'owner' || activeRole === 'admin' ? (
                  <th className="py-3 px-3 text-right">Modal/HPP Unit</th>
                ) : null}
                <th className="py-3 px-3 text-center">Unit Tersedia</th>
                <th className="py-3 px-3 text-center">Cepat +/-</th>
                <th className="py-3 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSpareparts.map(sp => (
                <tr key={sp.id} className="hover:bg-slate-50/50 transition">
                  
                  <td className="py-3.5 px-3">
                    <p className="font-extrabold text-slate-905 text-xs">{sp.name}</p>
                    <p className="text-[10px] text-indigo-700 font-mono mt-0.5">ID: {sp.id}</p>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-slate-605 font-medium">{sp.compatibleModels}</span>
                  </td>

                  {activeRole === 'owner' || activeRole === 'admin' ? (
                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatIDR(sp.buyPrice)}
                    </td>
                  ) : null}

                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono ${
                      sp.stock === 0 
                        ? 'bg-rose-50 text-rose-700' 
                        : sp.stock <= 2
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {sp.stock === 0 ? 'HABIS KOSONG' : `${sp.stock} Pcs`}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={() => handleQuickStockChange(sp, -1)}
                        disabled={sp.stock === 0}
                        className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center font-bold border border-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[11px]"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleQuickStockChange(sp, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center font-bold border border-slate-200 cursor-pointer text-[11px]"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <div className="flex justify-center items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(sp)}
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-indigo-705 text-[10.5px] font-bold border border-slate-200 hover:text-indigo-800 rounded-lg transition cursor-pointer"
                      >
                        Edit
                      </button>
                      {(activeRole === 'owner' || activeRole === 'admin') && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus ${sp.name} secara permanen dari server?`)) {
                              onDeleteSparepart(sp.id);
                            }
                          }}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-505 hover:text-rose-700 border border-slate-200 hover:border-rose-100 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}

              {filteredSpareparts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AlertCircle size={20} className="text-slate-300" />
                      <p className="font-bold text-xs text-slate-700">Arsip inventori sparepart kosong.</p>
                      <p className="text-[10.5px] text-slate-455">Tambahkan master data baru untuk dikaitkan ke nota servis.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic footer metrics under table */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10.5px] text-slate-400 font-mono font-bold">
          <span>MENAMPILKAN {filteredSpareparts.length} DARI TOTAL {spareparts.length} BARANG INVENTORI</span>
          <span>AFM CLOUD SYSTEM</span>
        </div>

      </div>
    </div>
  );
}
