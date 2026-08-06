with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_logic = """    // Process products (Stock purchases)
    products.forEach(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      const isIphone = p.type === 'iphone';
      
      // ONLY include HP for purchases as well, ignoring aksesoris
      if (isIphone) {"""

new_logic = """    // Process products (Stock purchases)
    products.forEach(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      const isHp = p.type === 'iphone' || p.type === 'hp' || (p.type as string) === 'hp';
      
      // ONLY include HP for purchases as well, ignoring aksesoris
      if (isHp) {"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('src/components/TrackingKaryawan.tsx', 'w') as f:
        f.write(content)
    print("Fixed purchase logic")
else:
    print("Could not find purchase logic")

# Fix purchaseLogsFiltered
old_log = """  // Filtered stock purchase log table
  const purchaseLogsFiltered = useMemo(() => {
    return products.filter(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return false;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff) return false; // Strictly include only purchases assigned to tracked staff (Aldi, Friya, etc.)

      const matchStaff = selectedStaffFilter === 'all' || matchedStaff === selectedStaffFilter;
      const matchSearch = (p.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.imei && p.imei.includes(searchTerm)) ||
                          (p.purchaserName && p.purchaserName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [products, selectedStaffFilter, searchTerm]);"""

new_log = """  // Filtered stock purchase log table
  const purchaseLogsFiltered = useMemo(() => {
    return products.filter(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return false;

      const isHp = p.type === 'iphone' || p.type === 'hp' || (p.type as string) === 'hp';
      if (!isHp) return false; // ONLY SHOW HP PURCHASES

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff) return false; // Strictly include only purchases assigned to tracked staff (Aldi, Friya, etc.)

      const matchStaff = selectedStaffFilter === 'all' || matchedStaff === selectedStaffFilter;
      const matchSearch = (p.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.imei && p.imei.includes(searchTerm)) ||
                          (p.purchaserName && p.purchaserName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [products, selectedStaffFilter, searchTerm]);"""

if old_log in content:
    content = content.replace(old_log, new_log)
    with open('src/components/TrackingKaryawan.tsx', 'w') as f:
        f.write(content)
    print("Fixed purchaseLogsFiltered")
else:
    print("Could not find purchaseLogsFiltered logic")
