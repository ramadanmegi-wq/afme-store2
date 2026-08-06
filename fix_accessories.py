with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_logic = """          const pType = (matchedProd ? matchedProd.type : undefined) ?? item.type ?? (item as any).productType;
          
          const modelName = (item.model || '').toLowerCase();
          const isPhoneModel = modelName.includes('iphone') || modelName.includes('samsung') || modelName.includes('oppo') || modelName.includes('vivo') || modelName.includes('xiaomi') || modelName.includes('realme') || modelName.includes('infinix') || modelName.includes('hp');
          
          // Only calculate omset, profit, and units for HP units, ignoring accessories and services
          if (pType === 'iphone' || (pType as string) === 'hp' || isPhoneModel) {"""

new_logic = """          const pType = (matchedProd ? matchedProd.type : undefined) ?? item.type ?? (item as any).productType;
          
          const modelName = (item.model || '').toLowerCase();
          const isAksesoris = pType === 'aksesoris' || modelName.includes('case') || modelName.includes('casing') || modelName.includes('charger') || modelName.includes('adaptor') || modelName.includes('kabel') || modelName.includes('tempered') || modelName.includes('tg') || modelName.includes('headset') || modelName.includes('audio') || modelName.includes('airpods');
          const isPhoneModel = modelName.includes('iphone') || modelName.includes('samsung') || modelName.includes('oppo') || modelName.includes('vivo') || modelName.includes('xiaomi') || modelName.includes('realme') || modelName.includes('infinix') || modelName.includes('hp');
          
          const isHp = (pType === 'iphone' || pType === 'hp' || (isPhoneModel && !isAksesoris)) && pType !== 'aksesoris';

          // Only calculate omset, profit, and units for HP units, ignoring accessories and services
          if (isHp) {"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('src/components/TrackingKaryawan.tsx', 'w') as f:
        f.write(content)
    print("Fixed accessories bug in sales")
else:
    print("Could not find old logic in sales")
