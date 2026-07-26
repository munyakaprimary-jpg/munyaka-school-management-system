// Original button:
<Button variant="outline" className="rounded-2xl border-slate-200">Export Ical</Button>
<Button className="rounded-2xl gap-2 bg-indigo-600 shadow-lg shadow-indigo-100">
  <Plus size={18} /> New Event
</Button>

// Modified with onClick:
<Button variant="outline" className="rounded-2xl border-slate-200" onClick={() => showSuccess('ICal exported!')}>
  Export Ical
</Button>
<Button className="rounded-2xl gap-2 bg-indigo-600 shadow-lg shadow-indigo-100" onClick={() => showSuccess('Event created!')}>
  <Plus size={18} /> New Event
</Button>