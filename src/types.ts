export type UserRole = 'owner' | 'admin' | 'karyawan';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface AppAccount {
  id: string;
  username: string;
  name: string;
  password: string;
  role: UserRole;
}

export type ProductType = 'iphone' | 'aksesoris';

export interface Product {
  id: string;
  type: ProductType;
  model: string;
  sku?: string; // Nomor SKU untuk stok opname aksesoris
  imei?: string; // Khusus iPhone
  buyPrice: number; // Harga modal/beli
  repairCost: number; // Biaya perbaikan modal (Khusus iPhone)
  sellingPrice: number; // Harga jual
  status: 'available' | 'sold';
  stock?: number; // Khusus aksesoris (jumlah stok)
}

export interface TradeInItem {
  model: string;
  imei: string;
  buyPrice: number; // Nilai tukar tambah dihargai berapa
  repairCost: number; // Estimasi biaya perbaikan HP trade-in tersebut
}

export interface TransactionItem {
  productId: string;
  model: string;
  type: ProductType;
  sellingPrice: number;
  buyPrice: number;
  repairCost: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  items: TransactionItem[];
  tradeIn?: TradeInItem; // Jika ada tukar tambah
  totalAmount: number; // Total yang dibayar (dari items) - (dari trade-in jika ada)
  totalProfit: number; // Total keuntungan transaksi
  date: string;
  cashierName: string;
}

export interface Service {
  id: string;
  customerName: string;
  customerPhone: string;
  devModel: string; // Model HP yang di-service
  imei?: string;
  description: string; // Kerusakan/Keluhan
  status: 'pending' | 'proses' | 'selesai';
  cost: number; // Biaya penagihan ke customer
  capitalCost: number; // Biaya modal sparepart (untuk hitung profit)
  date: string;
  sparepartId?: string; // Id sparepart dari inventori (jika ada)
  sparepartName?: string; // Menyimpan nama sparepart saat dipilih
}

export interface Sparepart {
  id: string;
  name: string;
  stock: number;
  buyPrice: number; // Harga modal
  sellingPrice: number; // Estimasi harga jual ke customer
  compatibleModels: string; // Kompatibilitas HP
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface OperationalExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: 'operasional' | 'gaji' | 'sewa' | 'lainnya';
}
