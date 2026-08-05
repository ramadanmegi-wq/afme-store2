import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

new_logic = """
export async function updateTransactionInSupabase(updatedTrx: Transaction): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedTrx.id);
    
    // If not a UUID, we can't update it in Supabase directly by ID.
    // It might be a locally created legacy transaction.
    if (!isIdUuid) {
      console.warn("Skipping update in Supabase because ID is not UUID:", updatedTrx.id);
      return;
    }

    const totalModal = updatedTrx.items.reduce((sum, item) => sum + ((item.buyPrice + (item.repairCost || 0)) * item.quantity), 0);
    const totalJual = updatedTrx.totalAmount;
    const laba = updatedTrx.totalProfit > 0 ? updatedTrx.totalProfit : (totalJual - totalModal);

    // 1. Update ke tabel 'transactions' dengan try-fallback
    const payload: any = {
      id: updatedTrx.id,
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

    try {
      const localMaps = JSON.parse(localStorage.getItem('trx_customer_maps') || '{}');
      localMaps[updatedTrx.id] = {
        customerName: updatedTrx.customerName,
        customerPhone: updatedTrx.customerPhone,
        cashierName: updatedTrx.cashierName || 'Staff Kasir'
      };
      localStorage.setItem('trx_customer_maps', JSON.stringify(localMaps));
    } catch (e) {
      console.error('Error updating local transaction map:', e);
    }

    const { error: delErr } = await supabase
      .from('transaction_items')
      .delete()
      .eq('transaction_id', updatedTrx.id);

    if (delErr) {
      throw delErr;
    }

    const itemsPayload = updatedTrx.items.map(item => ({
      transaction_id: updatedTrx.id,
      product_id: item.productId,
      nama_barang: item.model,
      qty: item.quantity,
      harga: item.sellingPrice,
      subtotal: item.sellingPrice * item.quantity
    }));
    
    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase.from('transaction_items').insert(itemsPayload);
      if (itemsErr) {
        throw itemsErr;
      }
    }
  } catch (e) {
    console.error('Gagal memperbarui transaksi di Supabase:', e);
    throw e;
  }
}
"""

content = re.sub(r'export async function updateTransactionInSupabase.*?\n}\n', new_logic + '\n', content, flags=re.DOTALL)

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
