with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

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

content = content.replace(auto_include_logic, old_staff_logic)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
