with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

new = """export async function deleteTransactionFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting transaction from Supabase:', error);
    throw error;
  }
}"""

if "deleteTransactionFromSupabase" not in content:
    content = content + "\n" + new + "\n"
    with open('src/lib/supabaseService.ts', 'w') as f:
        f.write(content)
