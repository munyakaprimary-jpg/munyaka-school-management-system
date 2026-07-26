// Original buttons:
<Button size="sm" variant="ghost" className="text-indigo-600 rounded-xl font-bold">
  <Plus size={16} className="mr-1" /> Add New
</Button>
<Button size="sm" variant="ghost" className="text-emerald-600 rounded-xl font-bold">
  <Plus size={16} className="mr-1" /> Add Stream
</Button>
<Button className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
  Apply All Changes
</Button>

// Modified with onClick:
<Button size="sm" variant="ghost" className="text-indigo-600 rounded-xl font-bold" onClick={() => showSuccess('New learning area added!')}>
  <Plus size={16} className="mr-1" /> Add New
</Button>
<Button size="sm" variant="ghost" className="text-emerald-600 rounded-xl font-bold" onClick={() => showSuccess('New stream created!')}>
  <Plus size={16} className="mr-1" /> Add Stream
</Button>
<Button className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={() => showSuccess('Settings applied!')}>
  Apply All Changes
</Button>