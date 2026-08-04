import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

# Replace upsert with update for transactions
update_logic_old = """
    let { error: sErr } = await supabase
      .from('transactions')
      .upsert([payload], { onConflict: 'id' });

    if (sErr && (sErr.code === '42703' || sErr.message?.includes('column'))) {
      // Fallback: update without customer_name/customer_phone columns
      const fallbackPayload = {
        ...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedTrx.id) ? { id: updatedTrx.id } : {} ),
        total_modal: totalModal,
        total_penjualan: totalJual,
        laba: laba,
        tanggal: updatedTrx.date
      };
      const retryResult = await supabase
        .from('transactions')
        .upsert([fallbackPayload], { onConflict: 'id' });
      sErr = retryResult.error;
    }
"""

update_logic_new = """
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

content = content.replace(update_logic_old.strip(), update_logic_new.strip())

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
