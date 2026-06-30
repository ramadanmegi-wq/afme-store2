import { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  TrendingUp, 
  ArrowRightLeft, 
  UserPlus, 
  Sparkles, 
  CheckCircle, 
  Printer,
  AlertTriangle,
  Copy,
  ExternalLink,
  Check,
  FileText
} from 'lucide-react';
import { Product, Transaction, TransactionItem, TradeInItem, UserRole, Customer } from '../types';

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
};

interface POSProps {
  products: Product[];
  activeRole: UserRole;
  onCheckout: (transaction: Transaction) => void;
  cashierName: string;
  customers?: Customer[];
}

export default function POS({ products, activeRole, onCheckout, cashierName, customers = [] }: POSProps) {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'iphone' | 'aksesoris'>('all');
  
  // Cart
  const [cart, setCart] = useState<TransactionItem[]>([]);
  
  // Customer details
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
  
  // Trade-In (Tukar Tambah)
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInModel, setTradeInModel] = useState('');
  const [tradeInImei, setTradeInImei] = useState('');
  const [tradeInValue, setTradeInValue] = useState<number>(0);
  const [tradeInRepairCost, setTradeInRepairCost] = useState<number>(0);

  // Checkout Success Screen
  const [lastTrx, setLastTrx] = useState<Transaction | null>(null);

  // Print & Fallback Copy States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyReceiptText = () => {
    if (!lastTrx) return;
    
    const formattedDate = new Date(lastTrx.date).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const cartDetails = lastTrx.items
      .map((it) => `- ${it.model} (${it.quantity}x @ ${formatIDR(it.sellingPrice)})`)
      .join('\n');

    let tradeInTxt = '';
    if (lastTrx.tradeIn) {
      tradeInTxt = `\n\nPotongan Tukar Tambah (Trade-In):\n- ${lastTrx.tradeIn.model} (IMEI: ${lastTrx.tradeIn.imei})\n  Harga Tukar: -${formatIDR(lastTrx.tradeIn.buyPrice)}`;
    }

    const plainReceipt = `=============================
🧾 AFM STORE - NOTA TRANSAKSI
=============================
No. Transaksi : ${lastTrx.id}
Tanggal       : ${formattedDate}
Staff Kasir   : ${lastTrx.cashierName || 'Staff AFM'}
Pelanggan     : ${lastTrx.customerName} (${lastTrx.customerPhone})
=============================
RINCIAN BELANJA:
${cartDetails}
${tradeInTxt}
=============================
TOTAL BAYAR   : ${formatIDR(lastTrx.totalAmount)}
=============================
Terima kasih banyak atas belanja Anda di AFM STORE! Semoga gadget barunya berkah & awet selalu. 👍😊`;

    navigator.clipboard.writeText(plainReceipt).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
    try {
      if (typeof window.print === 'function') {
        window.print();
      }
    } catch (e) {
      console.warn("Direct window.print() block captured. Showing fallback instructions modal instead.", e);
    }
  };

  // WhatsApp States & Template Presets
  const [waPhone, setWaPhone] = useState('');
  
  const waPresets = useMemo(() => [
    {
      id: 'classic',
      name: 'Klasik & Profesional (Formal)',
      text: `Halo Kak *[NamaPelanggan]*! 👋

Terima kasih banyak telah mempercayakan pembelian produk Anda di *AFM STORE*. Berikut kami lampirkan rincian nota transaksi resmi Anda:

=============================
🧾 *NOTA PENJUALAN RESMI*
=============================
*No. Transaksi:* [NoTransaksi]
*Tanggal:* [Tanggal]
*Nama Pelanggan:* [NamaPelanggan]
*Staff Kasir:* [NamaKasir]

=============================
📦 *RINCIAN BELANJA:*
[RincianBelanja]
=============================[TukarTambah]
*TOTAL PEMBAYARAN:* *[TotalPembayaran]*
=============================

Terima kasih atas kunjungan Anda. Semoga gadget barunya awet dan berkah selalu! Hubungi kami kembali jika membutuhkan klaim garansi atau servis berkala. 😊🙏

📍 *AFM STORE*
Pusat iPhone Bekas & Jasa Servis Berkualitas`
    },
    {
      id: 'friendly',
      name: 'Ramah & Santai (Friendly)',
      text: `Hi kak *[NamaPelanggan]*! Thank you so much ya udah belanja di *AFM STORE*! 😍

Ini rincian transaksi belanjaan kamu hari ini:

🧾 *E-RECEIPT AFM STORE*
No: [NoTransaksi]
Tanggal: [Tanggal]

*Belanjaan kamu:*
[RincianBelanja]
[TukarTambah]
*Total Akhir: [TotalPembayaran]*

Garansi aktif ya kak sejak hari ini! Simpan struk digital ini untuk mempermudah claim garansi di kemudian hari. Semoga puas dengan pelayanan kami & kami tunggu kedatangannya lagi! Happpy unboxing! 🥳🚀✨`
    },
    {
      id: 'simple',
      name: 'Minimalis & Ringkas',
      text: `Yth. Bpk/Ibu *[NamaPelanggan]*,

Terima kasih telah bertransaksi di *AFM STORE*. 

Detail Pembelian: [NoTransaksi]
Waktu: [Tanggal]
Kasir: [NamaKasir]

Rincian Transaksi:
[RincianBelanja]
[TukarTambah]
Total Transaksi: [TotalPembayaran]

Semua produk garansi resmi AFM STORE. Simpan pesan ini sebagai bukti nota yang sah.`
    }
  ], []);

  const [waTemplate, setWaTemplate] = useState(() => {
    return localStorage.getItem('wa_thankyou_template') || `Halo Kak *[NamaPelanggan]*! 👋

Terima kasih banyak telah mempercayakan pembelian produk Anda di *AFM STORE*. Berikut kami lampirkan rincian nota transaksi resmi Anda:

=============================
🧾 *NOTA PENJUALAN RESMI*
=============================
*No. Transaksi:* [NoTransaksi]
*Tanggal:* [Tanggal]
*Nama Pelanggan:* [NamaPelanggan]
*Staff Kasir:* [NamaKasir]

=============================
📦 *RINCIAN BELANJA:*
[RincianBelanja]
=============================[TukarTambah]
*TOTAL PEMBAYARAN:* *[TotalPembayaran]*
=============================

Terima kasih atas kunjungan Anda. Semoga gadget barunya awet dan berkah selalu! Hubungi kami kembali jika membutuhkan klaim garansi atau servis berkala. 😊🙏

📍 *AFM STORE*
Pusat iPhone Bekas & Jasa Servis Berkualitas`;
  });

  const handleTemplateChange = (val: string) => {
    setWaTemplate(val);
    localStorage.setItem('wa_thankyou_template', val);
  };

  const compiledMessage = useMemo(() => {
    if (!lastTrx) return '';
    
    const formattedDate = new Date(lastTrx.date).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const cartDetails = lastTrx.items
      .map((it) => `- *${it.model}* (${it.quantity}x @ ${formatIDR(it.sellingPrice)})`)
      .join('\n');

    let tradeInTxt = '';
    if (lastTrx.tradeIn) {
      tradeInTxt = `\n\nPotongan Tukar Tambah (Trade-In):\n- *${lastTrx.tradeIn.model}* (IMEI: ${lastTrx.tradeIn.imei})\n  Harga Tukar: -${formatIDR(lastTrx.tradeIn.buyPrice)}`;
    }

    return waTemplate
      .replace(/\[NamaPelanggan\]/g, lastTrx.customerName)
      .replace(/\[NoTransaksi\]/g, lastTrx.id)
      .replace(/\[Tanggal\]/g, formattedDate)
      .replace(/\[RincianBelanja\]/g, cartDetails)
      .replace(/\[TukarTambah\]/g, tradeInTxt)
      .replace(/\[TotalPembayaran\]/g, formatIDR(lastTrx.totalAmount))
      .replace(/\[NamaKasir\]/g, lastTrx.cashierName || 'Staff AFM');
  }, [waTemplate, lastTrx]);

  const handleSendToWhatsApp = () => {
    if (!lastTrx) return;
    
    let cleanPhone = waPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.length > 0 && !cleanPhone.startsWith('62') && cleanPhone.length > 5) {
      cleanPhone = '62' + cleanPhone;
    }
    
    const encodedMessage = encodeURIComponent(compiledMessage);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  // Validation Error Banner
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter products that are available (status === 'available')
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'available') return false;
      if (p.type === 'aksesoris' && (p.stock !== undefined && p.stock <= 0)) return false;
      
      const matchesSearch = p.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.imei && p.imei.includes(searchTerm)) ||
                            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === 'all' || p.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [products, searchTerm, selectedType]);

  // Add Item to Cart
  const addToCart = (product: Product) => {
    setValidationError(null);
    // Check if item already exists in the cart
    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      if (product.type === 'iphone') {
        // iPhone is a unique single unit, cannot purchase multiples
        setValidationError('Produk HP Second (IMEI unik) hanya memiliki stok 1 unit per item.');
        return;
      }
      // For accessories, we can increment quantity
      const newCart = [...cart];
      const maxStock = product.stock || 100;
      if (newCart[existingIndex].quantity < maxStock) {
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
      } else {
        setValidationError('Stok Aksesoris telah mencapai batas maksimum ketersediaan.');
      }
    } else {
      // Add as new cart item
      const newItem: TransactionItem = {
        productId: product.id,
        model: product.model,
        type: product.type,
        sellingPrice: product.sellingPrice,
        buyPrice: product.buyPrice,
        repairCost: product.repairCost,
        quantity: 1,
      };
      setCart([...cart, newItem]);
    }
  };

  // Update Quantity (For accessories)
  const updateQuantity = (productId: string, delta: number) => {
    setValidationError(null);
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        const prodRef = products.find(p => p.id === productId);
        const maxStock = prodRef?.stock ?? 100;
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= maxStock) {
          return { ...item, quantity: newQty };
        } else if (newQty > maxStock) {
          setValidationError(`Stok ${item.model} terbatas hanya ${maxStock} item.`);
        }
      }
      return item;
    });
    setCart(updated);
  };

  // Override Selling Price (Adjust pricing on the fly)
  const updatePrice = (productId: string, price: number) => {
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, sellingPrice: Math.max(0, price) };
      }
      return item;
    });
    setCart(updated);
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setValidationError(null);
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Calculate totals
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  
  // Total paid by customer factoring in the trade-in credit
  const finalTotal = Math.max(0, cartSubtotal - (hasTradeIn ? tradeInValue : 0));

  // Calculate net profit
  const totalProfit = useMemo(() => {
    let profit = 0;
    cart.forEach((item) => {
      const itemCost = item.buyPrice + item.repairCost;
      profit += (item.sellingPrice - itemCost) * item.quantity;
    });
    return profit;
  }, [cart]);

  // Handle Checkout Submit
  const handleCheckout = () => {
    setValidationError(null);
    if (cart.length === 0) {
      setValidationError('Isi keranjang belanja terlebih dahulu.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setValidationError('Nama dan Nomor HP Pelanggan wajib diisi untuk nota pelacakan garansi.');
      return;
    }

    const tradeInObj: TradeInItem | undefined = hasTradeIn && tradeInModel && tradeInImei && tradeInValue > 0
      ? {
          model: tradeInModel,
          imei: tradeInImei,
          buyPrice: tradeInValue,
          repairCost: tradeInRepairCost
        }
      : undefined;

    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cart,
      tradeIn: tradeInObj,
      totalAmount: finalTotal,
      totalProfit: totalProfit,
      date: new Date().toISOString(),
      cashierName: cashierName,
    };

    onCheckout(newTrx);
    setLastTrx(newTrx);
    setWaPhone(newTrx.customerPhone);
    
    // Clear Form & Cart
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setHasTradeIn(false);
    setTradeInModel('');
    setTradeInImei('');
    setTradeInValue(0);
    setTradeInRepairCost(0);
  };

  if (lastTrx) {
    return (
      <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Transaksi Kasir Berhasil!</h2>
            <p className="text-slate-500 text-xs mt-1 font-mono">ID Nota: {lastTrx.id}</p>
          </div>
        </div>

        {/* 2-Columns grid for printing & WhatsApp sharing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Column 1: Print Preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Printer size={13} className="text-indigo-600" /> Preview Struk Kasir
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">Siap Cetak</span>
            </div>
            
            {/* Dynamic Paper Receipt Layout (Premium Off-white Struk) */}
            <div id="print-receipt-area" className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left text-xs font-mono text-slate-800 space-y-4">
              <div className="text-center border-b border-slate-250 pb-3">
                <p className="font-extrabold text-slate-900 text-sm">AFM STORE RECEIPT</p>
                <p className="text-slate-500 text-[10px]">Pusat iPhone Bekas & Jasa Servis</p>
                <p className="text-[10px] mt-1 text-slate-600">{new Date(lastTrx.date).toLocaleString('id-ID')}</p>
              </div>

              <div className="space-y-1 text-slate-600 text-[11px]">
                <p><strong className="text-slate-800">Staff Kasir:</strong> {lastTrx.cashierName}</p>
                <p><strong className="text-slate-800">Pelanggan:</strong> {lastTrx.customerName} ({lastTrx.customerPhone})</p>
              </div>

              <div className="border-b border-slate-200 pb-3 space-y-2">
                <p className="font-bold text-slate-750">Rincian Belanja:</p>
                {lastTrx.items.map((it) => (
                  <div key={it.productId} className="flex justify-between text-slate-800">
                    <div>
                      <p className="font-bold">{it.model}</p>
                      <p className="text-[10px] text-slate-500">{it.quantity} x {formatIDR(it.sellingPrice)}</p>
                    </div>
                    <span className="font-bold text-slate-900">{formatIDR(it.sellingPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {lastTrx.tradeIn && (
                <div className="border-b border-slate-200 pb-3 text-rose-700">
                  <p className="font-bold">Potongan Tukar Tambah (Trade-In Device):</p>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>- {lastTrx.tradeIn.model} ({lastTrx.tradeIn.imei})</span>
                    <span>-{formatIDR(lastTrx.tradeIn.buyPrice)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
                <span>TOTAL PEMBAYARAN:</span>
                <span className="text-indigo-600">{formatIDR(lastTrx.totalAmount)}</span>
              </div>

              {(activeRole === 'admin' || activeRole === 'owner') && (
                <div className="bg-emerald-50 text-emerald-800 p-2.26 rounded-xl text-center font-sans font-bold text-[11px] border border-emerald-100">
                  Laba Bersih Transaksi: {formatIDR(lastTrx.totalProfit)}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: WhatsApp Settings & Message Compile Customizer */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                📱 Format WhatsApp & Ucapan Terima Kasih
              </span>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-bold border border-indigo-100 font-sans">Fitur Cerdas WA</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              
              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Nama Konsumen</label>
                  <input
                    type="text"
                    disabled
                    value={lastTrx.customerName}
                    className="w-full text-xs font-bold bg-slate-200/50 text-slate-600 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">No. WhatsApp Pelanggan</label>
                  <input
                    type="text"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full text-xs font-mono font-bold bg-white text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Presets Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Pilih Template Ucapan</label>
                <div className="flex flex-wrap gap-1.5">
                  {waPresets.map((pr) => (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => handleTemplateChange(pr.text)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer font-sans ${
                        waTemplate === pr.text 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white border border-slate-250 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pr.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Editor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Sesuaikan Isi Pesan / Template</label>
                  <span className="text-[9px] text-slate-400 font-mono">Simpan Otomatis 💾</span>
                </div>
                <textarea
                  rows={6}
                  value={waTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full text-[11px] font-mono leading-relaxed bg-white text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
                  placeholder="Isi pesan ucapan..."
                />
                <p className="text-[10px] text-slate-400 leading-normal mt-1 font-sans">
                  💡 Gunakan placeholder: <code className="font-bold text-slate-600">[NamaPelanggan]</code>, <code className="font-bold text-slate-600">[NoTransaksi]</code>, <code className="font-bold text-slate-600">[Tanggal]</code>, <code className="font-bold text-slate-600">[RincianBelanja]</code>, <code className="font-bold text-slate-600">[TukarTambah]</code>, <code className="font-bold text-slate-600">[TotalPembayaran]</code>, <code className="font-bold text-slate-600">[NamaKasir]</code>
                </p>
              </div>

              {/* Chat-Bubble Style Live Preview */}
              <div className="border border-slate-200 rounded-xl bg-[#efeae2] p-4 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-[#05a884]"></div>
                <p className="text-[10px] font-bold text-[#05a884] mb-2 uppercase tracking-wider font-sans">Pratinjau Pesan WhatsApp 💬</p>
                <div className="bg-white rounded-2xl rounded-tl-none p-3 max-w-[95%] relative shadow-xs text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-800">
                  <div className="absolute top-0 -left-1.5 w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}></div>
                  {compiledMessage}
                </div>
              </div>

              {/* Share actions */}
              <button
                onClick={handleSendToWhatsApp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm hover:shadow font-sans"
              >
                Kirim via WhatsApp Web / Mobile 🚀
              </button>
            </div>
          </div>
        </div>

        {/* Outer Actions Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 flex-wrap gap-4">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition cursor-pointer font-sans"
          >
            <Printer size={13} /> Cetak Struk POS (Browser)
          </button>
          
          <button
            onClick={() => setLastTrx(null)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-xs shadow-indigo-100 font-sans"
          >
            Selesai & Ke Kasir Baru →
          </button>
        </div>

        {/* Print Support Hub & Fallback Help Modal */}
        {isPrintModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans no-print">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Printer size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs">Asisten Cetak Nota Toko</h3>
                    <p className="text-[9px] text-slate-400">AFM Store POS Helper</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl transition duration-150 text-[10.5px]"
                >
                  Tutup
                </button>
              </div>

              {/* Instruction Body */}
              <div className="space-y-4">
                <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-2xl text-[11px] text-amber-900 leading-relaxed space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-850">
                    ⚠️ Aturan Keamanan Sandbox Browser Aktif
                  </p>
                  <p>
                    Karena aturan keamanan browser, fitur cetak langsung (<code className="font-mono bg-amber-100 px-1 rounded font-bold">window.print</code>) dibatasi di dalam menu pratonton (iFrame) AI Studio. 
                  </p>
                </div>

                {/* Workarounds */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode Alternatif Praktis:</p>
                  
                  {/* Copy Clip */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-[11.5px] flex items-center gap-1.5">
                        <FileText size={13} className="text-indigo-600" /> Salin Teks Struk Fisik
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">Salin teks struk pembelanjaan untuk dicetak di printer POS / Bluetooth manual.</p>
                    </div>
                    <button
                      onClick={handleCopyReceiptText}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold cursor-pointer transition ${
                        copiedText 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-white border border-slate-250 text-indigo-600 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      {copiedText ? <Check size={11} /> : <Copy size={11} />}
                      {copiedText ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>

                  {/* Tab baru */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-[11.5px] flex items-center gap-1.5">
                        <ExternalLink size={13} className="text-emerald-600" /> Buka Aplikasi di Tab Baru
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">Buka web sesungguhnya di luar iFrame, di mana fungsi Cetak berfungsi 100% lancar.</p>
                    </div>
                    <a 
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                    >
                      <ExternalLink size={11} /> Buka Tab
                    </a>
                  </div>
                </div>
              </div>

              {/* Footer triggers */}
              <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2.5 justify-between">
                <span className="text-[10px] text-slate-400 leading-normal">
                  💡 Tips: Di dalam Tab Baru, tekan <kbd className="bg-white border border-slate-300 px-1 rounded font-bold">Ctrl + P</kbd> untuk mencetak langsung.
                </span>
                <button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] rounded-lg cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Coba Cetak Lagi
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* 1. Left Hand Side - Catalog (8 Columns) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Search & Filter Header */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/85 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari iPhone, IMEI, atau aksesoris..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 outline-none transition"
            />
          </div>
          
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['all', 'iphone', 'aksesoris'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-2 rounded-xl text-[10.5px] font-extrabold uppercase tracking-widest transition cursor-pointer ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {type === 'all' ? 'Semua' : type === 'iphone' ? 'iPhone Second' : 'Aksesoris'}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Alert Message Banner */}
        {validationError && (
          <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-2xl flex items-start gap-2 text-xs leading-normal font-medium animate-fadeIn">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Grid Catalog Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {availableProducts.map((p) => {
            const isIphone = p.type === 'iphone';
            return (
              <div 
                key={p.id}
                className="bg-white border border-slate-200/85 rounded-3xl p-4 flex flex-col justify-between hover:border-indigo-500 hover:shadow-md cursor-pointer transition group"
                onClick={() => addToCart(p)}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                      isIphone 
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isIphone ? 'iPhone' : 'Aksesoris'}
                    </span>
                    {isIphone && (
                      <span className="text-[9.5px] font-mono text-slate-400">
                        IMEI: {p.imei?.slice(-5)}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-extrabold text-slate-800 text-xs mt-3 group-hover:text-indigo-600 transition line-clamp-2 min-h-[34px]">
                    {p.model}
                  </h4>
                  {p.sku && (
                    <div className="mt-1.5">
                      <span className="inline-block text-[9px] font-mono text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-0.5">
                        SKU: {p.sku}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-slate-405 uppercase font-bold tracking-wider">Harga Jual</p>
                    <p className="font-extrabold text-slate-900 text-xs mt-0.5">{formatIDR(p.sellingPrice)}</p>
                  </div>
                  
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 group-hover:text-white group-hover:bg-indigo-600 flex items-center justify-center transition border border-slate-200">
                    <Plus size={14} />
                  </div>
                </div>
              </div>
            );
          })}

          {availableProducts.length === 0 && (
            <div className="col-span-full py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center text-slate-500">
              <ShoppingCart className="mx-auto text-slate-400 mb-2" size={32} />
              <p className="font-bold text-slate-700 text-xs">Katalog produk tidak tersedia</p>
              <p className="text-[11px] text-slate-400 mt-1">Gunakan kata kunci pencarian berbeda atau tambahkan stok terlebih dahulu.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Hand Side - Shopping Cart & Checkout (4 Columns) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/85 rounded-3xl p-5 shadow-sm space-y-6">
        
        {/* Cart Title */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <ShoppingCart size={15} />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-xs">Nota Belanja Aktif</p>
              <p className="text-slate-500 text-[10.5px]">{cart.length} item dipilih</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button 
              onClick={() => setCart([])}
              className="text-[10.5px] text-slate-455 hover:text-rose-600 flex items-center gap-1 font-bold transition cursor-pointer"
            >
              <Trash2 size={12} /> Bersihkan
            </button>
          )}
        </div>

        {/* Customer Info Form */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
          <p className="font-extrabold text-slate-700 text-xs flex items-center gap-1.5 flex-wrap justify-between">
            <span className="flex items-center gap-1.5"><UserPlus size={14} className="text-indigo-600" /> Informasi Garansi Pelanggan</span>
            {customers.length > 0 && (
              <span className="text-[9px] text-slate-400 font-normal italic">Ketik untuk cari pelanggan terdaftar</span>
            )}
          </p>
          <div className="grid grid-cols-1 gap-2">
            <div className="relative z-50">
              <input
                type="text"
                placeholder="Nama Lengkap Pelanggan"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 relative z-50"
              />
              {showCustomerDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowCustomerDropdown(false)} />
              )}
              {/* Autocomplete Overlay */}
              {showCustomerDropdown && matchedCustomers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-250 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-1.5 bg-slate-50 text-[9px] text-slate-400 font-bold px-3">Daftar Pelanggan Terdaftar</div>
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
              {showCustomerDropdown && customerName.trim() && matchedCustomers.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-md p-3 z-50 text-[10px] text-slate-450 text-center italic">
                  Belum terdaftar. Pelanggan baru "{customerName}" akan disimpan secara otomatis saat transaksi selesai.
                  <button 
                    type="button"
                    onClick={() => setShowCustomerDropdown(false)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 font-bold text-[9px] px-1"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="No WhatsApp HP Aktif"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Items List in Cart */}
        {cart.length > 0 ? (
          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
            {cart.map((item) => {
              const isIphone = item.type === 'iphone';
              return (
                <div key={item.productId} className="flex gap-3 justify-between items-start py-2 border-b border-slate-100">
                  <div className="space-y-1.5 flex-1">
                    <p className="font-bold text-slate-850 text-xs leading-tight">{item.model}</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-sans">{isIphone ? 'Harga Nego:' : 'Harga Jual:'}</span>
                        <input
                          type="number"
                          value={item.sellingPrice}
                          onChange={(e) => updatePrice(item.productId, Number(e.target.value))}
                          className="w-24 px-1.5 py-0.5 border border-slate-200 rounded bg-slate-50 text-slate-800 text-[10.5px] font-bold font-mono focus:border-indigo-500 outline-none"
                          title="Sesuaikan harga jual khusus disini"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatIDR(item.sellingPrice)} {!isIphone && item.quantity > 1 && `(Total: ${formatIDR(item.sellingPrice * item.quantity)})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch gap-2">
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>

                    {/* Quantity Selector - accessories only */}
                    {!isIphone && (
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 hover:bg-slate-200 rounded transition text-slate-500 cursor-pointer"
                        >
                          <Minus size={9} />
                        </button>
                        <span className="px-2 text-[11px] font-extrabold text-slate-800 font-mono">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 hover:bg-slate-200 rounded transition text-slate-500 cursor-pointer"
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-405 text-xs">
            <p>Pilih produk untuk ditaruh di kasir POS.</p>
          </div>
        )}

        {/* Trade-In Toggle Form */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasTradeIn}
              onChange={(e) => setHasTradeIn(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-250 bg-white"
            />
            <span className="font-extrabold text-slate-700 text-xs flex items-center gap-1.5 selection:bg-transparent">
              <ArrowRightLeft size={13} className="text-indigo-600" /> Aktifkan Trade-In (Tukar Tambah)
            </span>
          </label>

          {hasTradeIn && (
            <div className="grid grid-cols-1 gap-2.5 pt-2.5 border-t border-slate-200 animate-fadeIn text-[11px]">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Model iPhone Konsumen (Masuk)</label>
                <input
                  type="text"
                  placeholder="Contoh: iPhone XS Max 256GB Gray"
                  value={tradeInModel}
                  onChange={(e) => setTradeInModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Digit IMEI HP Masuk</label>
                <input
                  type="text"
                  placeholder="IMEI 15 digit"
                  value={tradeInImei}
                  onChange={(e) => setTradeInImei(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Harga Dibeli (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 3000000"
                    value={tradeInValue || ''}
                    onChange={(e) => setTradeInValue(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Estimasi Servis (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={tradeInRepairCost || ''}
                    onChange={(e) => setTradeInRepairCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Financial Recaps */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500 font-bold">
            <span>Subtotal Belanja:</span>
            <span className="text-slate-800 font-mono">{formatIDR(cartSubtotal)}</span>
          </div>
          
          {hasTradeIn && tradeInValue > 0 && (
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Pemotongan HP Konsumen:</span>
              <span className="font-mono">-{formatIDR(tradeInValue)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2.5 border-t border-dashed border-slate-150">
            <span>TOTAL DIBAYAR:</span>
            <span className="text-sm font-black text-indigo-600 font-mono">{formatIDR(finalTotal)}</span>
          </div>

          {(activeRole === 'admin' || activeRole === 'owner') && cart.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-xl flex items-center justify-between font-sans mt-3 text-[11px] font-bold">
              <span className="flex items-center gap-1"><TrendingUp size={14} /> Keuntungan POS Bersih:</span>
              <span className="font-mono">{formatIDR(totalProfit)}</span>
            </div>
          )}
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition cursor-pointer ${
            cart.length > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Sparkles size={15} /> Checkout POS Kasir
        </button>

      </div>
    </div>
  );
}
