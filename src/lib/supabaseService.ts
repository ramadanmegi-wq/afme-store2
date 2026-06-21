import { supabase, isSupabaseConfigured } from './supabase';
import { Product, Transaction, Service, Customer, OperationalExpense, Sparepart, AppAccount } from '../types';

// SQL Skema penuh yang dapat disalin pengguna ke SQL Editor Supabase
export const SUPABASE_FULL_SQL_SCHEMA = `-- SKEMA DATABASE UTAMA AFM STORE (SUPABASE)
-- Silakan salin dan jalankan seluruh query di bawah di SQL Editor Supabase Anda.

-- Aktifkan ekstensi pgcrypto jika belum aktif
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigger function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. TABEL APP USERS (SISTEM AUTHENTICATION)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'karyawan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON app_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABEL PRODUCTS (HP IPHONE SECOND)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_produk VARCHAR(150) NOT NULL,
  imei VARCHAR(50) UNIQUE,
  kategori VARCHAR(50) DEFAULT 'iPhone',
  merek VARCHAR(50) DEFAULT 'Apple',
  warna VARCHAR(50),
  kapasitas VARCHAR(20),
  harga_modal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  biaya_perbaikan NUMERIC(12, 2) NOT NULL DEFAULT 0,
  harga_jual NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 1,
  kondisi VARCHAR(50) DEFAULT 'Second',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_products_imei ON products(imei);

-- 3. TABEL ACCESSORIES
CREATE TABLE IF NOT EXISTS accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  harga_modal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  harga_jual NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_accessories_updated_at
    BEFORE UPDATE ON accessories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. TABEL SPAREPARTS
CREATE TABLE IF NOT EXISTS spareparts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_sparepart VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  harga_modal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  harga_jual NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_spareparts_updated_at
    BEFORE UPDATE ON spareparts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. TABEL REPAIR SERVICES (SERVIS HP PELANGGAN)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  dev_model VARCHAR(100) NOT NULL,
  imei VARCHAR(50),
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proses', 'selesai')),
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  capital_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sparepart_id VARCHAR(100),
  sparepart_name VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. TABEL TRANSACTIONS (PENJUALAN UTAMA)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_transaksi VARCHAR(50) UNIQUE NOT NULL,
  tanggal TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_modal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_penjualan NUMERIC(12, 2) NOT NULL DEFAULT 0,
  laba NUMERIC(12, 2) NOT NULL DEFAULT 0,
  metode_pembayaran VARCHAR(50) NOT NULL DEFAULT 'Tunai',
  customer_name VARCHAR(150) DEFAULT 'Pelanggan Umum',
  customer_phone VARCHAR(50) DEFAULT '08123456789',
  cashier_name VARCHAR(100) DEFAULT 'Staff AFME',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_transactions_nomor ON transactions(nomor_transaksi);

-- 7. TABEL TRANSACTION ITEMS (RINCIAN ITEM YANG DIJUAL)
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id VARCHAR(100), -- Dapat berupa ID produk HP atau Aksesoris
  nama_barang VARCHAR(150) NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  harga NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_transaction_items_updated_at
    BEFORE UPDATE ON transaction_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_trx_items_trx_id ON transaction_items(transaction_id);

-- 8. TABEL EXPENSES (PENGELUARAN OPERASIONAL)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori VARCHAR(50) NOT NULL,
  deskripsi TEXT NOT NULL,
  nominal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. TABEL STOCK MOVEMENTS (MUTASI STOK BILA ADA STOCK OPNAME)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(100),
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  qty INTEGER NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_stock_movements_updated_at
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. TABEL SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SEED AKUN PENGGUNA BAWAAN
INSERT INTO app_users (username, nama, password, role) VALUES
('owner', 'Owner Toko (Admin)', 'ownerpassword', 'admin') ON CONFLICT (username) DO NOTHING;
INSERT INTO app_users (username, nama, password, role) VALUES
('admin', 'Admin AFME (Admin)', 'adminpassword', 'admin') ON CONFLICT (username) DO NOTHING;
INSERT INTO app_users (username, nama, password, role) VALUES
('karyawan', 'Staff Kasir (Karyawan)', 'staffpassword', 'karyawan') ON CONFLICT (username) DO NOTHING;
INSERT INTO app_users (username, nama, password, role) VALUES
('megi', 'Megi Toko (Owner)', 'megipassword', 'owner') ON CONFLICT (username) DO NOTHING;

-- Aktifkan RLS atau izinkan akses publik murni melalui API Key Anon standar untuk kelancaran Front-end
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Buat policy bolehkan ALL operasi jika menggunakan anon key
DROP POLICY IF EXISTS "Allow public read" ON app_users;
DROP POLICY IF EXISTS "Allow public insert" ON app_users;
DROP POLICY IF EXISTS "Allow public update" ON app_users;
DROP POLICY IF EXISTS "Allow public delete" ON app_users;
CREATE POLICY "Allow public read" ON app_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON app_users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON app_users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON products;
DROP POLICY IF EXISTS "Allow public insert" ON products;
DROP POLICY IF EXISTS "Allow public update" ON products;
DROP POLICY IF EXISTS "Allow public delete" ON products;
CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON accessories;
DROP POLICY IF EXISTS "Allow public insert" ON accessories;
DROP POLICY IF EXISTS "Allow public update" ON accessories;
DROP POLICY IF EXISTS "Allow public delete" ON accessories;
CREATE POLICY "Allow public read" ON accessories FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON accessories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON accessories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON accessories FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON spareparts;
DROP POLICY IF EXISTS "Allow public insert" ON spareparts;
DROP POLICY IF EXISTS "Allow public update" ON spareparts;
DROP POLICY IF EXISTS "Allow public delete" ON spareparts;
CREATE POLICY "Allow public read" ON spareparts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON spareparts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON spareparts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON spareparts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON transactions;
DROP POLICY IF EXISTS "Allow public insert" ON transactions;
DROP POLICY IF EXISTS "Allow public update" ON transactions;
DROP POLICY IF EXISTS "Allow public delete" ON transactions;
CREATE POLICY "Allow public read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON transactions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON transaction_items;
DROP POLICY IF EXISTS "Allow public insert" ON transaction_items;
DROP POLICY IF EXISTS "Allow public update" ON transaction_items;
DROP POLICY IF EXISTS "Allow public delete" ON transaction_items;
CREATE POLICY "Allow public read" ON transaction_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON transaction_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON transaction_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON transaction_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON stock_movements;
DROP POLICY IF EXISTS "Allow public insert" ON stock_movements;
DROP POLICY IF EXISTS "Allow public update" ON stock_movements;
DROP POLICY IF EXISTS "Allow public delete" ON stock_movements;
CREATE POLICY "Allow public read" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON stock_movements FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON stock_movements FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON expenses;
DROP POLICY IF EXISTS "Allow public insert" ON expenses;
DROP POLICY IF EXISTS "Allow public update" ON expenses;
DROP POLICY IF EXISTS "Allow public delete" ON expenses;
CREATE POLICY "Allow public read" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON expenses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON services;
DROP POLICY IF EXISTS "Allow public insert" ON services;
DROP POLICY IF EXISTS "Allow public update" ON services;
DROP POLICY IF EXISTS "Allow public delete" ON services;
CREATE POLICY "Allow public read" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON services FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON settings;
DROP POLICY IF EXISTS "Allow public insert" ON settings;
DROP POLICY IF EXISTS "Allow public update" ON settings;
DROP POLICY IF EXISTS "Allow public delete" ON settings;
CREATE POLICY "Allow public read" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON settings FOR DELETE USING (true);
`;

