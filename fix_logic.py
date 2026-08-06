with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_logic = """          const isHp = (pType === 'iphone' || pType === 'hp' || (isPhoneModel && !isAksesoris)) && pType !== 'aksesoris';

          // Only calculate omset, profit, and units for HP units, ignoring accessories and services
          if (isHp) {
            hpUnits += qty;
            const selling = item.sellingPrice ?? (item as any).price ?? 0;
            const buy = item.buyPrice ?? 0;
            const repair = item.repairCost ?? 0;
            
            hpOmset += (selling * qty);
            trxProfit += (selling - (buy + repair)) * qty;
          }"""

new_logic = """          const isHp = pType === 'iphone' || pType === 'hp' || (isPhoneModel && !isAksesoris);

          // ALWAYS calculate omset and profit for ALL items (including accessories)
          const selling = item.sellingPrice ?? (item as any).price ?? 0;
          const buy = item.buyPrice ?? 0;
          const repair = item.repairCost ?? 0;
          
          hpOmset += (selling * qty);
          trxProfit += (selling - (buy + repair)) * qty;

          // ONLY calculate units for HP units, ignoring accessories and services
          if (isHp && pType !== 'aksesoris') {
            hpUnits += qty;
          }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    
    # Also fix the if (hpUnits > 0) block because now we want to count transactions even if they only have accessories
    old_hp_units_block = """      if (hpUnits > 0) {
        stats[matchedStaff].salesCount += 1;
        stats[matchedStaff].salesOmset += hpOmset;
        stats[matchedStaff].salesProfit += isNaN(trxProfit) ? 0 : trxProfit;
        stats[matchedStaff].hpUnitsSold += isNaN(hpUnits) ? 0 : hpUnits;
      }"""
      
    new_hp_units_block = """      // If the transaction has any omset, count it as a sale
      if (hpOmset > 0 || hpUnits > 0) {
        stats[matchedStaff].salesCount += 1;
        stats[matchedStaff].salesOmset += hpOmset;
        stats[matchedStaff].salesProfit += isNaN(trxProfit) ? 0 : trxProfit;
        stats[matchedStaff].hpUnitsSold += isNaN(hpUnits) ? 0 : hpUnits;
      }"""
      
    content = content.replace(old_hp_units_block, new_hp_units_block)
    
    with open('src/components/TrackingKaryawan.tsx', 'w') as f:
        f.write(content)
    print("Fixed logic successfully")
else:
    print("Old logic not found")
