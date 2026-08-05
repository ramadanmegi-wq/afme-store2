import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

new_logic = """
export async function updateTransactionInSupabase(updatedTrx: Transaction): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    console.log("updateTransactionInSupabase called with id:", updatedTrx.id);
    const totalModal = updatedTrx.items.reduce((sum, item) => sum + ((item.buyPrice + (item.repairCost || 0)) * item.quantity), 0);
    const totalJual = updatedTrx.totalAmount;
    const laba = updatedTrx.totalProfit > 0 ? updatedTrx.totalProfit : (totalJual - totalModal);

    // 1. Update ke tabel 'transactions' dengan try-fallback
    const payload: any = {
      ...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedTrx.id) ? { id: updatedTrx.id } : {} ),
      total_modal: totalModal,
      total_penjualan: totalJual,
      laba: laba,
      customer_name: updatedTrx.customerName || 'Pelanggan Umum',
      customer_phone: updatedTrx.customerPhone || '08123456789',
      tanggal: updatedTrx.date
    };

    console.log("Updating transactions table...", payload);
    let { error: sErr } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', updatedTrx.id);

    if (sErr) console.error("transactions update error:", sErr);

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
      if (sErr) console.error("transactions retry update error:", sErr);
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

    console.log("Deleting old transaction items...");
    const { error: delErr } = await supabase
      .from('transaction_items')
      .delete()
      .eq('transaction_id', updatedTrx.id);

    if (delErr) {
      console.error("transaction_items delete error:", delErr);
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
    
    console.log("Inserting new transaction items...", itemsPayload);
    const { error: itemsErr } = await supabase.from('transaction_items').insert(itemsPayload);
    
    if (itemsErr) {
      console.error("transaction_items insert error:", itemsErr);
      throw itemsErr;
    }
    
    console.log("updateTransactionInSupabase complete.");
  } catch (e) {
    console.error('Gagal memperbarui transaksi di Supabase:', e);
    throw e;
  }
}
"""

content = re.sub(r'export async function updateTransactionInSupabase.*?\n}\n', new_logic + '\n', content, flags=re.DOTALL)

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