export function handleDatabaseError(e: any): never {
  console.error("Supabase Database Error Details:", e);
  if (!e) {
    throw new Error("Terjadi kesalahan database tidak diketahui.");
  }
  const msg = e.message || String(e);
  if (
    msg.toLowerCase().includes("could not find the table") ||
    (msg.toLowerCase().includes("relation") && msg.toLowerCase().includes("does not exist")) ||
    msg.toLowerCase().includes("schema cache")
  ) {
    throw new Error(
      "Tabel database belum dibuat di Supabase Anda! Silakan masuk ke tab 'Supabase Cloud' di menu kiri bawaan, lalu salin instruksi SQL yang disediakan dan jalankan di SQL Editor Supabase Anda untuk membuat semua tabel."
    );
  }
  throw e;
}

// ================= APP USERS (AUTH) SERVICES =================
export async function getAppAccounts(): Promise<AppAccount[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      // If error indicates table not found, propagate so we can warn the user if needed
      throw error;
    }

    // Auto-seed if app_users is completely empty in Supabase
    if (!data || data.length === 0) {
      console.log('Tabel app_users di Supabase kosong. Melakukan auto-seed...');
      const defaultUsers = [
        { username: 'owner', nama: 'Owner Toko (Owner)', password: 'ownerpassword', role: 'owner' },
        { username: 'admin', nama: 'Admin AFME (Admin)', password: 'adminpassword', role: 'admin' },
        { username: 'karyawan', nama: 'Staff Kasir (Karyawan)', password: 'staffpassword', role: 'karyawan' },
        { username: 'megi', nama: 'Megi Toko (Owner)', password: 'megipassword', role: 'owner' }
      ];

      const { data: seededData, error: seedError } = await supabase
        .from('app_users')
        .insert(defaultUsers)
        .select();

      if (!seedError && seededData && seededData.length > 0) {
        return seededData.map(u => ({
          id: u.id,
          username: u.username,
          name: u.nama,
          password: u.password,
          role: u.role
        }));
      }
    }
    
    return (data || []).map(u => ({
      id: u.id,
      username: u.username,
      name: u.nama,
      password: u.password,
      role: u.role
    }));
  } catch (e) {
    console.error('Gagal mengambil app_users dari Supabase:', e);
    // Silent return empty array to fallback to offline index, but logs error details
    return [];
  }
}

