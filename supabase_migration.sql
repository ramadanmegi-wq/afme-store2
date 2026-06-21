-- =========================================================================
-- AFM STORE DATABASE MIGRATION SCRIPT (SUPABASE VERSION)
-- Silakan salin dan jalankan seluruh query di bawah di SQL Editor Supabase Anda.
-- =========================================================================

-- Aktifkan ekstensi pgcrypto untuk mendukung auto-generating UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fungsi Trigger otomatis untuk memperbarui nilai updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. TABEL APP USERS (AUTH)
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

-- 2. TABEL PRODUCTS (HP IPHONE)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_produk VARCHAR(150) NOT NULL,
  imei VARCHAR(50) UNIQUE,
  kategori VARCHAR(50) DEFAULT 'iPhone',
  merek VARCHAR(50) DEFAULT 'Apple',
  warna VARCHAR(50),
  kapasitas VARCHAR(20),
  harga_modal NUMERIC(12, 2) NOT NULL DEFAULT 0,
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

-- 5. TABEL SERVICES (REPAIR LOGS)
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

-- 7. TABEL TRANSACTION ITEMS (RINCIAN DETAIL TRANSAKSI)
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id VARCHAR(100),
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

-- SEED SETTINGS DEMO
INSERT INTO settings (key, value) VALUES
('nama_toko', 'AFM Store') ON CONFLICT (key) DO NOTHING;

-- AKTIFKAN ROW LEVEL SECURITY (RLS) UNTUK KEAMANAN
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

-- BUAT POLICY UNTUK MEMBOLEHKAN AKSES PENUH SECARA PUBLIK VIA API KEY ANOTHER
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
