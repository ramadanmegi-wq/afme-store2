with open('src/components/TrackingKaryawan.tsx', 'r') as f:
    content = f.read()

old_btn = """            {(activeRole === 'owner' || activeRole === 'admin') && (
              <button
                onClick={() => setIsAddStaffModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/15 transition cursor-pointer"
              >
                <UserPlus size={14} />
                <span>+ Tambah Karyawan Baru</span>
              </button>
            )}"""

new_btn = """            {/* Add staff button removed as requested (only Aldi and Friya) */}"""

content = content.replace(old_btn, new_btn)

with open('src/components/TrackingKaryawan.tsx', 'w') as f:
    f.write(content)
