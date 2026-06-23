import { useState, FormEvent, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Wrench, 
  Clock, 
  Play, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  DollarSign,
  AlertCircle,
  EyeOff
} from 'lucide-react';
import { Service, UserRole, Sparepart, Customer } from '../types';

interface ServiceHPProps {
  services: Service[];
  activeRole: UserRole;
  spareparts?: Sparepart[];
  onSaveService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  customers?: Customer[];
}

export default function ServiceHP({
  services,
  activeRole,
  spareparts = [],
  onSaveService,
  onDeleteService,
  customers = [],
}: ServiceHPProps) {

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'proses' | 'selesai'>('all');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const matchedCustomers = useMemo(() => {
    if (!customerName.trim()) return [];
    return customers.filter((c) => 
      c.name.toLowerCase().includes(customerName.toLowerCase()) ||
      c.phone.includes(customerName)
    );
  }, [customerName, customers]);
  const [devModel, setDevModel] = useState('');
  const [imei, setImei] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'proses' | 'selesai'>('pending');
  const [cost, setCost] = useState<number>(0);
  const [capitalCost, setCapitalCost] = useState<number>(0);
  const [sparepartId, setSparepartId] = useState<string>('');

  // Format IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.devModel.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.customerPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Open Form to add new
  const handleAddNew = () => {
    setEditingId(null);
    setCustomerName('');
    setCustomerPhone('');
    setDevModel('');
    setImei('');
    setDescription('');
    setStatus('pending');
    setCost(0);
    setCapitalCost(0);
    setSparepartId('');
    setIsFormOpen(true);
  };

  // Open Form to edit
  const handleEdit = (s: Service) => {
    setEditingId(s.id);
    setCustomerName(s.customerName);
    setCustomerPhone(s.customerPhone);
    setDevModel(s.devModel);
    setImei(s.imei || '');
    setDescription(s.description);
    setStatus(s.status);
    setCost(s.cost);
    setCapitalCost(s.capitalCost);
    setSparepartId(s.sparepartId || '');
    setIsFormOpen(true);
  };

  // Switch status quickly
  const handleQuickStatusChange = (service: Service, nextStatus: 'pending' | 'proses' | 'selesai') => {
    let finalCapitalCost = service.capitalCost || 0;
    if (nextStatus === 'selesai' && service.sparepartId && (!finalCapitalCost || finalCapitalCost === 0)) {
      const selectedSp = spareparts.find(sp => sp.id === service.sparepartId);
      if (selectedSp) {
        finalCapitalCost = selectedSp.buyPrice;
      }
    }

    const updatedSrv: Service = {
      ...service,
      status: nextStatus,
      capitalCost: finalCapitalCost
    };
    onSaveService(updatedSrv);
  };

  // Submit Handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !devModel.trim() || !description.trim()) return;

    const selectedSp = spareparts.find(sp => sp.id === sparepartId);

    let finalCapitalCost = 0;
    if (activeRole === 'admin' || activeRole === 'owner') {
      finalCapitalCost = Number(capitalCost);
      // Auto-populate with sparepart buyPrice if it was left at 0 but a sparepart was chosen
      if (selectedSp && (!finalCapitalCost || finalCapitalCost === 0)) {
        finalCapitalCost = selectedSp.buyPrice;
      }
    } else {
      // For karyawan, use the sparepart's buyPrice if a sparepart is selected, 
      // otherwise use the existing capitalCost (if editing) or 0
      if (selectedSp) {
        finalCapitalCost = selectedSp.buyPrice;
      } else if (editingId) {
        finalCapitalCost = services.find(s => s.id === editingId)?.capitalCost || 0;
      } else {
        finalCapitalCost = 0;
      }
    }

    const newService: Service = {
      id: editingId || `srv-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      devModel: devModel.trim(),
      imei: imei.trim() || undefined,
      description: description.trim(),
      status,
      cost: Number(cost),
      capitalCost: finalCapitalCost,
      date: editingId ? services.find(s => s.id === editingId)?.date || new Date().toISOString() : new Date().toISOString(),
      sparepartId: sparepartId || undefined,
      sparepartName: selectedSp ? selectedSp.name : undefined
    };

    onSaveService(newService);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Manajemen Jasa Jual Service HP</h2>
          <p className="text-xs text-slate-500 mt-1 leading-normal max-w-xl">
            Registrasi pendaftaran perbaikan HP konsumen, pelabelan keluhan mekanik, estimasi biaya nota servis, pembebanan suku cadang langsung, serta pemantauan garansi purna jual.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAddNew}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <Plus size={14} /> Registrasi Service Baru
        </button>
      </div>

      {/* Register / Update Service Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Wrench size={16} className="text-indigo-600" />
            {editingId ? `Penyesuaian Nota Servis - ${customerName}` : 'Pendaftaran Reparasi HP Baru'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
            <div className="relative z-50">
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Nama Lengkap Pelanggan</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs relative z-50"
                required
              />
              {showCustomerDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowCustomerDropdown(false)} />
              )}
              {/* Autocomplete Overlay */}
              {showCustomerDropdown && matchedCustomers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-250 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-1.5 bg-slate-50 text-[9px] text-slate-400 font-bold px-3">Pelanggan Terdaftar</div>
                  {matchedCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone);
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-indigo-50 transition-all flex justify-between items-center cursor-pointer"
                    >
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="text-[10px] text-indigo-600 font-mono font-bold bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/30">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">No WhatsApp HP Aktif</label>
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Tipe Smartphone (Perangkat)</label>
              <input
                type="text"
                placeholder="Contoh: iPhone 11 Pro Max Gray"
                value={devModel}
                onChange={(e) => setDevModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">IMEI Perangkat (Opsional)</label>
              <input
                type="text"
                placeholder="IMEI 15 digit..."
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Kerusakan & Keluhan Detail</label>
              <input
                type="text"
                placeholder="Contoh: Ganti Layar LCD Original / Retak Kaca Depan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Merek Suku Cadang (Dipotong Otomatis)</label>
              <select
                value={sparepartId}
                onChange={(e) => {
                  const spId = e.target.value;
                  setSparepartId(spId);
                  const selectedSp = spareparts.find(sp => sp.id === spId);
                  if (selectedSp) {
                    setCapitalCost(selectedSp.buyPrice);
                    // auto fill cost to sparepart sellingPrice if current cost is 0 or less
                    if (!cost || cost === 0) {
                      setCost(selectedSp.sellingPrice);
                    }
                  } else {
                    setCapitalCost(0);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">-- Jasa Murni (Tanpa Ganti Sparepart) --</option>
                {spareparts.map((sp) => (
                  <option key={sp.id} value={sp.id} disabled={(sp.stock || 0) <= 0}>
                    {sp.name} (Ready: {sp.stock} Pcs - Jual: {formatIDR(sp.sellingPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Biaya Nota Servis Ke Pelanggan (Rp)</label>
              <input
                type="number"
                placeholder="Nominal biaya jasa & sparepart..."
                value={cost || ''}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            {(activeRole === 'admin' || activeRole === 'owner') ? (
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Modal Pokok Reparasi (Biaya Part) (Rp)</label>
                <input
                  type="number"
                  placeholder="Harga modal sparepart grosir..."
                  value={capitalCost || ''}
                  onChange={(e) => setCapitalCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Tahap Status Nota</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="pending">Antrean Pending (Baru Masuk)</option>
                <option value="proses">Dalam Proses Reparasi Mekanik</option>
                <option value="selesai">Selesai (Siap Diambil / Rampung)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Batalkan
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md whitespace-nowrap cursor-pointer"
            >
              Simpan Nota Servis
            </button>
          </div>
        </form>
      )}

      {/* Main Services Table List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-250/60">
          
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari nama, tipe HP, atau No HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 transition focus:outline-none"
            />
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sans tracking-wider">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 bg-whitespace bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none"
            >
              <option value="all">Semua Antrean</option>
              <option value="pending">Antrean Pending</option>
              <option value="proses">Dalam Proses</option>
              <option value="selesai">Selesai/Rampung</option>
            </select>
          </div>
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Konsumen</th>
                <th className="py-3 px-3">HP & Deskripsi Keluhan</th>
                <th className="py-3 px-3 text-right">Biaya Nota</th>
                {activeRole === 'owner' || activeRole === 'admin' ? <th className="py-3 px-3 text-right">Modal/Laba</th> : null}
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((srv) => {
                const srvDate = new Date(srv.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                
                const repairProfit = srv.cost - srv.capitalCost;

                return (
                  <tr key={srv.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {srvDate}
                    </td>

                    <td className="py-3.5 px-3">
                      <p className="font-extrabold text-slate-900 text-xs">{srv.customerName}</p>
                      <p className="text-[10px] text-slate-400">{srv.customerPhone}</p>
                      {srv.sparepartName && (
                        <p className="text-[10px] text-cyan-700 font-medium mt-0.5" title="Suku cadang dipotong inventori">
                          📦 {srv.sparepartName}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-indigo-700">{srv.devModel}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5 max-w-[200px] truncate" title={srv.description}>
                        {srv.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatIDR(srv.cost)}
                    </td>

                    {activeRole === 'owner' || activeRole === 'admin' ? (
                      <td className="py-3.5 px-3 text-right">
                        <p className="font-mono text-slate-400 text-[11px]">Modal: {formatIDR(srv.capitalCost)}</p>
                        <p className="font-mono text-emerald-600 font-bold mt-0.5">Laba: {formatIDR(repairProfit)}</p>
                      </td>
                    ) : null}

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        srv.status === 'pending'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : srv.status === 'proses'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        <Clock size={9} />
                        {srv.status === 'pending' ? 'Pending' : srv.status === 'proses' ? 'Proses' : 'Selesai'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        {/* Quick Action Progression Controls */}
                        {srv.status === 'pending' && (
                          <button
                            onClick={() => handleQuickStatusChange(srv, 'proses')}
                            className="p-1 px-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-bold border border-amber-200 transition cursor-pointer flex items-center gap-0.5"
                            title="Mulai proses reparasi mekanik"
                          >
                            <Play size={10} /> <span className="text-[10px]">Proses</span>
                          </button>
                        )}
                        
                        {srv.status === 'proses' && (
                          <button
                            onClick={() => handleQuickStatusChange(srv, 'selesai')}
                            className="p-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold border border-emerald-200 transition cursor-pointer flex items-center gap-0.5"
                            title="Selesaikan perbaikan (Stok sparepart otomatis terpotong)"
                          >
                            <CheckCircle2 size={10} /> <span className="text-[10px]">Selesai</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(srv)}
                          className="p-1 px-2.5 text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer"
                          title="Edit parameter service"
                        >
                          Edit
                        </button>

                        {(activeRole === 'admin' || activeRole === 'owner') && (
                          <button
                            onClick={() => {
                              if (confirm('Hapus nota pendaftaran service ini?')) {
                                onDeleteService(srv.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 rounded-lg transition cursor-pointer"
                            title="Hapus data service"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AlertCircle size={20} className="text-slate-400" />
                      <p className="font-bold text-xs text-slate-600">Arsip antrean servis kosong.</p>
                      <p className="text-[10.5px]">Cukup klik "Registrasi Service Baru" untuk mendaftarkan nota HP masuk.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic total counter metrics under table */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10.5px] text-slate-400 font-mono">
          <span>Menampilkan {filteredServices.length} dari total {services.length} riwayat perbaikan</span>
          <span>AFM Cloud System</span>
        </div>

      </div>
    </div>
  );
}
