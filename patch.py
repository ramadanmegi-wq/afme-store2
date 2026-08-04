with open('src/lib/supabaseService.ts', 'r') as f:
    lines = f.readlines()

content = "".join(lines)

import re

# Fix getSparepartsFromSupabase
content = re.sub(
r'    return cloudSpareparts;\n    return cloudSpareparts;\n\nexport async function saveSparepartToSupabase',
r'''    return cloudSpareparts;
  } catch (e) {
    console.error('Gagal mengambil spareparts dari Supabase:', e);
    return getSpareparts();
  }
}

export async function saveSparepartToSupabase''', content)

# Fix getServicesFromSupabase
content = re.sub(
r'  \} catch \(e\) \{\n    console\.error\(\'Gagal mengambil services dari Supabase:\', e\);\n    return getServices\(\);\n  \}\n    return cloudServices;\n    const isUuid = /\^\[0-9a-f\]\{8\}\-\[0-9a-f\]\{4\}\-\[0-9a-f\]\{4\}\-\[0-9a-f\]\{4\}\-\[0-9a-f\]\{12\}\$/i\.test\(srv\.id\);',
r'''  } catch (e) {
    console.error('Gagal mengambil services dari Supabase:', e);
    return getServices();
  }
}

export async function saveServiceToSupabase(srv: Service): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(srv.id);''', content)

# Fix getExpensesFromSupabase
content = re.sub(
r'export async function saveExpenseToSupabase\(exp: OperationalExpense\): Promise<void> \{\n  if \(\!isSupabaseConfigured\) return;\n    return cloudExpenses;\n      nominal: exp\.amount,',
r'''export async function saveExpenseToSupabase(exp: OperationalExpense): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exp.id);
    const payload = {
      deskripsi: exp.name,
      kategori: exp.category,
      nominal: exp.amount,''', content)


with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
