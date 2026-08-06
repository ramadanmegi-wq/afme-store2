import re

with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

# Replace the buy and repair assignments to fallback to matchedProd
old_buy_repair = r"""          const selling = item\.sellingPrice \?\? \(item as any\)\.price \?\? 0;
          const buy = item\.buyPrice \?\? 0;
          const repair = item\.repairCost \?\? 0;"""

new_buy_repair = """          const selling = item.sellingPrice ?? (item as any).price ?? 0;
          const buy = item.buyPrice || (matchedProd ? matchedProd.buyPrice : 0);
          const repair = item.repairCost || (matchedProd ? matchedProd.repairCost : 0);"""

content = re.sub(old_buy_repair, new_buy_repair, content)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)

print("Updated buy and repair calculations to fallback to matchedProd")