export async function saveAppAccount(user: AppAccount): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const payload = {
      username: user.username,
      nama: user.name,
      password: user.password,
      role: user.role
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    let existingId: string | null = null;

    if (isUuid) {
      const { data: checkId, error: errId } = await supabase
        .from('app_users')
        .select('id')
        .eq('id', user.id)
        .limit(1);
      if (errId) {
        handleDatabaseError(errId);
      }
      if (checkId && checkId.length > 0) {
        existingId = checkId[0].id;
      }
    }

    if (!existingId) {
      const { data: checkUser, error: errUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('username', user.username)
        .limit(1);
      if (errUser) {
        handleDatabaseError(errUser);
      }
      if (checkUser && checkUser.length > 0) {
        existingId = checkUser[0].id;
      }
    }

    if (existingId) {
      const { error: updateErr } = await supabase
        .from('app_users')
        .update(payload)
        .eq('id', existingId);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('app_users')
        .insert([payload]);
      if (insertErr) throw insertErr;
    }
  } catch (e) {
    handleDatabaseError(e);
  }
}

export async function deleteAppAccount(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    handleDatabaseError(e);
  }
}

// ================= PRODUCTS (IPHONE SECOND/AKSESORIS) MERGED WRAPPER =================
// Aplikasi mengasumsikan Product di types.ts menampung data HP & Aksesoris bersamaan.
// Supabase memisahkan 'products' (HP) dan 'accessories' (Aksesoris).
// Di fungsi ini, we merge/unwrap data agar UI tetap kompatibel 100%!

