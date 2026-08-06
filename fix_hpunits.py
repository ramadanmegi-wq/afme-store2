import re

with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_hp_units_block = r"""      if \(hpUnits > 0\) {
        stats\[matchedStaff\]\.salesCount \+= 1;
        stats\[matchedStaff\]\.salesOmset \+= hpOmset;
        stats\[matchedStaff\]\.salesProfit \+= isNaN\(trxProfit\) \? 0 : trxProfit;
        stats\[matchedStaff\]\.hpUnitsSold \+= isNaN\(hpUnits\) \? 0 : hpUnits;
      }"""

new_hp_units_block = """      // If the transaction has any omset, count it as a sale
      if (hpOmset > 0 || hpUnits > 0) {
        stats[matchedStaff].salesCount += 1;
        stats[matchedStaff].salesOmset += hpOmset;
        stats[matchedStaff].salesProfit += isNaN(trxProfit) ? 0 : trxProfit;
        stats[matchedStaff].hpUnitsSold += isNaN(hpUnits) ? 0 : hpUnits;
      }"""

content = re.sub(old_hp_units_block, new_hp_units_block, content)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)

print("Replaced hpUnits block successfully")
