// Original buttons:
<Button variant="outline" className="rounded-2xl border-slate-200 gap-2">
  <History size={18} /> Logs
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 gap-2">
  <Send size={18} /> Compose
</Button>

// Modified with onClick:
<Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Logs loaded!')}>
  <History size={18} /> Logs
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 gap-2" onClick={() => showSuccess('Message composed!')}>
  <Send size={18} /> Compose
</Button>