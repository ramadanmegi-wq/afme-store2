import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

# 1. Products (iPhone)
content = re.sub(
    r"const payloadWithRepairCost = {",
    r"const payloadWithRepairCost = {\n        id: prod.id,",
    content
)
content = re.sub(
    r"const payloadFallback = {",
    r"const payloadFallback = {\n        id: prod.id,",
    content
)
content = re.sub(
    r"const payloadFallback2 = {",
    r"const payloadFallback2 = {\n        id: prod.id,",
    content
)

# Replace the if (isIdUuid) logic for iPhone
iphone_logic = """
      if (isIdUuid) {
        const { error } = await supabase.from('products').update(payloadWithRepairCost).eq('id', prod.id);
        if (error) {
          if (error.code === '42703' || error.message?.includes('biaya_perbaikan') || error.message?.includes('column')) {
            const { error: errFallback } = await supabase.from('products').update(payloadFallback).eq('id', prod.id);
            if (errFallback) {
              const { error: errFallback2 } = await supabase.from('products').update(payloadFallback2).eq('id', prod.id);
              if (errFallback2) throw errFallback2;
            }
          } else {
            throw error;
          }
        }
      } else {
        let insertedData;
        const { data, error } = await supabase.from('products').insert([payloadWithRepairCost]).select();
        if (error) {
          if (error.code === '42703' || error.message?.includes('biaya_perbaikan') || error.message?.includes('column')) {
            const { data: fbData, error: errFallback } = await supabase.from('products').insert([payloadFallback]).select();
            if (errFallback) {
              const { data: fbData2, error: errFallback2 } = await supabase.from('products').insert([payloadFallback2]).select();
              if (errFallback2) throw errFallback2;
              insertedData = fbData2;
            } else {
              insertedData = fbData;
            }
          } else {
            throw error;
          }
        } else {
          insertedData = data;
        }
        
        if (insertedData && insertedData[0] && prod.purchaserName) {
          try {
            const localMaps = JSON.parse(localStorage.getItem('prod_purchaser_maps') || '{}');
            localMaps[insertedData[0].id] = prod.purchaserName;
            localStorage.setItem('prod_purchaser_maps', JSON.stringify(localMaps));
          } catch (e) {}
        }
      }
"""
new_iphone_logic = """
      const { error } = await supabase.from('products').upsert([payloadWithRepairCost]);
      if (error) {
        if (error.code === '42703' || error.message?.includes('biaya_perbaikan') || error.message?.includes('column')) {
          const { error: errFallback } = await supabase.from('products').upsert([payloadFallback]);
          if (errFallback) {
            const { error: errFallback2 } = await supabase.from('products').upsert([payloadFallback2]);
            if (errFallback2) throw errFallback2;
          }
        } else {
          throw error;
        }
      }
      
      if (prod.purchaserName) {
        try {
          const localMaps = JSON.parse(localStorage.getItem('prod_purchaser_maps') || '{}');
          localMaps[prod.id] = prod.purchaserName;
          localStorage.setItem('prod_purchaser_maps', JSON.stringify(localMaps));
        } catch (e) {}
      }
"""
content = content.replace(iphone_logic.strip(), new_iphone_logic.strip())

# 2. Products (Accessories)
content = re.sub(
    r"const payloadWithSku = {",
    r"const payloadWithSku = {\n        id: prod.id,",
    content
)

acc_logic = """
      if (isIdUuid) {
        const { error } = await supabase.from('accessories').update(payloadWithSku).eq('id', prod.id);
        if (error) {
          if (error.code === '42703' || error.message?.includes('sku') || error.message?.includes('column')) {
            const { error: errFallback } = await supabase.from('accessories').update(payloadFallback).eq('id', prod.id);
            if (errFallback) {
              const { error: errFallback2 } = await supabase.from('accessories').update(payloadFallback2).eq('id', prod.id);
              if (errFallback2) throw errFallback2;
            }
          } else {
            throw error;
          }
        }
      } else {
        let insertedData;
        const { data, error } = await supabase.from('accessories').insert([payloadWithSku]).select();
        if (error) {
          if (error.code === '42703' || error.message?.includes('sku') || error.message?.includes('column')) {
            const { data: fbData, error: errFallback } = await supabase.from('accessories').insert([payloadFallback]).select();
            if (errFallback) {
              const { data: fbData2, error: errFallback2 } = await supabase.from('accessories').insert([payloadFallback2]).select();
              if (errFallback2) throw errFallback2;
              insertedData = fbData2;
            } else {
              insertedData = fbData;
            }
          } else {
            throw error;
          }
        } else {
          insertedData = data;
        }
        
        if (insertedData && insertedData[0] && prod.purchaserName) {
          try {
            const localMaps = JSON.parse(localStorage.getItem('prod_purchaser_maps') || '{}');
            localMaps[insertedData[0].id] = prod.purchaserName;
            localStorage.setItem('prod_purchaser_maps', JSON.stringify(localMaps));
          } catch (e) {}
        }
      }
"""

new_acc_logic = """
      const { error } = await supabase.from('accessories').upsert([payloadWithSku]);
      if (error) {
        if (error.code === '42703' || error.message?.includes('sku') || error.message?.includes('column')) {
          const { error: errFallback } = await supabase.from('accessories').upsert([payloadFallback]);
          if (errFallback) {
            const { error: errFallback2 } = await supabase.from('accessories').upsert([payloadFallback2]);
            if (errFallback2) throw errFallback2;
          }
        } else {
          throw error;
        }
      }

      if (prod.purchaserName) {
        try {
          const localMaps = JSON.parse(localStorage.getItem('prod_purchaser_maps') || '{}');
          localMaps[prod.id] = prod.purchaserName;
          localStorage.setItem('prod_purchaser_maps', JSON.stringify(localMaps));
        } catch (e) {}
      }
"""
content = content.replace(acc_logic.strip(), new_acc_logic.strip())

# 3. Spareparts
sp_logic = """
    if (isUuid) {
      const { error } = await supabase.from('spareparts').update(payload).eq('id', sp.id);
      if (error) throw error;
      return sp.id;
    } else {
      const { data, error } = await supabase.from('spareparts').insert([payload]).select('id').maybeSingle();
      if (error) throw error;
      return data?.id;
    }
"""
new_sp_logic = """
    const { error } = await supabase.from('spareparts').upsert([{ id: sp.id, ...payload }]);
    if (error) throw error;
    return sp.id;
"""
content = content.replace(sp_logic.strip(), new_sp_logic.strip())

# 4. Services
srv_logic = """
    if (isUuid) {
      const { error } = await supabase.from('services').update(payload).eq('id', srv.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('services').insert([payload]);
      if (error) throw error;
    }
"""
new_srv_logic = """
    const { error } = await supabase.from('services').upsert([{ id: srv.id, ...payload }]);
    if (error) throw error;
"""
content = content.replace(srv_logic.strip(), new_srv_logic.strip())

# 5. Expenses
exp_logic = """
    if (isUuid) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', exp.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('expenses').insert([payload]);
      if (error) throw error;
    }
"""
new_exp_logic = """
    const { error } = await supabase.from('expenses').upsert([{ id: exp.id, ...payload }]);
    if (error) throw error;
"""
content = content.replace(exp_logic.strip(), new_exp_logic.strip())

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