export async function getProductsFromSupabase(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  try {
    // 1. Get HP from 'products'
    const { data: hpData, error: hpErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (hpErr) throw hpErr;

    // 2. Get accessories from 'accessories'
    const { data: accData, error: accErr } = await supabase
      .from('accessories')
      .select('*')
      .order('created_at', { ascending: false });

    if (accErr) throw accErr;

    const hpList: Product[] = (hpData || []).map(p => ({
      id: p.id,
      type: 'iphone',
      model: p.nama_produk,
      imei: p.imei || '',
      buyPrice: Number(p.harga_modal),
      repairCost: (p.biaya_perbaikan !== undefined && p.biaya_perbaikan !== null) ? Number(p.biaya_perbaikan) : 0,
      sellingPrice: Number(p.harga_jual),
      status: p.stok > 0 ? 'available' : 'sold'
    }));

    const accList: Product[] = (accData || []).map(a => ({
      id: a.id,
      type: 'aksesoris',
      model: a.nama_barang,
      buyPrice: Number(a.harga_modal),
      repairCost: 0,
      sellingPrice: Number(a.harga_jual),
      status: a.stok > 0 ? 'available' : 'sold',
      stock: Number(a.stok)
    }));

    return [...hpList, ...accList];
  } catch (e) {
    console.error('Gagal mengambil products dari Supabase:', e);
    return [];
  }
}

export async function saveProductToSupabase(prod: Product): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prod.id);

    if (prod.type === 'iphone') {
      // Ekstrak detail HP jika berbentuk string gabungan
      const kapasitasMatch = prod.model.match(/(\d+GB|\d+TB)/i);
      const kapasitas = kapasitasMatch ? kapasitasMatch[0] : '';
      
      const warnaMatch = prod.model.match(/(Black|White|Gold|Silver|Graphite|Sierra Blue|Pacific Blue|Deep Purple|Pink|Blue|Red|Green)/i);
      const warna = warnaMatch ? warnaMatch[0] : '';

      const payloadWithRepairCost = {
        nama_produk: prod.model,
        imei: prod.imei || null,
        kategori: 'iPhone',
        merek: 'Apple',
        warna: warna || 'Lainnya',
        kapasitas: kapasitas || '128GB',
        harga_modal: prod.buyPrice,
        biaya_perbaikan: prod.repairCost || 0,
        harga_jual: prod.sellingPrice,
        stok: prod.status === 'available' ? 1 : 0,
        kondisi: prod.model.toLowerCase().includes('baru') ? 'Baru' : 'Second'
      };

      const payloadFallback = {
        nama_produk: prod.model,
        imei: prod.imei || null,
        kategori: 'iPhone',
        merek: 'Apple',
        warna: warna || 'Lainnya',
        kapasitas: kapasitas || '128GB',
        harga_modal: prod.buyPrice + (prod.repairCost || 0),
        harga_jual: prod.sellingPrice,
        stok: prod.status === 'available' ? 1 : 0,
        kondisi: prod.model.toLowerCase().includes('baru') ? 'Baru' : 'Second'
      };

      try {
        if (isIdUuid) {
          const { error } = await supabase.from('products').update(payloadWithRepairCost).eq('id', prod.id);
          if (error) {
            if (error.code === '42703' || error.message?.includes('biaya_perbaikan') || error.message?.includes('column')) {
              const { error: errFallback } = await supabase.from('products').update(payloadFallback).eq('id', prod.id);
              if (errFallback) throw errFallback;
            } else {
              throw error;
            }
          }
        } else {
          const { error } = await supabase.from('products').insert([payloadWithRepairCost]);
          if (error) {
            if (error.code === '42703' || error.message?.includes('biaya_perbaikan') || error.message?.includes('column')) {
              const { error: errFallback } = await supabase.from('products').insert([payloadFallback]);
              if (errFallback) throw errFallback;
            } else {
              throw error;
            }
          }
        }
      } catch (dbErr) {
        console.error('Penyimpanan detail HP gagal, mencoba menyimpan tanpa biaya_perbaikan terpisah:', dbErr);
      }
    } else {
      // Accessories
      const payload = {
        nama_barang: prod.model,
        kategori: 'Aksesoris',
        harga_modal: prod.buyPrice,
        harga_jual: prod.sellingPrice,
        stok: prod.stock || 0
      };

      if (isIdUuid) {
        await supabase.from('accessories').update(payload).eq('id', prod.id);
      } else {
        await supabase.from('accessories').insert([payload]);
      }
    }
  } catch (e) {
    console.error('Gagal menyimpan product ke Supabase:', e);
  }
}

