with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_btn = """                    {(activeRole === 'owner' || activeRole === 'admin') && (
                      <button
                        onClick={() => handleRemoveStaff(staffName)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Hapus Karyawan Ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}"""

content = content.replace(old_btn, '')

# Also remove handleRemoveStaff function completely to clean up
import re
content = re.sub(r'  // Handler: Remove Custom Staff\n  const handleRemoveStaff = \(staffName: string\) => \{.*?\n  \};\n', '', content, flags=re.DOTALL)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
