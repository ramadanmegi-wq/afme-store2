import re

with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

# Replace the inner loop logic
old_logic = r"""          const modelName = \(item\.model \|\| ''\)\.toLowerCase\(\);
          const isAksesoris = pType === 'aksesoris' \|\| modelName\.includes\('case'\) \|\| modelName\.includes\('casing'\) \|\| modelName\.includes\('charger'\) \|\| modelName\.includes\('adaptor'\) \|\| modelName\.includes\('kabel'\) \|\| modelName\.includes\('tempered'\) \|\| modelName\.includes\('tg'\) \|\| modelName\.includes\('headset'\) \|\| modelName\.includes\('audio'\) \|\| modelName\.includes\('airpods'\);
          const isPhoneModel = modelName\.includes\('iphone'\) \|\| modelName\.includes\('samsung'\) \|\| modelName\.includes\('oppo'\) \|\| modelName\.includes\('vivo'\) \|\| modelName\.includes\('xiaomi'\) \|\| modelName\.includes\('realme'\) \|\| modelName\.includes\('infinix'\) \|\| modelName\.includes\('hp'\);
          
          const isHp = pType === 'iphone' \|\| pType === 'hp' \|\| \(isPhoneModel && !isAksesoris\);

          // ALWAYS calculate omset and profit for ALL items \(including accessories\)
          const selling = item\.sellingPrice \?\? \(item as any\)\.price \?\? 0;
          const buy = item\.buyPrice \?\? 0;
          const repair = item\.repairCost \?\? 0;
          
          hpOmset \+= \(selling \* qty\);
          trxProfit \+= \(selling - \(buy \+ repair\)\) \* qty;

          // ONLY calculate units for HP units, ignoring accessories and services
          if \(isHp && pType !== 'aksesoris'\) {
            hpUnits \+= qty;
          }"""

new_logic = """          const modelName = (item.model || '').toLowerCase();
          const accessoryKeywords = ['case', 'casing', 'charger', 'adaptor', 'kabel', 'tempered', 'tg', 'headset', 'audio', 'airpods', 'anti gores', 'pelindung', 'kaca', 'lcd', 'baterai', 'earphone', 'tws', 'speaker', 'strap', 'ring', 'lensa', 'kamera'];
          const isAksesoris = pType === 'aksesoris' || accessoryKeywords.some(kw => modelName.includes(kw));
          const isPhoneModel = modelName.includes('iphone') || modelName.includes('samsung') || modelName.includes('oppo') || modelName.includes('vivo') || modelName.includes('xiaomi') || modelName.includes('realme') || modelName.includes('infinix') || modelName.includes('hp');
          
          // STRICT check: If we don't have an explicit pType, we check keywords. We also assume anything under 500k is an accessory unless specified as iphone.
          const selling = item.sellingPrice ?? (item as any).price ?? 0;
          const buy = item.buyPrice ?? 0;
          const repair = item.repairCost ?? 0;
          const isCheap = selling > 0 && selling < 500000;
          
          let isHp = false;
          if (pType === 'iphone' || pType === 'hp') {
            isHp = true;
          } else if (pType !== 'aksesoris' && isPhoneModel && !isAksesoris && !isCheap) {
            isHp = true;
          }

          // AS PER USER REQUEST: "jadi penjualan aksesorisnya tidak ikut dalam target."
          // We completely ignore accessories for Omset, Profit, AND Units!
          if (isHp) {
            hpUnits += qty;
            hpOmset += (selling * qty);
            trxProfit += (selling - (buy + repair)) * qty;
          }"""

content = re.sub(old_logic, new_logic, content)

# Now fix the salesCount block
old_hp_units_block = r"""      // If the transaction has any omset, count it as a sale
      if \(hpOmset > 0 \|\| hpUnits > 0\) {
        stats\[matchedStaff\]\.salesCount \+= 1;
        stats\[matchedStaff\]\.salesOmset \+= hpOmset;
        stats\[matchedStaff\]\.salesProfit \+= isNaN\(trxProfit\) \? 0 : trxProfit;
        stats\[matchedStaff\]\.hpUnitsSold \+= isNaN\(hpUnits\) \? 0 : hpUnits;
      }"""

new_hp_units_block = """      if (hpUnits > 0) {
        stats[matchedStaff].salesCount += 1;
        stats[matchedStaff].salesOmset += hpOmset;
        stats[matchedStaff].salesProfit += isNaN(trxProfit) ? 0 : trxProfit;
        stats[matchedStaff].hpUnitsSold += isNaN(hpUnits) ? 0 : hpUnits;
      }"""

content = re.sub(old_hp_units_block, new_hp_units_block, content)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
print("Replaced logic with strict checks and completely ignored accessories")