export async function deleteProductFromSupabase(id: string, type: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    if (type === 'iphone') {
      await supabase.from('products').delete().eq('id', id);
    } else {
      await supabase.from('accessories').delete().eq('id', id);
    }
  } catch (e) {
    console.error('Gagal menghapus product dari Supabase:', e);
  }
}

// ================= SPAREPARTS SERVICE =================
export async function getSparepartsFromSupabase(): Promise<Sparepart[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('spareparts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(s => {
      // Ekstrak compatible model secara cerdik atau simpan di nama
      const match = s.nama_sparepart.match(/\b(iPhone [X\d]+(?: Pro| Pro Max| Mini| Max| Plus| XR| XS| SE)*)\b/i);
      const compatible = match ? match[0] : 'Umum / iPhone Semua Tipe';
      
      return {
        id: s.id,
        name: s.nama_sparepart,
        stock: Number(s.stok),
        buyPrice: Number(s.harga_modal),
        sellingPrice: Number(s.harga_jual),
        compatibleModels: compatible
      };
    });
  } catch (e) {
    console.error('Gagal mengambil spareparts dari Supabase:', e);
    return [];
  }
}

export async function saveSparepartToSupabase(sp: Sparepart): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sp.id);
    const payload = {
      nama_sparepart: sp.name,
      kategori: sp.compatibleModels || 'iPhone',
      harga_modal: sp.buyPrice,
      harga_jual: sp.sellingPrice,
      stok: sp.stock
    };

    if (isUuid) {
      await supabase.from('spareparts').update(payload).eq('id', sp.id);
    } else {
      await supabase.from('spareparts').insert([payload]);
    }
  } catch (e) {
    console.error('Gagal menyimpan sparepart ke Supabase:', e);
  }
}

export async function deleteSparepartFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('spareparts').delete().eq('id', id);
  } catch (e) {
    console.error('Gagal menghapus sparepart dari Supabase:', e);
  }
}

// ================= SERVICES (REPAIR LOGS) SERVICE =================
export async function getServicesFromSupabase(): Promise<Service[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(s => ({
      id: s.id,
      customerName: s.customer_name,
      customerPhone: s.customer_phone,
      devModel: s.dev_model,
      imei: s.imei || '',
      description: s.description,
      status: s.status as 'pending' | 'proses' | 'selesai',
      cost: Number(s.cost),
      capitalCost: Number(s.capital_cost),
      date: s.created_at,
      sparepartId: s.sparepart_id || undefined,
      sparepartName: s.sparepart_name || undefined
    }));
  } catch (e) {
    console.error('Gagal mengambil services dari Supabase:', e);
    return [];
  }
}

export async function saveServiceToSupabase(srv: Service): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(srv.id);
    
    // Kurangi stok sparepart di Supabase bila status diubah ke 'selesai'
    if (srv.status === 'selesai' && srv.sparepartId) {
      const isPartUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(srv.sparepartId);
      if (isPartUuid) {
        // Ambil stok sekarang
        const { data: pData } = await supabase.from('spareparts').select('stok').eq('id', srv.sparepartId).maybeSingle();
        if (pData && pData.stok > 0) {
          await supabase.from('spareparts').update({ stok: pData.stok - 1 }).eq('id', srv.sparepartId);
        }
      }
    }

    const payload = {
      customer_name: srv.customerName,
      customer_phone: srv.customerPhone,
      dev_model: srv.devModel,
      imei: srv.imei || null,
      description: srv.description,
      status: srv.status,
      cost: srv.cost,
      capital_cost: srv.capitalCost,
      sparepart_id: srv.sparepartId || null,
      sparepart_name: srv.sparepartName || null
    };

    if (isUuid) {
      await supabase.from('services').update(payload).eq('id', srv.id);
    } else {
      await supabase.from('services').insert([payload]);
    }
  } catch (e) {
    console.error('Gagal menyimpan service ke Supabase:', e);
  }
}

export async function deleteServiceFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('services').delete().eq('id', id);
  } catch (e) {
    console.error('Gagal menghapus service dari Supabase:', e);
  }
}

