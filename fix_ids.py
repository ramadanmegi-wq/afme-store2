import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

# For Products (iPhone)
content = re.sub(
    r"id: prod\.id,",
    r"...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prod.id) ? { id: prod.id } : {} ),",
    content
)

# For Spareparts
content = re.sub(
    r"id: sp\.id,",
    r"...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sp.id) ? { id: sp.id } : {} ),",
    content
)

# For Services
content = re.sub(
    r"id: srv\.id,",
    r"...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(srv.id) ? { id: srv.id } : {} ),",
    content
)

# For Expenses
content = re.sub(
    r"id: exp\.id,",
    r"...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exp.id) ? { id: exp.id } : {} ),",
    content
)

# For Transactions
content = re.sub(
    r"id: trx\.id,",
    r"...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trx.id) ? { id: trx.id } : {} ),",
    content
)

content = re.sub(
    r"id: updatedTrx\.id,",
    r"...( /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedTrx.id) ? { id: updatedTrx.id } : {} ),",
    content
)

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
