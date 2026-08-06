with open('src/components/LaporanTransaksi.tsx', 'r') as f:
    content = f.read()

import re

# Add to interface
if 'onDeleteTransaction' not in content:
    content = content.replace('onUpdateTransaction?: (trx: Transaction) => Promise<void>;', 'onUpdateTransaction?: (trx: Transaction) => Promise<void>;\n  onDeleteTransaction?: (id: string) => Promise<void>;')
    content = content.replace('  onUpdateTransaction,\n', '  onUpdateTransaction,\n  onDeleteTransaction,\n')

# Add delete button next to Edit button
old_buttons = """                                {isAdminOrOwner && item.type === 'pos' ? (
                                  <button
                                    onClick={() => handleStartEdit(item.originalData)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer border border-amber-200"
                                    title="Edit atau Redo Transaksi Penjualan"
                                  >
                                    <Pencil size={11} />
                                    <span>Edit/Redo</span>
                                  </button>
                                )"""

new_buttons = """                                {isAdminOrOwner && item.type === 'pos' ? (
                                  <div className="flex justify-center gap-1">
                                    <button
                                      onClick={() => handleStartEdit(item.originalData)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer border border-amber-200"
                                      title="Edit atau Redo Transaksi Penjualan"
                                    >
                                      <Pencil size={11} />
                                      <span>Edit/Redo</span>
                                    </button>
                                    <button
                                      onClick={() => onDeleteTransaction && onDeleteTransaction(item.id)}
                                      className="inline-flex items-center justify-center w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer border border-rose-200"
                                      title="Hapus Transaksi Penjualan"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )"""

if old_buttons in content:
    content = content.replace(old_buttons, new_buttons)
else:
    print("Could not find old buttons")

with open('src/components/LaporanTransaksi.tsx', 'w') as f:
    f.write(content)
