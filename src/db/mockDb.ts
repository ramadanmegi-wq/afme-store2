import { Product, Transaction, Service, Customer, OperationalExpense, Sparepart, AppAccount, UserRole } from '../types';

// Akun Pengguna Awal
const INITIAL_ACCOUNTS: AppAccount[] = [
  {
    id: 'acc-1',
    username: 'owner',
    name: 'Owner Toko (Admin)',
    password: 'ownerpassword',
    role: 'admin'
  },
  {
    id: 'acc-4',
    username: 'admin',
    name: 'Admin AFME (Admin)',
    password: 'adminpassword',
    role: 'admin'
  },
  {
    id: 'acc-2',
    username: 'karyawan',
    name: 'Staff Kasir (Karyawan)',
    password: 'staffpassword',
    role: 'karyawan'
  },
  {
    id: 'acc-3',
    username: 'megi',
    name: 'Megi Toko (Owner)',
    password: 'megipassword',
    role: 'owner'
  }
];

// Dummy Data Awal
const INITIAL_SPAREPARTS: Sparepart[] = [
  {
    id: 'sp-1',
    name: 'LCD iPhone X (OLED Premium)',
    stock: 8,
    buyPrice: 350000,
    sellingPrice: 700000,
    compatibleModels: 'iPhone X'
  },
  {
    id: 'sp-2',
    name: 'Baterai Original iPhone 11 Pro Max / 11 Pro',
    stock: 12,
    buyPrice: 180000,
    sellingPrice: 400000,
    compatibleModels: 'iPhone 11 Pro, iPhone 11 Pro Max'
  },
  {
    id: 'sp-3',
    name: 'Kamera Belakang iPhone 12 Pro original disassembled',
    stock: 4,
    buyPrice: 450000,
    sellingPrice: 900000,
    compatibleModels: 'iPhone 12 Pro'
  },
  {
    id: 'sp-4',
    name: 'IC Face ID Premium Flex',
    stock: 15,
    buyPrice: 70000,
    sellingPrice: 200000,
    compatibleModels: 'iPhone X, XR, 11, 12, 13'
  },
  {
    id: 'sp-5',
    name: 'Charging Port Connector iPhone 11 (Black)',
    stock: 10,
    buyPrice: 45000,
    sellingPrice: 150000,
    compatibleModels: 'iPhone 11'
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    type: 'iphone',
    model: 'iPhone 11 128GB Black (Second)',
    imei: '356782109283741',
    buyPrice: 3200000,
    repairCost: 200000,
    sellingPrice: 4200000,
    status: 'available',
  },
  {
    id: 'prod-2',
    type: 'iphone',
    model: 'iPhone 12 Pro 256GB Pacific Blue (Second)',
    imei: '351283019283123',
    buyPrice: 6500000,
    repairCost: 500000,
    sellingPrice: 8500000,
    status: 'available',
  },
  {
    id: 'prod-3',
    type: 'iphone',
    model: 'iPhone 13 128GB Pink (Second)',
    imei: '359283019213842',
    buyPrice: 8000000,
    repairCost: 0,
    sellingPrice: 10200000,
    status: 'sold',
  },
  {
    id: 'prod-4',
    type: 'iphone',
    model: 'iPhone 14 Pro Max 256GB Deep Purple (Second)',
    imei: '358210394829105',
    buyPrice: 13500000,
    repairCost: 350000,
    sellingPrice: 16500000,
    status: 'available',
  },
  {
    id: 'prod-acc1',
    type: 'aksesoris',
    model: 'Charger Original Apple 20W USB-C',
    buyPrice: 120000,
    repairCost: 0,
    sellingPrice: 250000,
    status: 'available',
    stock: 15,
  },
  {
    id: 'prod-acc2',
    type: 'aksesoris',
    model: 'Silicone Case iPhone 13 (Premium)',
    buyPrice: 35000,
    repairCost: 0,
    sellingPrice: 95000,
    status: 'available',
    stock: 24,
  },
  {
    id: 'prod-acc3',
    type: 'aksesoris',
    model: 'Tempered Glass Premium KingKong',
    buyPrice: 15000,
    repairCost: 0,
    sellingPrice: 50000,
    status: 'available',
    stock: 40,
  }
];

