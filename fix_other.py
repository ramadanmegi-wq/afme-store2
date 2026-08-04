import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

# spareparts
sp_logic_old = """
    const { error } = await supabase.from('spareparts').upsert([{ ...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sp.id) ? { id: sp.id } : {} ), ...payload }], { onConflict: 'id' });
    if (error) throw error;
"""
sp_logic_new = """
    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sp.id);
    let error = null;
    if (isIdUuid) {
      const { error: err } = await supabase.from('spareparts').upsert([{ id: sp.id, ...payload }], { onConflict: 'id' });
      error = err;
    } else {
      const { error: err } = await supabase.from('spareparts').insert([payload]);
      error = err;
    }
    if (error) throw error;
"""
content = content.replace(sp_logic_old.strip(), sp_logic_new.strip())

# services
srv_logic_old = """
    const { error } = await supabase.from('services').upsert([{ ...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(srv.id) ? { id: srv.id } : {} ), ...payload }], { onConflict: 'id' });
    if (error) throw error;
"""
srv_logic_new = """
    let error = null;
    if (isUuid) {
      const { error: err } = await supabase.from('services').upsert([{ id: srv.id, ...payload }], { onConflict: 'id' });
      error = err;
    } else {
      const { error: err } = await supabase.from('services').insert([payload]);
      error = err;
    }
    if (error) throw error;
"""
content = content.replace(srv_logic_old.strip(), srv_logic_new.strip())

# expenses
exp_logic_old = """
    const { error } = await supabase.from('expenses').upsert([{ ...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exp.id) ? { id: exp.id } : {} ), ...payload }], { onConflict: 'id' });
    if (error) throw error;
"""
exp_logic_new = """
    let error = null;
    if (isUuid) {
      const { error: err } = await supabase.from('expenses').upsert([{ id: exp.id, ...payload }], { onConflict: 'id' });
      error = err;
    } else {
      const { error: err } = await supabase.from('expenses').insert([payload]);
      error = err;
    }
    if (error) throw error;
"""
content = content.replace(exp_logic_old.strip(), exp_logic_new.strip())

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
