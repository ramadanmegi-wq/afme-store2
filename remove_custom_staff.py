with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    lines = f.readlines()

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    for line in lines:
        if 'const [customStaff, setCustomStaff] = useState' in line:
            continue
        if 'const updatedCustom = [...customStaff, formattedName];' in line:
            continue
        if 'setCustomStaff(updatedCustom);' in line:
            continue
        if 'localStorage.setItem(\'afme_custom_staff\'' in line:
            continue
        if 'const updated = customStaff.filter' in line:
            continue
        if 'setCustomStaff(updated);' in line:
            continue
        f.write(line)
