with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_log = """  const purchaseLogsFiltered = useMemo(() => {
    return products.filter(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return false;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff) return false; // Strictly include only purchases assigned to tracked staff (Aldi, Friya, etc.)

      const matchStaff = selectedStaffFilter === 'all' || matchedStaff === selectedStaffFilter;
      const matchSearch = (p.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.imei && p.imei.includes(searchTerm)) ||
                          (p.purchaserName && p.purchaserName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (matchedStaff && matchedStaff.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [products, selectedStaffFilter, searchTerm, dateFilter]);"""

new_log = """  const purchaseLogsFiltered = useMemo(() => {
    return products.filter(p => {
      const isHp = p.type === 'iphone' || p.type === 'hp' || (p.type as string) === 'hp';
      if (!isHp) return false; // STRICTLY ONLY HP

      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return false;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff) return false; // Strictly include only purchases assigned to tracked staff (Aldi, Friya, etc.)

      const matchStaff = selectedStaffFilter === 'all' || matchedStaff === selectedStaffFilter;
      const matchSearch = (p.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.imei && p.imei.includes(searchTerm)) ||
                          (p.purchaserName && p.purchaserName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (matchedStaff && matchedStaff.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [products, selectedStaffFilter, searchTerm, dateFilter]);"""

if old_log in content:
    content = content.replace(old_log, new_log)
    with open('src/components/TrackingKaryawan.tsx', 'w') as f:
        f.write(content)
    print("Fixed purchaseLogsFiltered")
else:
    print("Could not find purchaseLogsFiltered")
