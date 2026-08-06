with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

# Fix findTrackedStaff
old_find_staff = """  const findTrackedStaff = (rawName?: string): string | null => {
    if (!rawName) return null;
    const cleanRaw = rawName.replace(/\\s*\\([^)]*\\)/g, '').trim();
    if (!cleanRaw) return null;
    const lower = cleanRaw.toLowerCase();

    // Check against tracked staff names (Aldi & Friya)
    for (const staff of allStaffNames) {
      const staffLower = staff.toLowerCase();
      if (lower === staffLower || lower.includes(staffLower) || staffLower.includes(lower)) {
        return staff;
      }
    }

    return null; // Do not attribute to Aldi/Friya if created by non-tracked accounts (e.g. Owner/Admin)
  };"""

new_find_staff = """  const findTrackedStaff = (rawName?: string): string | null => {
    if (!rawName) return null;
    const cleanRaw = rawName.replace(/\\s*\\([^)]*\\)/g, '').trim();
    if (!cleanRaw) return null;
    const lower = cleanRaw.toLowerCase();

    for (const staff of allStaffNames) {
      const staffLower = staff.toLowerCase();
      // Strict match: must contain the exact name as a whole word or exact match
      if (lower === staffLower || lower.split(' ').includes(staffLower)) {
        return staff;
      }
    }

    return null;
  };"""

content = content.replace(old_find_staff, new_find_staff)

# Fix Transactions
old_trx_processing = """    // Process transactions (Sales POS)
    filteredTransactions.forEach(t => {
      const matchedStaff = findTrackedStaff(t.cashierName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      stats[matchedStaff].salesCount += 1;
      stats[matchedStaff].salesOmset += t.totalAmount;
      
      let trxProfit = 0;
      let hpUnits = 0;

      // Primary source of truth for transaction profit is t.totalProfit (matches LaporanTransaksi)
      if (typeof t.totalProfit === 'number' && !isNaN(t.totalProfit)) {
        trxProfit = t.totalProfit;
      } else if (t.items && t.items.length > 0) {
        t.items.forEach(item => {
          const selling = item.sellingPrice ?? (item as any).price ?? 0;
          const buy = item.buyPrice ?? 0;
          const repair = item.repairCost ?? 0;
          const qty = item.quantity ?? (item as any).qty ?? 1;
          trxProfit += (selling - (buy + repair)) * qty;
        });
      }

      if (t.items && t.items.length > 0) {
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
      }

      stats[matchedStaff].salesProfit += isNaN(trxProfit) ? 0 : trxProfit;
      stats[matchedStaff].hpUnitsSold += isNaN(hpUnits) ? 0 : hpUnits;
    });

    // Process services (Jasa Service)
    if (services && services.length > 0) {
      services.forEach(s => {
        if (!isDateInFilter(s.date)) return;
        const matchedStaff = findTrackedStaff(s.cashierName);
        if (!matchedStaff || !stats[matchedStaff]) return;

        if (s.status === 'selesai') {
          const srvProfit = Math.max(0, (s.cost || 0) - (s.capitalCost || 0));
          stats[matchedStaff].salesCount += 1;
          stats[matchedStaff].salesOmset += (s.cost || 0);
          stats[matchedStaff].salesProfit += srvProfit;
        }
      });
    }

    // Process products (Stock purchases)
    products.forEach(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      const isIphone = p.type === 'iphone';
      const cost = isIphone ? (p.buyPrice + (p.repairCost || 0)) : (p.buyPrice * (p.stock || 1));
      
      stats[matchedStaff].purchaseCount += 1;
      stats[matchedStaff].purchaseTotalRp += cost;
      
      if (isIphone) {
        stats[matchedStaff].purchaseUnitsHp += 1;
      }
    });"""

new_trx_processing = """    // Process transactions (Sales POS) - ONLY HP UNITS
    filteredTransactions.forEach(t => {
      const matchedStaff = findTrackedStaff(t.cashierName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      let hasHp = false;
      let hpOmset = 0;
      let hpProfit = 0;
      let hpUnits = 0;

      if (t.items && t.items.length > 0) {
        t.items.forEach(item => {
          const qty = Number(item.quantity ?? (item as any).qty ?? 1);
          const matchedProd = products.find(p => p.id === item.productId);
          const pType = (matchedProd ? matchedProd.type : undefined) ?? item.type ?? (item as any).productType;
          
          const modelName = (item.model || '').toLowerCase();
          const isPhoneModel = modelName.includes('iphone') || modelName.includes('samsung') || modelName.includes('oppo') || modelName.includes('vivo') || modelName.includes('xiaomi') || modelName.includes('realme') || modelName.includes('infinix') || modelName.includes('hp');
          
          if (pType === 'iphone' || (pType as string) === 'hp' || isPhoneModel) {
            hasHp = true;
            hpUnits += qty;
            const selling = item.sellingPrice ?? (item as any).price ?? 0;
            const buy = item.buyPrice ?? 0;
            const repair = item.repairCost ?? 0;
            
            hpOmset += (selling * qty);
            hpProfit += ((selling - (buy + repair)) * qty);
          }
        });
      }

      if (hasHp) {
        stats[matchedStaff].salesCount += 1;
        stats[matchedStaff].salesOmset += hpOmset;
        stats[matchedStaff].salesProfit += hpProfit;
        stats[matchedStaff].hpUnitsSold += hpUnits;
      }
    });

    // Process services (Jasa Service) - SKIPPED AS REQUESTED BY USER
    // User requested: "untuk target penjualan nya hanya unit hp saja tidak dengan aksesoris atau service"

    // Process products (Stock purchases) - ONLY HP UNITS
    products.forEach(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      const isIphone = p.type === 'iphone';
      // User requested only HP
      if (isIphone) {
        const cost = (p.buyPrice + (p.repairCost || 0));
        stats[matchedStaff].purchaseCount += 1;
        stats[matchedStaff].purchaseTotalRp += cost;
        stats[matchedStaff].purchaseUnitsHp += 1;
      }
    });"""

content = content.replace(old_trx_processing, new_trx_processing)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
