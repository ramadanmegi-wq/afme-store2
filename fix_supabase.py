import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

# Fix saveProductToSupabase
iphone_logic_old = """
      const { error } = await supabase.from('products').upsert([payloadWithRepairCost], { onConflict: 'id' });
      if (error) {
        if (error.code === '42703' || error.message?.includes('biaya_perbaikan') || error.message?.includes('column')) {
          const { error: errFallback } = await supabase.from('products').upsert([payloadFallback], { onConflict: 'id' });
          if (errFallback) {
            const { error: errFallback2 } = await supabase.from('products').upsert([payloadFallback2], { onConflict: 'id' });
            if (errFallback2) throw errFallback2;
          }
        } else {
          throw error;
        }
      }
"""
iphone_logic_new = """
      let error = null;
      if (isIdUuid) {
        const { error: err } = await supabase.from('products').upsert([payloadWithRepairCost], { onConflict: 'id' });
        error = err;
      } else {
        const { error: err } = await supabase.from('products').insert([payloadWithRepairCost]);
        error = err;
      }
      
      if (error) {
        if (error.code === '42703' || error.message?.includes('biaya_perbaikan') || error.message?.includes('column')) {
          let errFallback = null;
          if (isIdUuid) {
            const { error: err } = await supabase.from('products').upsert([payloadFallback], { onConflict: 'id' });
            errFallback = err;
          } else {
            const { error: err } = await supabase.from('products').insert([payloadFallback]);
            errFallback = err;
          }
          
          if (errFallback) {
            delete payloadFallback2.purchaser_name;
            let errFallback2 = null;
            if (isIdUuid) {
              const { error: err } = await supabase.from('products').upsert([payloadFallback2], { onConflict: 'id' });
              errFallback2 = err;
            } else {
              const { error: err } = await supabase.from('products').insert([payloadFallback2]);
              errFallback2 = err;
            }
            if (errFallback2) throw errFallback2;
          }
        } else {
          throw error;
        }
      }
"""
content = content.replace(iphone_logic_old.strip(), iphone_logic_new.strip())

acc_logic_old = """
      const { error } = await supabase.from('accessories').upsert([payloadWithSku], { onConflict: 'id' });
      if (error) {
        if (error.code === '42703' || error.message?.includes('sku') || error.message?.includes('column')) {
          const { error: errFallback } = await supabase.from('accessories').upsert([payloadFallback], { onConflict: 'id' });
          if (errFallback) {
            const { error: errFallback2 } = await supabase.from('accessories').upsert([payloadFallback2], { onConflict: 'id' });
            if (errFallback2) throw errFallback2;
          }
        } else {
          throw error;
        }
      }
"""
acc_logic_new = """
      let error = null;
      if (isIdUuid) {
        const { error: err } = await supabase.from('accessories').upsert([payloadWithSku], { onConflict: 'id' });
        error = err;
      } else {
        const { error: err } = await supabase.from('accessories').insert([payloadWithSku]);
        error = err;
      }

      if (error) {
        if (error.code === '42703' || error.message?.includes('sku') || error.message?.includes('column')) {
          let errFallback = null;
          if (isIdUuid) {
            const { error: err } = await supabase.from('accessories').upsert([payloadFallback], { onConflict: 'id' });
            errFallback = err;
          } else {
            const { error: err } = await supabase.from('accessories').insert([payloadFallback]);
            errFallback = err;
          }
          
          if (errFallback) {
            delete payloadFallback2.purchaser_name;
            let errFallback2 = null;
            if (isIdUuid) {
              const { error: err } = await supabase.from('accessories').upsert([payloadFallback2], { onConflict: 'id' });
              errFallback2 = err;
            } else {
              const { error: err } = await supabase.from('accessories').insert([payloadFallback2]);
              errFallback2 = err;
            }
            if (errFallback2) throw errFallback2;
          }
        } else {
          throw error;
        }
      }
"""
content = content.replace(acc_logic_old.strip(), acc_logic_new.strip())

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