const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    customerName: 'Budi Hartono',
    customerPhone: '081234567890',
    devModel: 'iPhone X',
    imei: '352132309871234',
    description: 'Ganti LCD Pecah (Pura-pura Original)',
    status: 'selesai',
    cost: 650000,
    capitalCost: 300000,
    date: '2026-06-15T10:00:00.000Z',
  },
  {
    id: 'srv-2',
    customerName: 'Siti Aminah',
    customerPhone: '085712345678',
    devModel: 'iPhone 11 Pro',
    imei: '359871234567890',
    description: 'Ganti Baterai Health 70%',
    status: 'proses',
    cost: 450000,
    capitalCost: 180000,
    date: '2026-06-17T11:30:00.000Z',
  },
  {
    id: 'srv-3',
    customerName: 'Ricky Wijaya',
    customerPhone: '08991234567',
    devModel: 'iPhone 12',
    imei: '351122334455667',
    description: 'Kamera Belakang Blur / Getar',
    status: 'pending',
    cost: 850000,
    capitalCost: 400000,
    date: '2026-06-18T08:15:00.000Z',
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-1',
    customerId: 'cust-1',
    customerName: 'Budi Hartono',
    customerPhone: '081234567890',
    items: [
      {
        productId: 'prod-3',
        model: 'iPhone 13 128GB Pink (Second)',
        type: 'iphone',
        sellingPrice: 10200000,
        buyPrice: 8000000,
        repairCost: 0,
        quantity: 1,
      },
      {
        productId: 'prod-acc2',
        model: 'Silicone Case iPhone 13 (Premium)',
        type: 'aksesoris',
        sellingPrice: 95000,
        buyPrice: 35000,
        repairCost: 0,
        quantity: 1,
      }
    ],
    totalAmount: 10295000,
    totalProfit: 2260000, // (10200000 - 8000000) + (95000 - 35000)
    date: '2026-06-16T14:20:00.000Z',
    cashierName: 'Ahmad (Karyawan)',
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Budi Hartono', phone: '081234567890' },
  { id: 'cust-2', name: 'Siti Aminah', phone: '085712345678' },
  { id: 'cust-3', name: 'Ricky Wijaya', phone: '08991234567' }
];

const INITIAL_EXPENSES: OperationalExpense[] = [
  {
    id: 'exp-1',
    name: 'Internet IndiHome & Telepon Toko',
    amount: 380000,
    date: '2026-06-15',
    category: 'operasional'
  },
  {
    id: 'exp-2',
    name: 'Bonus Makan Siang Karyawan Akhir Pekan',
    amount: 120000,
    date: '2026-06-17',
    category: 'gaji'
  },
  {
    id: 'exp-3',
    name: 'Bantuan Sewa Listrik Tambahan',
    amount: 250000,
    date: '2026-06-18',
    category: 'operasional'
  }
];

// Helper LocalStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`afme_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`afme_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

// RESTORE / INITIALIZE
export function initializeDb() {
  if (!localStorage.getItem('afme_accounts')) {
    saveToStorage('accounts', INITIAL_ACCOUNTS);
  }
  if (!localStorage.getItem('afme_initialized')) {
    saveToStorage('products', INITIAL_PRODUCTS);
    saveToStorage('spareparts', INITIAL_SPAREPARTS);
    saveToStorage('services', INITIAL_SERVICES);
    saveToStorage('transactions', INITIAL_TRANSACTIONS);
    saveToStorage('customers', INITIAL_CUSTOMERS);
    saveToStorage('expenses', INITIAL_EXPENSES);
    localStorage.setItem('afme_initialized', 'true');
  }
}