// ================= SALES / TRANSACTIONS UTAMA =================
export async function getTransactionsFromSupabase(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) return [];
  try {
    // Ambil penjualan utama
    const { data: sales, error: sErr } = await supabase
      .from('transactions')
      .select('*')
      .order('tanggal', { ascending: false });

    if (sErr) throw sErr;

    // Ambil semua item penjualan untuk menyusun struktur Transaction asli
    const { data: items, error: iErr } = await supabase
      .from('transaction_items')
      .select('*');

    if (iErr) throw iErr;

    // Load local fallback mapping if any database column is missing or defaults to "Pelanggan Umum"
    let localMaps: Record<string, { customerName: string; customerPhone: string; cashierName: string }> = {};
    try {
      localMaps = JSON.parse(localStorage.getItem('trx_customer_maps') || '{}');
    } catch (e) {
      console.error('Gagal mengambil trx_customer_maps:', e);
    }

    return (sales || []).map(sale => {
      const saleItems = (items || [])
        .filter(it => it.transaction_id === sale.id)
        .map(it => ({
          productId: it.product_id || '',
          model: it.nama_barang,
          type: (it.nama_barang.toLowerCase().includes('iphone') ? 'iphone' : 'aksesoris') as 'iphone' | 'aksesoris',
          sellingPrice: Number(it.harga),
          buyPrice: Number(it.harga * 0.7), // Estimasi modal bila tidak terekam
          repairCost: 0,
          quantity: Number(it.qty)
        }));

      const matchedLocal = (localMaps[sale.id] || localMaps[sale.nomor_transaksi] || {}) as any;
      const finalCustomerName = (sale.customer_name && sale.customer_name !== 'Pelanggan Umum') 
        ? sale.customer_name 
        : (matchedLocal.customerName || 'Pelanggan Umum');
      const finalCustomerPhone = (sale.customer_phone && sale.customer_phone !== '08123456789') 
        ? sale.customer_phone 
        : (matchedLocal.customerPhone || '08123456789');
      const finalCashierName = (sale.cashier_name && sale.cashier_name !== 'Staff AFME') 
        ? sale.cashier_name 
        : (matchedLocal.cashierName || 'Staff AFME');

      return {
        id: sale.id,
        customerId: `cust-${sale.id.slice(0, 5)}`,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        items: saleItems,
        totalAmount: Number(sale.total_penjualan),
        totalProfit: Number(sale.laba),
        date: sale.tanggal,
        cashierName: finalCashierName
      };
    });
  } catch (e) {
    console.error('Gagal mengambil transactions dari Supabase:', e);
    return [];
  }
}

