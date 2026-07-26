// Original buttons:
<Button variant="outline" className="rounded-xl"><Printer size={18} className="mr-2" /> Print</Button>
<Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"><Calendar size={18} className="mr-2" /> Current Week</Button>

// Modified with onClick:
<Button variant="outline" className="rounded-xl" onClick={() => showSuccess('Schedule printed!')}>
  <Printer size={18} className="mr-2" /> Print
</Button>
<Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100" onClick={() => showSuccess('Week updated!')}>
  <Calendar size={18} className="mr-2" /> Current Week
</Button>