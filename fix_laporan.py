import re

files_to_fix = ['src/components/TrackingKaryawan.tsx', 'src/components/LaporanTransaksi.tsx']

for filepath in files_to_fix:
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the generic t.items.forEach calculation loop that lacks matchedProd
    old_loop = r"""                      const selling = i\.sellingPrice \?\? \(i as any\)\.price \?\? 0;
                      const buy = i\.buyPrice \?\? 0;
                      const repair = i\.repairCost \?\? 0;
                      const qty = i\.quantity \?\? \(i as any\)\.qty \?\? 1;"""

    new_loop = """                      const matchedProd = products.find(p => p.id === i.productId);
                      const selling = i.sellingPrice ?? (i as any).price ?? 0;
                      const buy = i.buyPrice || (matchedProd ? matchedProd.buyPrice : 0);
                      const repair = i.repairCost || (matchedProd ? matchedProd.repairCost : 0);
                      const qty = i.quantity ?? (i as any).qty ?? 1;"""

    if "i.buyPrice ?? 0" in content:
        content = re.sub(old_loop, new_loop, content)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed loop in {filepath}")