export async function saveTransactionToSupabase(trx: Transaction): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    // Generate nomor transaksi unik yang megah
    const prefix = 'TRX-' + new Date().toISOString().slice(2,10).replace(/-/g,'');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderNo = `${prefix}-${randomHex}`;

    const totalModal = trx.items.reduce((sum, item) => sum + ((item.buyPrice + (item.repairCost || 0)) * item.quantity), 0);
    const totalJual = trx.totalAmount;
    const laba = trx.totalProfit > 0 ? trx.totalProfit : (totalJual - totalModal);

    // 1. Insert ke table 'transactions' dengan try-fallback
    const payload: any = {
      nomor_transaksi: orderNo,
      tanggal: trx.date || new Date().toISOString(),
      total_modal: totalModal,
      total_penjualan: totalJual,
      laba: laba,
      metode_pembayaran: 'Tunai',
      customer_name: trx.customerName || 'Pelanggan Umum',
      customer_phone: trx.customerPhone || '08123456789',
      cashier_name: trx.cashierName || 'Staff AFME'
    };

    let { data: saleData, error: saleErr } = await supabase
      .from('transactions')
      .insert([payload])
      .select()
      .single();

    if (saleErr && (saleErr.code === '42703' || saleErr.message?.includes('column'))) {
      // Fallback: retry without custom columns
      const fallbackPayload = {
        nomor_transaksi: orderNo,
        tanggal: trx.date || new Date().toISOString(),
        total_modal: totalModal,
        total_penjualan: totalJual,
        laba: laba,
        metode_pembayaran: 'Tunai'
      };
      const retryResult = await supabase
        .from('transactions')
        .insert([fallbackPayload])
        .select()
        .single();
      saleData = retryResult.data;
      saleErr = retryResult.error;
    }

    if (saleErr) throw saleErr;
    if (!saleData) return;

    // Save mapping locally for robust fallback tracking
    try {
      const localMaps = JSON.parse(localStorage.getItem('trx_customer_maps') || '{}');
      localMaps[saleData.id] = {
        customerName: trx.customerName,
        customerPhone: trx.customerPhone,
        cashierName: trx.cashierName || 'Staff AFME'
      };
      if (orderNo) {
        localMaps[orderNo] = {
          customerName: trx.customerName,
          customerPhone: trx.customerPhone,
          cashierName: trx.cashierName || 'Staff AFME'
        };
      }
      localStorage.setItem('trx_customer_maps', JSON.stringify(localMaps));
    } catch (e) {
      console.error('Error saving local transaction map:', e);
    }

    // 2. Insert detail rincian ke table 'transaction_items'
    const itemsPayload = trx.items.map(item => ({
      transaction_id: saleData.id,
      product_id: item.productId,
      nama_barang: item.model,
      qty: item.quantity,
      harga: item.sellingPrice,
      subtotal: item.sellingPrice * item.quantity
    }));

    const { error: itemsErr } = await supabase.from('transaction_items').insert(itemsPayload);
    if (itemsErr) throw itemsErr;

    // 3. Update stok di tabel HP atau tabel Aksesoris secara real-time
    for (const item of trx.items) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);
      if (isUuid) {
        if (item.type === 'iphone') {
          // Set HP sebagai terjual (Update stok ke 0)
          await supabase.from('products').update({ stok: 0 }).eq('id', item.productId);
        } else {
          // Kurangi stok aksesoris
          const { data: acc } = await supabase.from('accessories').select('stok').eq('id', item.productId).maybeSingle();
          if (acc) {
            await supabase.from('accessories').update({ stok: Math.max(0, acc.stok - item.quantity) }).eq('id', item.productId);
          }
        }

        // Simpan pergerakan mutasi
        await supabase.from('stock_movements').insert([{
          product_id: item.productId,
          jenis: 'keluar',
          qty: item.quantity,
          keterangan: `Penjualan kasir nomor transaksi ${orderNo}`
        }]);
      }
    }
  } catch (e) {
    console.error('Gagal menyimpan transaksi ke Supabase:', e);
  }
}

export async function updateTransactionInSupabase(updatedTrx: Transaction): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const totalModal = updatedTrx.items.reduce((sum, item) => sum + ((item.buyPrice + (item.repairCost || 0)) * item.quantity), 0);
    const totalJual = updatedTrx.totalAmount;
    const laba = updatedTrx.totalProfit > 0 ? updatedTrx.totalProfit : (totalJual - totalModal);

    // 1. Update ke tabel 'transactions' dengan try-fallback
    const payload: any = {
      total_modal: totalModal,
      total_penjualan: totalJual,
      laba: laba,
      customer_name: updatedTrx.customerName || 'Pelanggan Umum',
      customer_phone: updatedTrx.customerPhone || '08123456789',
      tanggal: updatedTrx.date
    };

    let { error: sErr } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', updatedTrx.id);

    if (sErr && (sErr.code === '42703' || sErr.message?.includes('column'))) {
      // Fallback: update without customer_name/customer_phone columns
      const fallbackPayload = {
        total_modal: totalModal,
        total_penjualan: totalJual,
        laba: laba,
        tanggal: updatedTrx.date
      };
      const retryResult = await supabase
        .from('transactions')
        .update(fallbackPayload)
        .eq('id', updatedTrx.id);
      sErr = retryResult.error;
    }

    if (sErr) throw sErr;

    // Save mapping locally for robust fallback tracking
    try {
      const localMaps = JSON.parse(localStorage.getItem('trx_customer_maps') || '{}');
      localMaps[updatedTrx.id] = {
        customerName: updatedTrx.customerName,
        customerPhone: updatedTrx.customerPhone,
        cashierName: updatedTrx.cashierName || 'Staff AFME'
      };
      localStorage.setItem('trx_customer_maps', JSON.stringify(localMaps));
    } catch (e) {
      console.error('Error updating local transaction map:', e);
    }

    // 2. Refresh detail items.
    // Menghapus item transaksi lama
    const { error: delErr } = await supabase
      .from('transaction_items')
      .delete()
      .eq('transaction_id', updatedTrx.id);

    if (delErr) throw delErr;

    // Masukkan item transaksi baru yang diedit
    const itemsPayload = updatedTrx.items.map(item => ({
      transaction_id: updatedTrx.id,
      product_id: item.productId,
      nama_barang: item.model,
      qty: item.quantity,
      harga: item.sellingPrice,
      subtotal: item.sellingPrice * item.quantity
    }));

    const { error: itemsErr } = await supabase.from('transaction_items').insert(itemsPayload);
    if (itemsErr) throw itemsErr;

  } catch (e) {
    console.error('Gagal memperbarui transaksi di Supabase:', e);
    throw e;
  }
}