// ACCOUNTS API
export function getAccounts(): AppAccount[] {
  initializeDb();
  const accounts = getFromStorage<any[]>('accounts', INITIAL_ACCOUNTS);
  
  let modified = false;

  // Let's migrate accounts with old PINs/Passwords to default text passwords if applicable
  let migrated = accounts.map(acc => {
    let currentPass = acc.password || acc.pin || '';
    let updatedPass = currentPass;

    // Convert old default numeric pins to default text passwords
    if (acc.username === 'admin' && (currentPass === '1234' || !currentPass)) {
      updatedPass = 'adminpassword';
      modified = true;
    } else if (acc.username === 'karyawan' && (currentPass === '0000' || !currentPass)) {
      updatedPass = 'staffpassword';
      modified = true;
    } else if (acc.username === 'megi' && (currentPass === '1303' || !currentPass)) {
      updatedPass = 'megipassword';
      modified = true;
    } else if (acc.username === 'owner' && !currentPass) {
      updatedPass = 'ownerpassword';
      modified = true;
    }

    // Ensure we delete any stale 'pin' property
    const { pin, ...rest } = acc;

    if (acc.password !== updatedPass || 'pin' in acc) {
      modified = true;
      return {
        ...rest,
        password: updatedPass
      };
    }
    return acc;
  });

  // Ensure all initial accounts are present inside the migrated/retrieved array
  INITIAL_ACCOUNTS.forEach(initial => {
    const exists = migrated.find(acc => acc.username === initial.username);
    if (!exists) {
      // Find and handle ID clashes when inserting initial accounts
      const idClash = migrated.some(acc => acc.id === initial.id);
      if (idClash) {
        migrated.push({
          ...initial,
          id: `acc-${Math.random().toString(36).substring(2, 9)}`
        });
      } else {
        migrated.push(initial);
      }
      modified = true;
    } else {
      // Keep structural integrity of core account roles if they get corrupted
      if (exists.username === 'owner' && exists.role !== 'admin') {
        exists.role = 'admin';
        modified = true;
      }
      if (exists.username === 'megi' && exists.role !== 'owner') {
        exists.role = 'owner';
        modified = true;
      }
      if (exists.username === 'admin' && exists.role !== 'admin') {
        exists.role = 'admin';
        modified = true;
      }
    }
  });

  // 1. Remove duplicate usernames (prefer earlier definition)
  const seenUsernames = new Set<string>();
  let uniqueUsernames: any[] = [];
  migrated.forEach(acc => {
    if (!acc.username) return;
    const uLower = acc.username.toLowerCase();
    if (!seenUsernames.has(uLower)) {
      seenUsernames.add(uLower);
      uniqueUsernames.push(acc);
    } else {
      modified = true;
    }
  });
  migrated = uniqueUsernames;

  // 2. Ensure absolutely unique IDs for every element
  const seenIds = new Set<string>();
  migrated = migrated.map(acc => {
    if (seenIds.has(acc.id) || !acc.id) {
      modified = true;
      const newId = `acc-${Math.random().toString(36).substring(2, 9)}`;
      return { ...acc, id: newId };
    } else {
      seenIds.add(acc.id);
      return acc;
    }
  });

  // Enforce only exactly ONE owner ('megi') exists in active list, demoting others to 'admin'
  migrated = migrated.map(acc => {
    if (acc.username !== 'megi' && acc.role === 'owner') {
      modified = true;
      return { ...acc, role: 'admin' as UserRole };
    }
    return acc;
  });

  // Double check that we have at least one owner
  const hasOwner = migrated.some(acc => acc.role === 'owner');
  if (!hasOwner) {
    const megiAcc = migrated.find(acc => acc.username === 'megi');
    if (megiAcc) {
      megiAcc.role = 'owner';
    } else {
      migrated.push({
        id: 'acc-3',
        username: 'megi',
        name: 'Megi Toko (Owner)',
        password: 'megipassword',
        role: 'owner'
      });
    }
    modified = true;
  }

  if (modified) {
    saveToStorage('accounts', migrated);
  }

  return migrated as AppAccount[];
}

export function saveAccount(acc: AppAccount): void {
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.id === acc.id || a.username.toLowerCase() === acc.username.toLowerCase());
  if (index > -1) {
    accounts[index] = acc;
  } else {
    accounts.push(acc);
  }
  saveToStorage('accounts', accounts);
}

export function deleteAccount(id: string): void {
  const accounts = getAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  saveToStorage('accounts', filtered);
}

// Reset Database completely to let user enter real live data
export function clearAllData(): void {
  saveToStorage('products', []);
  saveToStorage('spareparts', []);
  saveToStorage('services', []);
  saveToStorage('transactions', []);
  saveToStorage('customers', []);
  saveToStorage('expenses', []);
  localStorage.setItem('afme_initialized', 'true');
  localStorage.setItem('afme_modal_awal', '0');
}

