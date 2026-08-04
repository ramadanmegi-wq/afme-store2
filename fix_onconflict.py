import re

with open('src/lib/supabaseService.ts', 'r') as f:
    content = f.read()

# Match `.upsert([...])` or `.upsert(payload)`
# Example: .upsert([payloadWithRepairCost])
content = re.sub(
    r"\.upsert\(\[(.*?)\]\)",
    r".upsert([\1], { onConflict: 'id' })",
    content
)

with open('src/lib/supabaseService.ts', 'w') as f:
    f.write(content)
