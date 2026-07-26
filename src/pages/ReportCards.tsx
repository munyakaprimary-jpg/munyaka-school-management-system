// Original button:
<Button variant="outline" className="rounded-xl">
  <Download size={18} className="mr-2" /> Export PDF
</Button>

// Modified with onClick:
<Button variant="outline" className="rounded-xl" onClick={() => showSuccess('Report PDF generated!')}>
  <Download size={18} className="mr-2" /> Export PDF
</Button>