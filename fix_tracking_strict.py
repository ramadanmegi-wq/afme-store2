with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_logic = """  const allStaffNames = useMemo(() => {
    const defaultList = ['Aldi', 'Friya'];
    const namesSet = new Set<string>();

    defaultList.forEach(n => namesSet.add(n));
    customStaff.forEach(n => {
      const trimmed = n.trim();
      if (trimmed) namesSet.add(trimmed);
    });

    return Array.from(namesSet);
  }, [customStaff]);"""

new_logic = """  const allStaffNames = useMemo(() => {
    return ['Aldi', 'Friya'];
  }, []);"""

content = content.replace(old_logic, new_logic)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
