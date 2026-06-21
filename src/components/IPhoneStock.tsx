import { useState, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Smartphone, 
  Filter, 
  EyeOff, 
  RotateCcw, 
  Package,
  AlertCircle
} from 'lucide-react';
import { Product, ProductType, UserRole } from '../types';

interface IPhoneStockProps {
  products: Product[];
  activeRole: UserRole;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  typeFilter?: 'iphone' | 'aksesoris';
}

export default function IPhoneStock({
  products,
  activeRole,
  onSaveProduct,
  onDeleteProduct,
  typeFilter,
}: IPhoneStockProps) {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'iphone' | 'aksesoris'>(typeFilter || 'all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold'>('all');

  // Form states (Admin / Owner only)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [type, setType] = useState<ProductType>(typeFilter || 'iphone');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [repairCost, setRepairCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [status, setStatus] = useState<'available' | 'sold'>('available');
  const [stock, setStock] = useState<number>(1);

  // Format IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.imei && p.imei.includes(searchTerm));
    const matchesType = typeFilter ? p.type === typeFilter : (filterType === 'all' || p.type === filterType);
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Open form for adding new stock
  const handleAddNew = () => {
    setEditingId(null);
    setType(typeFilter || 'iphone');
    setModel('');
    setImei('');
    setBuyPrice(0);
    setRepairCost(0);
    setSellingPrice(0);
    setStatus('available');
    setStock(1);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setType(p.type);
    setModel(p.model);
    setImei(p.imei || '');
    setBuyPrice(p.buyPrice);
    setRepairCost(p.repairCost);
    setSellingPrice(p.sellingPrice);
    setStatus(p.status);
    setStock(p.stock || 1);
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;

    const newProduct: Product = {
      id: editingId || `prod-${Date.now()}`,
      type,
      model: model.trim(),
      imei: type === 'iphone' ? imei.trim() : undefined,
      buyPrice: Number(buyPrice),
      repairCost: type === 'iphone' ? Number(repairCost) : 0,
      sellingPrice: Number(sellingPrice),
      status,
      stock: type === 'aksesoris' ? Number(stock) : undefined,
    };

    onSaveProduct(newProduct);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {typeFilter === 'iphone' ? 'Manajemen Stok HP Second' : typeFilter === 'aksesoris' ? 'Manajemen Stok Aksesoris' : 'Katalog Inventori AFM Store'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-normal max-w-xl">
            {typeFilter === 'iphone' ? 'Kelola metadata, IMEI unik, laba terproyeksi, estimasi servis, serta status pemasaran unit HP bekas.' : typeFilter === 'aksesoris' ? 'Kelola stok reorder point aksesoris casing, charger, anti gores, serta aksesoris audio.' : 'Kelola inventori terintegrasi cloud Supabase.'}
          </p>
        </div>

        {/* Add Product Button (Admin only) */}
        {(activeRole === 'admin' || activeRole === 'owner') ? (
          <button
            onClick={handleAddNew}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/10"
          >
            <Plus size={14} /> {typeFilter === 'iphone' ? 'Tambah Stok Smartphone' : typeFilter === 'aksesoris' ? 'Tambah Stok Aksesoris' : 'Tambah Inventori'}
          </button>
        ) : (
          <div className="text-[11px] px-3 py-2 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-1.5 border border-rose-100 font-bold">
            <EyeOff size={12} /> Akses Terbatas (Mode Kasir)
          </div>
        )}
      </div>

      {/* Admin Add/Edit Form Panel */}
      {isFormOpen && (activeRole === 'admin' || activeRole === 'owner') && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Plus size={16} className="text-indigo-600" />
            {editingId ? `Edit ${model}` : 'Barang Masuk Inventaris Baru'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Field: Type Selection */}
            {!typeFilter && (
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Tipe Barang</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as ProductType;
                    setType(t);
                    setStock(t === 'aksesoris' ? 10 : 1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="iphone">HP Second (iPhone)</option>
                  <option value="aksesoris font-sans">Aksesoris Barang</option>
                </select>
              </div>
            )}

            {/* Field: Model Brand Name */}
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Nama / Model Produk Baru</label>
              <input
                type="text"
                placeholder="Contoh: iPhone 13 Pro Max 256GB Sierra Blue Resmi iBox"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Field: IMEI (For Smartphone unique identifier) */}
            {type === 'iphone' && (
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Satelit Digit IMEI</label>
                <input
                  type="text"
                  placeholder="Masukkan 15 digit nomor IMEI"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Field: Buy Price (Modal Pokok) */}
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Harga Modal Pokok (Rp)</label>
              <input
                type="number"
                placeholder="Nilai pokok modal pembelian..."
                value={buyPrice || ''}
                onChange={(e) => setBuyPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Field: Repair Cost (Estimasi Servis / iPhone only) */}
            {type === 'iphone' && (
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Estimasi Biaya Reparasi (Rp)</label>
                <input
                  type="number"
                  placeholder="Isi 0 jika unit mulus siap pajang..."
                  value={repairCost || ''}
                  onChange={(e) => setRepairCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            {/* Field: Selling Price */}
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Kalkulasi Harga Jual (Rp)</label>
              <input
                type="number"
                placeholder="Rekomendasi harga jual toko..."
                value={sellingPrice || ''}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Field: Status marketing (Only for Smartphone) */}
            {type === 'iphone' && (
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Status Pemasaran</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="available">Tersedia (Ready Stock)</option>
                  <option value="sold">Terjual (Sold Out)</option>
                </select>
              </div>
            )}

            {/* Field: Stock quantity (For accessories only) */}
            {type === 'aksesoris' && (
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Volume Stok Barang</label>
                <input
                  type="number"
                  placeholder="Kuantitas stok..."
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md cursor-pointer"
            >
              Simpan Data Inventori
            </button>
          </div>
        </form>
      )}

      {/* Filters & Table Wrapper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        
        {/* Filters Top Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-250/60">
          
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari model barang atau IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 transition focus:outline-none"
            />
          </div>

          {/* Core Select filters */}
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto items-center">
            
            <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
              <Filter size={11} /> Filter:
            </span>

            {/* Filter Type */}
            {!typeFilter ? (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-whitespace bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none"
              >
                <option value="all">Semua Tipe</option>
                <option value="iphone">iPhone Second</option>
                <option value="aksesoris">Aksesoris</option>
              </select>
            ) : null}

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="available">Tersedia (Ready)</option>
              <option value="sold">Terjual (Sold)</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="p-1 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Reset Saringan Pencarian"
              >
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Database List Table */}
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-3">Tipe/Merek</th>
                <th className="py-3 px-3">Deskripsi Barang</th>
                {activeRole === 'owner' || activeRole === 'admin' ? (
                  <>
                    <th className="py-3 px-3 text-right">Modal Pokok</th>
                    <th className="py-3 px-3 text-right">Biaya Servis</th>
                  </>
                ) : null}
                <th className="py-3 px-3 text-right">Harga Jual</th>
                <th className="py-3 px-3 text-center">Status/Stok</th>
                {(activeRole === 'admin' || activeRole === 'owner') && <th className="py-3 px-3 text-center">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isIphone = p.type === 'iphone';
                const totalModal = p.buyPrice + (p.repairCost || 0);
                const estimatedProfit = p.sellingPrice - totalModal;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        isIphone 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {isIphone ? <Smartphone size={10} /> : <Package size={10} />}
                        {isIphone ? 'iPhone' : 'Aks'}
                      </span>
                    </td>
                    
                    <td className="py-3.5 px-3">
                      <p className="font-extrabold text-slate-900 text-xs">{p.model}</p>
                      {p.imei && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">IMEI: {p.imei}</p>
                      )}
                    </td>

                    {activeRole === 'owner' || activeRole === 'admin' ? (
                      <>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                          {formatIDR(p.buyPrice)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                          {isIphone ? formatIDR(p.repairCost || 0) : '-'}
                        </td>
                      </>
                    ) : null}

                    <td className="py-3.5 px-3 text-right">
                      <p className="font-extrabold text-slate-900 font-mono">{formatIDR(p.sellingPrice)}</p>
                      {activeRole === 'owner' || activeRole === 'admin' ? (
                        <p className="text-[10px] text-emerald-600 font-mono mt-0.5" title="Estimasi Laba Bersih">
                          +{formatIDR(estimatedProfit)}
                        </p>
                      ) : null}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {isIphone ? (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          p.status === 'available'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                        }`}>
                          {p.status === 'available' ? 'Tersedia' : 'Terjual'}
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                          (p.stock || 0) > 4
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          Stok: {p.stock || 0} Pcs
                        </span>
                      )}
                    </td>

                    {(activeRole === 'admin' || activeRole === 'owner') && (
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition flex items-center gap-0.5 cursor-pointer"
                            title="Edit parameter produk"
                          >
                            <Edit3 size={11} /> <span>Edit</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm(`Hapus ${p.model} secara permanen dari server?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg transition cursor-pointer"
                            title="Hapus data barang"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AlertCircle size={20} className="text-slate-400" />
                      <p className="font-bold text-xs text-slate-600">Awan kosong, tidak ada data barang terdeteksi.</p>
                      <p className="text-[10.5px]">Tambahkan stok atau periksa filter setelan status Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic total counter metrics under table */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10.5px] text-slate-400 font-mono">
          <span>Menampilkan {filteredProducts.length} dari total {products.length} barang inventori</span>
          <span>AFM Cloud System</span>
        </div>

      </div>
    </div>
  );
}
