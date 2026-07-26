// Original buttons:
<Button variant="outline" className="rounded-2xl border-slate-200">
  Export CSV
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100">
  Add New Student
</Button>

// Modified with onClick:
<Button variant="outline" className="rounded-2xl border-slate-200" onClick={() => showSuccess('Student list exported!')}>
  Export CSV
</Button>
<Button className="rounded-2xl shadow-lg shadow-indigo-100" onClick={() => showSuccess('New student added!')}>
  Add New Student
</Button>