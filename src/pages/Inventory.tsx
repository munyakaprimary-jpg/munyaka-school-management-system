// Original buttons:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700">
  <Package size={18} /> Add New Asset
</Button>
<Button variant="outline" className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2 text-slate-600 font-bold">
  <RefreshCw size={18} /> Sync Inventory
</Button>

// Modified with onClick:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700" onClick={() => showSuccess('Asset added!')}>
  <Package size={18} /> Add New Asset
</Button>
<Button variant="outline" className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2 text-slate-600 font-bold" onClick={() => showSuccess('Inventory synced!')}>
  <RefreshCw size={18} /> Sync Inventory
</Button>