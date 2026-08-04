import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

# 1. saveTransactionToSupabase
save_trx_logic_old = """
    const payload: any = {
      nomor_transaksi: orderNo,
      tanggal: trx.date || new Date().toISOString(),
      total_modal: totalModal,
      total_penjualan: totalJual,
      laba: laba,
      metode_pembayaran: 'Tunai',
      customer_name: trx.customerName || 'Pelanggan Umum',
      customer_phone: trx.customerPhone || '08123456789',
      cashier_name: trx.cashierName || 'Staff Kasir'
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
"""

save_trx_logic_new = """
    const payload: any = {
      id: trx.id,
      nomor_transaksi: orderNo,
      tanggal: trx.date || new Date().toISOString(),
      total_modal: totalModal,
      total_penjualan: totalJual,
      laba: laba,
      metode_pembayaran: 'Tunai',
      customer_name: trx.customerName || 'Pelanggan Umum',
      customer_phone: trx.customerPhone || '08123456789',
      cashier_name: trx.cashierName || 'Staff Kasir'
    };

    let { data: saleData, error: saleErr } = await supabase
      .from('transactions')
      .upsert([payload])
      .select()
      .single();

    if (saleErr && (saleErr.code === '42703' || saleErr.message?.includes('column'))) {
      // Fallback: retry without custom columns
      const fallbackPayload = {
        id: trx.id,
        nomor_transaksi: orderNo,
        tanggal: trx.date || new Date().toISOString(),
        total_modal: totalModal,
        total_penjualan: totalJual,
        laba: laba,
        metode_pembayaran: 'Tunai'
      };
      const retryResult = await supabase
        .from('transactions')
        .upsert([fallbackPayload])
        .select()
        .single();
      saleData = retryResult.data;
      saleErr = retryResult.error;
    }
"""

content = content.replace(save_trx_logic_old.strip(), save_trx_logic_new.strip())

# 2. updateTransactionInSupabase (We can keep update, or change it to upsert)
update_trx_logic_old = """
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
"""

update_trx_logic_new = """
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
      .upsert([payload]);

    if (sErr && (sErr.code === '42703' || sErr.message?.includes('column'))) {
      // Fallback: update without customer_name/customer_phone columns
      const fallbackPayload = {
        id: updatedTrx.id,
        total_modal: totalModal,
        total_penjualan: totalJual,
        laba: laba,
        tanggal: updatedTrx.date
      };
      const retryResult = await supabase
        .from('transactions')
        .upsert([fallbackPayload]);
      sErr = retryResult.error;
    }
"""

content = content.replace(update_trx_logic_old.strip(), update_trx_logic_new.strip())

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
