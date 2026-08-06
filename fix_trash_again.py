with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

import re
content = re.sub(r'                    \{isCustom && \(activeRole === \'owner\' \|\| activeRole === \'admin\'\) && \(\s*<button\s*onClick=\{\(\) => handleRemoveStaff\(staffName\)\}\s*className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"\s*title="Hapus Karyawan Ini"\s*>\s*<Trash2 size=\{14\} />\s*</button>\s*\)\}', '', content)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
