with open('src/App.tsx', 'r') as f:
    content = f.read()

import re

# Add imports
if 'deleteTransaction,' not in content:
    content = content.replace('updateTransaction,', 'updateTransaction,\n  deleteTransaction,')
if 'deleteTransactionFromSupabase' not in content:
    content = content.replace('updateTransactionInSupabase,', 'updateTransactionInSupabase,\n  deleteTransactionFromSupabase,')

# Add handleDeleteTransaction
delete_handler = """  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini? Data stok tidak akan dikembalikan otomatis.')) return;
    
    setIsLoading(true);
    deleteTransaction(id);
    
    if (isSupabaseConfigured) {
      await safeRequest(
        () => deleteTransactionFromSupabase(id),
        () => {
          triggerToast('Gagal sinkron cloud, transaksi dihapus secara lokal', 'info');
        },
        'Transaksi berhasil dihapus dari sistem dan cloud',
        'Gagal menghapus transaksi dari Cloud'
      );
    } else {
      triggerToast('Transaksi berhasil dihapus secara lokal', 'success');
    }
    
    setTransactions(getTransactions());
    setIsLoading(false);
  };"""

if 'handleDeleteTransaction' not in content:
    # Insert after handleUpdateTransaction
    content = re.sub(r'(  const handleUpdateTransaction = async \(updatedTrx: Transaction\) => \{.*?\n  \};\n)', r'\1\n' + delete_handler + '\n', content, flags=re.DOTALL)

# Add to props
content = content.replace('onUpdateTransaction={handleUpdateTransaction}', 'onUpdateTransaction={handleUpdateTransaction}\n                onDeleteTransaction={handleDeleteTransaction}')

with open('src/App.tsx', 'w') as f:
    f.write(content)