// SPAREPARTS API
export function getSpareparts(): Sparepart[] {
  initializeDb();
  return getFromStorage<Sparepart[]>('spareparts', INITIAL_SPAREPARTS);
}

export function saveSparepart(sparepart: Sparepart): void {
  const spareparts = getSpareparts();
  const index = spareparts.findIndex((s) => s.id === sparepart.id);
  if (index > -1) {
    spareparts[index] = sparepart;
  } else {
    spareparts.push(sparepart);
  }
  saveToStorage('spareparts', spareparts);
}

export function deleteSparepart(id: string): void {
  const spareparts = getSpareparts();
  const filtered = spareparts.filter((s) => s.id !== id);
  saveToStorage('spareparts', filtered);
}

// PRODUCTS API
export function getProducts(): Product[] {
  initializeDb();
  return getFromStorage<Product[]>('products', INITIAL_PRODUCTS);
}

export function saveProduct(product: Product): void {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  
  if (index > -1) {
    products[index] = product;
  } else {
    products.push(product);
  }
  saveToStorage('products', products);
}

export function deleteProduct(id: string): void {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  saveToStorage('products', filtered);
}

// SERVICES API
export function getServices(): Service[] {
  initializeDb();
  return getFromStorage<Service[]>('services', INITIAL_SERVICES);
}

export function saveService(service: Service): void {
  const services = getServices();
  const index = services.findIndex((s) => s.id === service.id);
  
  let shouldDeductSparepart = false;
  if (service.status === 'selesai' && service.sparepartId) {
    if (index === -1) {
      shouldDeductSparepart = true;
    } else {
      const oldService = services[index];
      if (oldService.status !== 'selesai') {
        shouldDeductSparepart = true;
      } else if (oldService.sparepartId !== service.sparepartId) {
        shouldDeductSparepart = true;
      }
    }
  }

  if (shouldDeductSparepart && service.sparepartId) {
    const spareparts = getSpareparts();
    const spIdx = spareparts.findIndex(sp => sp.id === service.sparepartId);
    if (spIdx > -1) {
      const sp = spareparts[spIdx];
      if (sp.stock > 0) {
        sp.stock = sp.stock - 1;
        saveToStorage('spareparts', spareparts);
      }
    }
  }

  if (index > -1) {
    services[index] = service;
  } else {
    services.push(service);
  }
  saveToStorage('services', services);

  // Tambahkan customer ke DB jika belum ada
  if (service.customerName && service.customerPhone) {
    const customers = getCustomers();
    const cleanName = service.customerName.trim();
    const cleanPhone = service.customerPhone.trim();
    const lowerName = cleanName.toLowerCase();
    
    if (lowerName !== 'pelanggan umum' && lowerName !== 'customer umum' && lowerName !== 'umum') {
      const exists = customers.some(
        (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase() &&
               c.phone.trim().toLowerCase() === cleanPhone.toLowerCase()
      );
      if (!exists) {
        customers.push({
          id: `cust-${Date.now()}`,
          name: cleanName,
          phone: cleanPhone,
        });
        saveToStorage('customers', customers);
      }
    }
  }
}

export function deleteService(id: string): void {
  const services = getServices();
  const filtered = services.filter((s) => s.id !== id);
  saveToStorage('services', filtered);
}

// TRANSACTIONS API
export function getTransactions(): Transaction[] {
  initializeDb();
  return getFromStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
}

export function updateTransaction(updatedTrx: Transaction): void {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === updatedTrx.id);
  if (index !== -1) {
    transactions[index] = updatedTrx;
    saveToStorage('transactions', transactions);
  }
}

