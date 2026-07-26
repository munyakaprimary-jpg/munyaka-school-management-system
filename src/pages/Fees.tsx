// Original buttons:
<Button variant="outline" className="rounded-2xl gap-2 border-slate-200">
  <Download size={18} /> Export Reports
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100">
  Record M-Pesa
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100">
  Invoice Class
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100">
  Fee Statements
</Button>

// Modified with onClick:
<Button variant="outline" className="rounded-2xl gap-2 border-slate-200" onClick={() => showSuccess('Report exported!')}>
  <Download size={18} /> Export Reports
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100" onClick={() => showSuccess('M-Pesa recorded!')}>
  Record M-Pesa
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100" onClick={() => showSuccess('Class invoiced!')}>
  Invoice Class
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100" onClick={() => showSuccess('Statements generated!')}>
  Fee Statements
</Button>