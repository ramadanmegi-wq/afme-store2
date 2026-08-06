with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

import re

# We will completely rewrite the staffStatsMap calculation inside TrackingKaryawan.tsx
old_calc = """    // Process transactions (Sales POS)
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
      
      // Include BOTH iPhone (1 unit) and accessories (N units based on stock)
      stats[matchedStaff].purchaseUnitsHp += isIphone ? 1 : (p.stock || 1);
    });"""

new_calc = """    // Process transactions (Sales POS)
    filteredTransactions.forEach(t => {
      const matchedStaff = findTrackedStaff(t.cashierName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      let trxProfit = 0;
      let hpUnits = 0;
      let hpOmset = 0;

      if (t.items && t.items.length > 0) {
        t.items.forEach(item => {
          const qty = Number(item.quantity ?? (item as any).qty ?? 1);
          const matchedProd = products.find(p => p.id === item.productId);
          const pType = (matchedProd ? matchedProd.type : undefined) ?? item.type ?? (item as any).productType;
          
          const modelName = (item.model || '').toLowerCase();
          const isPhoneModel = modelName.includes('iphone') || modelName.includes('samsung') || modelName.includes('oppo') || modelName.includes('vivo') || modelName.includes('xiaomi') || modelName.includes('realme') || modelName.includes('infinix') || modelName.includes('hp');
          
          // Only calculate omset, profit, and units for HP units, ignoring accessories and services
          if (pType === 'iphone' || (pType as string) === 'hp' || isPhoneModel) {
            hpUnits += qty;
            const selling = item.sellingPrice ?? (item as any).price ?? 0;
            const buy = item.buyPrice ?? 0;
            const repair = item.repairCost ?? 0;
            
            hpOmset += (selling * qty);
            trxProfit += (selling - (buy + repair)) * qty;
          }
        });
      }

      if (hpUnits > 0) {
        stats[matchedStaff].salesCount += 1;
        stats[matchedStaff].salesOmset += hpOmset;
        stats[matchedStaff].salesProfit += isNaN(trxProfit) ? 0 : trxProfit;
        stats[matchedStaff].hpUnitsSold += isNaN(hpUnits) ? 0 : hpUnits;
      }
    });

    // Process products (Stock purchases)
    products.forEach(p => {
      const pDate = (p as any).createdAt || (p as any).date;
      if (pDate && !isDateInFilter(pDate)) return;

      const matchedStaff = findTrackedStaff(p.purchaserName);
      if (!matchedStaff || !stats[matchedStaff]) return;

      const isIphone = p.type === 'iphone';
      
      // ONLY include HP for purchases as well, ignoring aksesoris
      if (isIphone) {
        const cost = p.buyPrice + (p.repairCost || 0);
        stats[matchedStaff].purchaseCount += 1;
        stats[matchedStaff].purchaseTotalRp += cost;
        stats[matchedStaff].purchaseUnitsHp += 1;
      }
    });"""

if old_calc in content:
    content = content.replace(old_calc, new_calc)
    with open('src/components/TrackingKaryawan.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Failed to replace")
