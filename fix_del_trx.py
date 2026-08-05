import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

new_logic = """
export async function deleteTransactionFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const isIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isIdUuid) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.error('Gagal menghapus transaksi dari Supabase:', e);
    throw e;
  }
}
"""

content = re.sub(r'export async function deleteTransactionFromSupabase.*?\n}\n', new_logic + '\n', content, flags=re.DOTALL)

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
