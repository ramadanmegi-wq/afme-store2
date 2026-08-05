with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

# Fix 1: Auto-include cashiers in allStaffNames
old_staff_logic = """  const allStaffNames = useMemo(() => {
    const defaultList = ['Aldi', 'Friya'];
    const namesSet = new Set<string>();

    defaultList.forEach(n => namesSet.add(n));
    customStaff.forEach(n => {
      const trimmed = n.trim();
      if (trimmed) namesSet.add(trimmed);
    });

    return Array.from(namesSet);
  }, [customStaff]);"""

auto_include_logic = """  const allStaffNames = useMemo(() => {
    const defaultList = ['Aldi', 'Friya'];
    const namesSet = new Set<string>();

    defaultList.forEach(n => namesSet.add(n));
    customStaff.forEach(n => {
      const trimmed = n.trim();
      if (trimmed) namesSet.add(trimmed);
    });

    // Auto-include cashiers from transactions
    transactions.forEach(t => {
      if (t.cashierName && t.cashierName.trim() && t.cashierName.toLowerCase() !== 'staff kasir' && t.cashierName.toLowerCase() !== 'staff afme') {
        const cleanRaw = t.cashierName.replace(/\\s*\\([^)]*\\)/g, '').trim();
        const lower = cleanRaw.toLowerCase();
        let matched = false;
        for (const existing of Array.from(namesSet)) {
          if (existing.toLowerCase() === lower || lower.includes(existing.toLowerCase())) {
            matched = true;
            break;
          }
        }
        if (!matched && cleanRaw) {
          const formatted = cleanRaw.charAt(0).toUpperCase() + cleanRaw.slice(1);
          namesSet.add(formatted);
        }
      }
    });

    return Array.from(namesSet);
  }, [customStaff, transactions]);"""

content = content.replace(old_staff_logic, auto_include_logic)

# Fix 2: Fix hpUnits calculation
old_hp_logic = """      if (t.items && t.items.length > 0) {
        t.items.forEach(item => {
          const qty = item.quantity ?? (item as any).qty ?? 1;
          const matchedProd = products.find(p => p.id === item.productId);
          const pType = item.type ?? (item as any).productType ?? (matchedProd ? matchedProd.type : undefined);
          if (pType === 'iphone' || (pType as string) === 'hp') {
            hpUnits += qty;
          }
        });
      }"""

new_hp_logic = """      if (t.items && t.items.length > 0) {
        t.items.forEach(item => {
          const qty = Number(item.quantity ?? (item as any).qty ?? 1);
          const matchedProd = products.find(p => p.id === item.productId);
          const pType = (matchedProd ? matchedProd.type : undefined) ?? item.type ?? (item as any).productType;
          
          const modelName = (item.model || '').toLowerCase();
          const isPhoneModel = modelName.includes('iphone') || modelName.includes('samsung') || modelName.includes('oppo') || modelName.includes('vivo') || modelName.includes('xiaomi') || modelName.includes('realme') || modelName.includes('infinix') || modelName.includes('hp');
          
          if (pType === 'iphone' || (pType as string) === 'hp' || isPhoneModel) {
            hpUnits += qty;
          }
        });
      }"""

content = content.replace(old_hp_logic, new_hp_logic)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
