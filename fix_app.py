with open('src/App.tsx', 'r') as f:
    content = f.read()

import re

# Fix LaporanKeuangan
laporan_keuangan = """              <LaporanKeuangan
                products={products}
                transactions={transactions}
                services={services}
                activeRole={activeRole}
                expenses={expenses}
                spareparts={spareparts}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onOpenLaporanTransaksi={() => setActiveTab('laporan_transaksi')}
              />"""

laporan_keuangan_fixed = """              <LaporanKeuangan
                products={products}
                transactions={transactions}
                services={services}
                activeRole={activeRole}
                expenses={expenses}
                spareparts={spareparts}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                onUpdateTransaction={handleUpdateTransaction}
                onOpenLaporanTransaksi={() => setActiveTab('laporan_transaksi')}
              />"""

if laporan_keuangan in content:
    content = content.replace(laporan_keuangan, laporan_keuangan_fixed)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Fixed LaporanKeuangan")
else:
    print("Could not find LaporanKeuangan")
