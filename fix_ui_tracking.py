with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

# Fix salesLogsFiltered
old_sales_log = """  const salesLogsFiltered = useMemo(() => {
    return filteredTransactions.filter(t => {
      const matched = findTrackedStaff(t.cashierName);
      const matchStaff = selectedStaffFilter === 'all' || matched === selectedStaffFilter || (t.cashierName && t.cashierName.includes(selectedStaffFilter));
      const matchSearch = (t.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (t.cashierName && t.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [filteredTransactions, selectedStaffFilter, searchTerm]);"""

new_sales_log = """  const salesLogsFiltered = useMemo(() => {
    return filteredTransactions.filter(t => {
      const matched = findTrackedStaff(t.cashierName);
      if (!matched) return false; // Strictly include only purchases assigned to tracked staff (Aldi, Friya, etc.)
      const matchStaff = selectedStaffFilter === 'all' || matched === selectedStaffFilter;
      const matchSearch = (t.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (t.cashierName && t.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStaff && matchSearch;
    });
  }, [filteredTransactions, selectedStaffFilter, searchTerm]);"""

content = content.replace(old_sales_log, new_sales_log)

# Fix overall totals
old_overall = """  // Overall totals
  const overallTotals = useMemo(() => {
    let totalOmset = 0;
    let totalProfit = 0;
    let totalBelanjaHpRp = 0;
    let totalBelanjaHpUnits = 0;

    (Object.values(staffStatsMap) as StaffStatItem[]).forEach(st => {
      totalOmset += st.salesOmset;
      totalProfit += st.salesProfit;
      totalBelanjaHpRp += st.purchaseTotalRp;
      totalBelanjaHpUnits += st.purchaseUnitsHp;
    });

    return { totalOmset, totalProfit, totalBelanjaHpRp, totalBelanjaHpUnits };
  }, [staffStatsMap]);"""

new_overall = """  // Overall totals
  const overallTotals = useMemo(() => {
    let totalOmset = 0;
    let totalProfit = 0;
    let totalBelanjaHpRp = 0;
    let totalBelanjaHpUnits = 0;
    let totalSalesCount = 0;

    (Object.values(staffStatsMap) as StaffStatItem[]).forEach(st => {
      totalOmset += st.salesOmset;
      totalProfit += st.salesProfit;
      totalBelanjaHpRp += st.purchaseTotalRp;
      totalBelanjaHpUnits += st.purchaseUnitsHp;
      totalSalesCount += st.salesCount;
    });

    return { totalOmset, totalProfit, totalBelanjaHpRp, totalBelanjaHpUnits, totalSalesCount };
  }, [staffStatsMap]);"""

content = content.replace(old_overall, new_overall)

# Fix rendering of totals
old_total_render = """        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TOTAL TRANSAKSI KASIR</span>
          <p className="text-2xl font-black font-mono text-slate-900">{filteredTransactions.length} <span className="text-xs font-sans text-slate-500 font-normal">Nota</span></p>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            Pencapaian transaksi seluruh staf
          </p>
        </div>"""

new_total_render = """        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TOTAL TRANSAKSI KASIR</span>
          <p className="text-2xl font-black font-mono text-slate-900">{overallTotals.totalSalesCount} <span className="text-xs font-sans text-slate-500 font-normal">Nota</span></p>
          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            Pencapaian transaksi staf terdaftar
          </p>
        </div>"""

content = content.replace(old_total_render, new_total_render)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