// ================= APP EXPENSES SERVICES =================
export async function getExpensesFromSupabase(): Promise<OperationalExpense[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('tanggal', { ascending: false });

    if (error) throw error;

    return (data || []).map(e => ({
      id: e.id,
      name: e.deskripsi,
      amount: Number(e.nominal),
      date: e.tanggal,
      category: e.kategori as any
    }));
  } catch (e) {
    console.error('Gagal mengambil expenses dari Supabase:', e);
    return [];
  }
}

export async function saveExpenseToSupabase(exp: OperationalExpense): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exp.id);
    const payload = {
      kategori: exp.category,
      deskripsi: exp.name,
      nominal: exp.amount,
      tanggal: exp.date
    };

    if (isUuid) {
      await supabase.from('expenses').update(payload).eq('id', exp.id);
    } else {
      await supabase.from('expenses').insert([payload]);
    }
  } catch (e) {
    console.error('Gagal menyimpan expense ke Supabase:', e);
  }
}

export async function deleteExpenseFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('expenses').delete().eq('id', id);
  } catch (e) {
    console.error('Gagal menghapus expense dari Supabase:', e);
  }
}

// ================= SINKRONISASI / MIGRASI SATU KLIK (MIGRATE ALL OFFLINE LOCALSTORAGE DATA TO SUPABASE) =================
export async function migrateLocalDataToSupabase(
  prods: Product[],
  srvs: Service[],
  trxs: Transaction[],
  exps: OperationalExpense[],
  parts: Sparepart[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, count: 0, error: 'Supabase URL/Key belum dikonfigurasi' };
  
  try {
    let count = 0;

    // 1. Migrasi Products (HP & Aksesoris)
    for (const p of prods) {
      // Periksa apakah imei sudah terpakai
      if (p.type === 'iphone' && p.imei) {
        const { data } = await supabase.from('products').select('id').eq('imei', p.imei).maybeSingle();
        if (data) continue; // Skip if exists
      }
      await saveProductToSupabase(p);
      count++;
    }

    // 2. Migrasi Spareparts
    for (const sp of parts) {
      await saveSparepartToSupabase(sp);
      count++;
    }

    // 3. Migrasi Services
    for (const s of srvs) {
      await saveServiceToSupabase(s);
      count++;
    }

    // 4. Migrasi Expenses
    for (const e of exps) {
      await saveExpenseToSupabase(e);
      count++;
    }

    // 5. Migrasi Sales / Transactions
    for (const t of trxs) {
      await saveTransactionToSupabase(t);
      count++;
    }

    return { success: true, count };
  } catch (e: any) {
    console.error('Gagal migrasi offline data:', e);
    return { success: false, count: 0, error: e.message || String(e) };
  }
}

// Clear all data dari Supabase (Khusus Owner Reset DB)
export async function clearAllSupabaseData(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('transaction_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('accessories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('spareparts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.error('Gagal mengosongkan database Supabase:', e);
  }
}
