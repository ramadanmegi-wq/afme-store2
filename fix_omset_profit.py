import re

with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_logic = r"""          // AS PER USER REQUEST: "jadi penjualan aksesorisnya tidak ikut dalam target."
          // We completely ignore accessories for Omset, Profit, AND Units!
          if \(isHp\) {
            hpUnits \+= qty;
            hpOmset \+= \(selling \* qty\);
            trxProfit \+= \(selling - \(buy \+ repair\)\) \* qty;
          }"""

new_logic = """          // ALWAYS calculate omset and profit for ALL items (including accessories)
          hpOmset += (selling * qty);
          trxProfit += (selling - (buy + repair)) * qty;

          // ONLY calculate units for HP units, ignoring accessories and services
          if (isHp) {
            hpUnits += qty;
          }"""

if "We completely ignore accessories" in content:
    content = re.sub(old_logic, new_logic, content)
    with open('src/components/TrackingKaryawan.tsx', 'w') as f:
        f.write(content)
    print("Fixed Omset and Profit to include all items")
else:
    print("Old logic not found")