export function saveTransaction(trx: Transaction): void {
  const transactions = getTransactions();
  transactions.push(trx);
  saveToStorage('transactions', transactions);

  // Update status product iPhone / kurangi stok aksesoris
  const products = getProducts();
  trx.items.forEach((item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      if (prod.type === 'iphone') {
        prod.status = 'sold';
      } else if (prod.type === 'aksesoris' && prod.stock !== undefined) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    }
  });

  // Jika ada Trade-In, tambahkan unit trade-in tersebut sebagai Stok HP Baru
  if (trx.tradeIn) {
    products.push({
      id: `prod-tradein-${Date.now()}`,
      type: 'iphone',
      model: `${trx.tradeIn.model} (Trade-In)`,
      imei: trx.tradeIn.imei,
      buyPrice: trx.tradeIn.buyPrice,
      repairCost: trx.tradeIn.repairCost,
      sellingPrice: Math.round(trx.tradeIn.buyPrice * 1.25), // Prediksi harga jual default
      status: 'available',
    });
  }

  saveToStorage('products', products);

  // Tambahkan customer jika belum ada
  if (trx.customerName && trx.customerPhone) {
    const customers = getCustomers();
    const cleanName = trx.customerName.trim();
    const cleanPhone = trx.customerPhone.trim();
    const lowerName = cleanName.toLowerCase();

    if (lowerName !== 'pelanggan umum' && lowerName !== 'customer umum' && lowerName !== 'umum') {
      const exists = customers.some(
        (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase() &&
               c.phone.trim().toLowerCase() === cleanPhone.toLowerCase()
      );
      if (!exists) {
        customers.push({
          id: `cust-${Date.now()}`,
          name: cleanName,
          phone: cleanPhone,
        });
        saveToStorage('customers', customers);
      }
    }
  }
}

// CUSTOMERS API
export function getCustomers(): Customer[] {
  initializeDb();
  return getFromStorage<Customer[]>('customers', INITIAL_CUSTOMERS);
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers();
  const cleanName = customer.name.trim();
  const cleanPhone = customer.phone.trim();
  const lowerName = cleanName.toLowerCase();

  if (lowerName === 'pelanggan umum' || lowerName === 'customer umum' || lowerName === 'umum') {
    return;
  }

  const index = customers.findIndex((c) => 
    c.id === customer.id || 
    (c.name.trim().toLowerCase() === cleanName.toLowerCase() && c.phone.trim() === cleanPhone)
  );
  
  if (index > -1) {
    customers[index] = {
      ...customers[index],
      name: cleanName,
      phone: cleanPhone
    };
  } else {
    customers.push({
      id: customer.id || `cust-${Date.now()}`,
      name: cleanName,
      phone: cleanPhone
    });
  }
  saveToStorage('customers', customers);
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers();
  const filtered = customers.filter((c) => c.id !== id);
  saveToStorage('customers', filtered);
}

// EXPENSES API
export function getExpenses(): OperationalExpense[] {
  initializeDb();
  return getFromStorage<OperationalExpense[]>('expenses', INITIAL_EXPENSES);
}

export function saveExpense(expense: OperationalExpense): void {
  const expenses = getExpenses();
  const index = expenses.findIndex((e) => e.id === expense.id);
  if (index > -1) {
    expenses[index] = expense;
  } else {
    expenses.push(expense);
  }
  saveToStorage('expenses', expenses);
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses();
  const filtered = expenses.filter((e) => e.id !== id);
  saveToStorage('expenses', filtered);
}

// SUPABASE SQL SCHEMA EXPORT
export const SUPABASE_SQL_SCHEMA = `-- AFME STORE - SKEMA SUPABASE POSTGRESQL

-- 1. Tabel Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'karyawan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Products (HP Second & Aksesoris)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('iphone', 'aksesoris')),
  model VARCHAR(150) NOT NULL,
  imei VARCHAR(50) UNIQUE NULL,
  buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  repair_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  stock INTEGER NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Transactions (POS)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_profit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cashier_name VARCHAR(100) NOT NULL,
  trade_in_model VARCHAR(150) NULL,
  trade_in_imei VARCHAR(50) NULL,
  trade_in_buy_price NUMERIC(12, 2) DEFAULT 0,
  trade_in_repair_cost NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Transaction Items
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  model VARCHAR(150) NOT NULL,
  type VARCHAR(20) NOT NULL,
  selling_price NUMERIC(12, 2) NOT NULL,
  buy_price NUMERIC(12, 2) NOT NULL,
  repair_cost NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- 6. Tabel Services (Repairs)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  dev_model VARCHAR(100) NOT NULL,
  imei VARCHAR(50) NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proses', 'selesai')),
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  capital_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSERT DUMMY DATA CONTOH
INSERT INTO users (name, role) VALUES 
('Owner AFME', 'admin'),
('Cashier Karyawan', 'karyawan');
`;
