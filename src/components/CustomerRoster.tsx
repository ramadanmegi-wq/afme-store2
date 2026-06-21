import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  History, 
  Smartphone, 
  Wrench, 
  MessageSquare, 
  Receipt,
  Calendar,
  AlertCircle,
  UserPlus,
  Edit,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { Customer, Transaction, Service } from '../types';

interface CustomerRosterProps {
  customers: Customer[];
  transactions: Transaction[];
  services: Service[];
  onSaveCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
}

export default function CustomerRoster({
  customers,
  transactions,
  services,
  onSaveCustomer,
  onDeleteCustomer,
}: CustomerRosterProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Customer Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const handleOpenAddModal = () => {
    setModalMode('create');
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: { id: string; name: string; phone: string }, e: React.MouseEvent) => {
    e.stopPropagation(); // avoid card select
    setModalMode('edit');
    setEditingCustomer({
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
    });
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (onSaveCustomer) {
      onSaveCustomer({
        id: modalMode === 'edit' && editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim()
      });
    }
    handleCloseModal();
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // avoid card select
    if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini dari sistem?')) {
      if (onDeleteCustomer) {
        onDeleteCustomer(id);
        if (selectedCustomerId === id) setSelectedCustomerId(null);
      }
    }
  };

  // Format IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Normalize name & phone to handle variations gracefully (e.g. spaces, dashes, +62 vs 0)
  const getCustomerKey = (name: string, phone: string) => {
    const normName = name.trim().toLowerCase();
    const normPhone = phone.trim().replace(/[\s\-\(\)\+]/g, '').replace(/^62/, '0');
    return `${normName}_${normPhone}`;
  };

  // Merge registered customers with dynamic ones from transactions and services
  const allMergedCustomers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string }>();

    // 1. Add all registered customers from database
    customers.forEach((c) => {
      const cleanPhone = c.phone.trim();
      const cleanName = c.name.trim();
      if (cleanPhone && cleanName) {
        const lowerName = cleanName.toLowerCase();
        if (lowerName === 'pelanggan umum' || lowerName === 'customer umum' || lowerName === 'umum') {
          return;
        }
        const key = getCustomerKey(cleanName, cleanPhone);
        map.set(key, {
          id: c.id,
          name: cleanName,
          phone: cleanPhone,
        });
      }
    });

    // 2. Scan transactions for any missing ones (POS customers)
    transactions.forEach((tx) => {
      const cleanPhone = tx.customerPhone?.trim();
      const cleanName = tx.customerName?.trim();
      if (cleanPhone && cleanName) {
        const lowerName = cleanName.toLowerCase();
        if (lowerName === 'pelanggan umum' || lowerName === 'customer umum' || lowerName === 'umum') {
          return;
        }
        const key = getCustomerKey(cleanName, cleanPhone);
        if (!map.has(key)) {
          map.set(key, {
            id: `cust-tx-${tx.id}`,
            name: cleanName,
            phone: cleanPhone,
          });
        }
      }
    });

    // 3. Scan services for any missing ones (Service customers)
    services.forEach((srv) => {
      const cleanPhone = srv.customerPhone?.trim();
      const cleanName = srv.customerName?.trim();
      if (cleanPhone && cleanName) {
        const lowerName = cleanName.toLowerCase();
        if (lowerName === 'pelanggan umum' || lowerName === 'customer umum' || lowerName === 'umum') {
          return;
        }
        const key = getCustomerKey(cleanName, cleanPhone);
        if (!map.has(key)) {
          map.set(key, {
            id: `cust-srv-${srv.id}`,
            name: cleanName,
            phone: cleanPhone,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [customers, transactions, services]);

  // Filter customers by search
  const filteredCustomers = allMergedCustomers.filter((c) => {
    const normSearch = searchTerm.toLowerCase();
    const cleanSearchDigits = searchTerm.replace(/[\s\-\(\)\+]/g, '');
    const cleanPhoneDigits = c.phone.replace(/[\s\-\(\)\+]/g, '');
    return c.name.toLowerCase().includes(normSearch) || 
           c.phone.includes(searchTerm) ||
           (cleanSearchDigits.length > 0 && cleanPhoneDigits.includes(cleanSearchDigits));
  });

  // Calculate high-level metrics for each customer based on Transactions and Service logs
  const customerStats = useMemo(() => {
    const stats: { 
      [key: string]: { 
        totalTrxAmount: number; 
        trxCount: number;
        serviceCount: number;
        totalServiceCost: number;
      } 
    } = {};

    // Initialize all known customers
    allMergedCustomers.forEach((c) => {
      const key = getCustomerKey(c.name, c.phone);
      stats[key] = {
        totalTrxAmount: 0,
        trxCount: 0,
        serviceCount: 0,
        totalServiceCost: 0,
      };
    });

    // Populate from Transactions
    transactions.forEach((t) => {
      if (t.customerPhone && t.customerName) {
        const key = getCustomerKey(t.customerName, t.customerPhone);
        if (!stats[key]) {
          stats[key] = {
            totalTrxAmount: 0,
            trxCount: 0,
            serviceCount: 0,
            totalServiceCost: 0,
          };
        }
        stats[key].totalTrxAmount += t.totalAmount;
        stats[key].trxCount += 1;
      }
    });

    // Populate from Services
    services.forEach((s) => {
      if (s.customerPhone && s.customerName) {
        const key = getCustomerKey(s.customerName, s.customerPhone);
        if (!stats[key]) {
          stats[key] = {
            totalTrxAmount: 0,
            trxCount: 0,
            serviceCount: 0,
            totalServiceCost: 0,
          };
        }
        stats[key].totalServiceCost += s.cost;
        stats[key].serviceCount += 1;
      }
    });

    return stats;
  }, [allMergedCustomers, transactions, services]);

  // Selected customer model
  const selectedCustomer = allMergedCustomers.find((c) => c.id === selectedCustomerId);

  // Selected customer's specific history
  const customerHistory = useMemo(() => {
    if (!selectedCustomer) return { trxs: [], servs: [] };
    const key = getCustomerKey(selectedCustomer.name, selectedCustomer.phone);

    const trxs = transactions.filter(
      (t) => t.customerPhone && t.customerName && getCustomerKey(t.customerName, t.customerPhone) === key
    );
    const servs = services.filter(
      (s) => s.customerPhone && s.customerName && getCustomerKey(s.customerName, s.customerPhone) === key
    );

    return { trxs, servs };
  }, [selectedCustomer, transactions, services]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LHS: Customer Records (7 Columns) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Header Title */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/85 shadow-sm flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
              <Users size={18} className="text-indigo-600" /> Direktori Register Pelanggan
            </h2>
            <p className="text-xs text-slate-500 mt-1 pb-1">
              Jumlah kumulatif {allMergedCustomers.length} pelanggan hasil rekam pos kasir dan divisi perbaikan.
            </p>
          </div>

          {/* Search & Add Action Wrapper */}
          <div className="flex items-center gap-2.5 max-w-md w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:max-w-[200px] md:max-w-[240px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Cari pelanggan (nama / hp)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus size={13} /> Pelanggan Baru
            </button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCustomers.map((cust) => {
            const compositeKey = getCustomerKey(cust.name, cust.phone);
            const stat = customerStats[compositeKey] || { totalTrxAmount: 0, trxCount: 0, serviceCount: 0, totalServiceCost: 0 };
            const isSelected = cust.id === selectedCustomerId;

            return (
              <div 
                key={cust.id}
                onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)}
                className={`p-5 rounded-3xl border cursor-pointer transition flex flex-col justify-between h-44 ${
                  isSelected 
                    ? 'bg-indigo-50 border-indigo-400/80 shadow-md' 
                    : 'bg-white border-slate-200/85 hover:border-slate-350'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-xs text-indigo-700 border border-slate-200 uppercase font-mono">
                      {cust.name.slice(0, 2)}
                    </span>
                    <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-mono font-bold">
                      {cust.phone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3.5 gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight truncate flex-1">
                      {cust.name}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleOpenEditModal(cust, e)}
                        className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-400 transition cursor-pointer"
                        title="Edit Profil"
                      >
                        <Edit size={12} />
                      </button>
                      {!cust.id.startsWith('cust-tx-') && !cust.id.startsWith('cust-srv-') && (
                        <button
                          onClick={(e) => handleDeleteClick(cust.id, e)}
                          className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition cursor-pointer"
                          title="Hapus Pelanggan"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <div className="text-slate-500 leading-tight space-y-0.5 font-sans">
                    <p>Pembelian POS: <span className="font-bold text-slate-900">{stat.trxCount}x</span></p>
                    <p>Total POS: <span className="font-bold text-slate-700 font-mono">{formatIDR(stat.totalTrxAmount)}</span></p>
                  </div>
                  <div className="text-right text-slate-500 leading-tight space-y-0.5 font-sans">
                    <p>Antrean Service: <span className="font-bold text-slate-900">{stat.serviceCount}x</span></p>
                    <p>Total Service: <span className="font-bold text-slate-700 font-mono">{formatIDR(stat.totalServiceCost)}</span></p>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="col-span-full py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-slate-500">
              <Users className="mx-auto text-slate-400 mb-2" size={30} />
              <p className="font-bold text-slate-700 text-xs">Pelanggan tidak terekam</p>
              <p className="text-[10px] text-slate-405 mt-1">Pelanggan akan dicatatkan otomatis di POS maupun Nota Jasa Servis.</p>
            </div>
          )}
        </div>
      </div>

      {/* RHS: Interactive History Canvas (5 Columns) */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200/85 rounded-3xl p-5 shadow-sm space-y-6">
          
          <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2 pb-4 border-b border-slate-100">
            <History size={14} className="text-indigo-600" /> Riwayat Transaksi & Garansi
          </h3>

          {selectedCustomer ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Profile Card Header */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Terpilih Untuk Tinjauan</p>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1.5 truncate">{selectedCustomer.name}</h4>
                <p className="text-slate-500 text-xs mt-1 font-mono">{selectedCustomer.phone}</p>
                
                <a 
                  href={`https://wa.me/${selectedCustomer.phone}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-150 font-bold transition-all cursor-pointer"
                >
                  <MessageSquare size={12} /> WhatsApp Pelanggan
                </a>
              </div>

              {/* Transactions History list */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt size={13} className="text-slate-400" /> Nota Kasir POS ({customerHistory.trxs.length})
                </h5>
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 scrollbar-none">
                  {customerHistory.trxs.map((tx: Transaction) => (
                    <div key={tx.id} className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs space-y-2">
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span className="font-mono">{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                        <span className="font-mono text-indigo-750 font-bold">{tx.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="space-y-1">
                        {tx.items.map((it, idx) => (
                          <p key={idx} className="font-bold text-slate-800 text-[11px]">• {it.model} ({it.quantity} Pcs)</p>
                        ))}
                      </div>
                      {tx.tradeIn && (
                        <p className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-100 p-1 rounded">
                          Tukar Tambah HP: {tx.tradeIn.model}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                        <span>Total Bayar:</span>
                        <span className="font-mono text-indigo-600">{formatIDR(tx.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                  {customerHistory.trxs.length === 0 && (
                    <p className="text-center py-4 text-slate-400 text-xs">Belum ada struk pembelian HP/aksesoris.</p>
                  )}
                </div>
              </div>

              {/* Repairs History list */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench size={13} className="text-slate-400" /> Nota Servis Reparasi ({customerHistory.servs.length})
                </h5>
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 scrollbar-none">
                  {customerHistory.servs.map((sv: Service) => (
                    <div key={sv.id} className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs space-y-2">
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span className="font-mono">{new Date(sv.date).toLocaleDateString('id-ID')}</span>
                        <span className={`px-1.5 py-0.2 rounded-md font-bold uppercase ${
                          sv.status === 'selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {sv.status}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-indigo-700 text-xs">{sv.devModel}</p>
                        <p className="text-slate-600 text-[11px] mt-1">{sv.description}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200 pt-1 text-[11px] font-extrabold text-slate-900">
                        <span>Biaya Servis:</span>
                        <span className="font-mono text-indigo-600">{formatIDR(sv.cost)}</span>
                      </div>
                    </div>
                  ))}
                  {customerHistory.servs.length === 0 && (
                    <p className="text-center py-4 text-slate-400 text-xs">Belum pernah mendaftar service HP di toko ini.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs leading-normal space-y-2">
              <Calendar className="mx-auto text-slate-350" size={24} />
              <p className="font-bold text-slate-700">Direktori Riwayat Pelanggan</p>
              <p className="text-slate-455">Tekan salah satu kartu pelanggan di sebelah kiri untuk meninjau secara mendalam.</p>
            </div>
          )}

        </div>
      </div>

      {/* Customer Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mb-2">
              <UserPlus size={16} className="text-indigo-600" />
              {modalMode === 'edit'
                ? `Edit Pelanggan: ${editingCustomer?.name}`
                : 'Pendaftaran Pelanggan Baru'}
            </h3>
            <p className="text-[11px] text-slate-450 mb-4 leading-normal">
              Masukkan data pelanggan dengan benar. Informasi ini akan tersinkronisasi otomatis dengan fitur Autocomplete di Kasir POS & Antrean Servis.
            </p>

            {modalMode === 'edit' && editingCustomer && (editingCustomer.id.startsWith('cust-tx-') || editingCustomer.id.startsWith('cust-srv-')) && (
              <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-2xl mb-4 text-[10px] text-indigo-700 leading-normal">
                💡 <strong>Informasi:</strong> Anda sedang mendefinisikan identitas untuk transaksi instan/guest sebelumnya. Menyimpan nama ini akan mendaftarkannya sebagai pelanggan tetap baru.
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Nama Lengkap Pelanggan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Ramadhan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Nomor HP WhatsApp HP Aktif
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-sans transition cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  {modalMode === 'edit' ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
