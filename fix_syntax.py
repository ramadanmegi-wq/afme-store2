import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

content = content.replace("transaction_...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedTrx.id) ? { id: updatedTrx.id } : {} ),", "transaction_id: updatedTrx.id,")
content = content.replace("transaction_...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trx.id) ? { id: trx.id } : {} ),", "transaction_id: trx.id,")

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
