import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

old_logic = """
    let { data: saleData, error: saleErr } = await supabase
      .from('transactions')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .single();

    if (saleErr && (saleErr.code === '42703' || saleErr.message?.includes('column'))) {
      // Fallback: retry without custom columns
      const fallbackPayload = {
        ...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trx.id) ? { id: trx.id } : {} ),
        nomor_transaksi: orderNo,
        tanggal: trx.date || new Date().toISOString(),
        total_modal: totalModal,
        total_penjualan: totalJual,
        laba: laba,
        metode_pembayaran: 'Tunai'
      };
      const retryResult = await supabase
        .from('transactions')
        .upsert([fallbackPayload], { onConflict: 'id' })
        .select()
        .single();
      saleData = retryResult.data;
      saleErr = retryResult.error;
    }
"""

new_logic = """
    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trx.id);
    let saleData, saleErr;
    
    if (isIdUuid) {
      const { data, error } = await supabase.from('transactions').upsert([payload], { onConflict: 'id' }).select().single();
      saleData = data; saleErr = error;
    } else {
      const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
      saleData = data; saleErr = error;
    }

    if (saleErr && (saleErr.code === '42703' || saleErr.message?.includes('column'))) {
      // Fallback: retry without custom columns
      const fallbackPayload = {
        ...( isIdUuid ? { id: trx.id } : {} ),
        nomor_transaksi: orderNo,
        tanggal: trx.date || new Date().toISOString(),
        total_modal: totalModal,
        total_penjualan: totalJual,
        laba: laba,
        metode_pembayaran: 'Tunai'
      };
      
      if (isIdUuid) {
        const { data, error } = await supabase.from('transactions').upsert([fallbackPayload], { onConflict: 'id' }).select().single();
        saleData = data; saleErr = error;
      } else {
        const { data, error } = await supabase.from('transactions').insert([fallbackPayload]).select().single();
        saleData = data; saleErr = error;
      }
    }
"""
content = content.replace(old_logic.strip(), new_logic.strip())

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
