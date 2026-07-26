// Original button:
<Button size="lg" className="rounded-xl px-12 shadow-lg shadow-primary/20">
  Save Register
</Button>

// Modified with onClick:
<Button size="lg" className="rounded-xl px-12 shadow-lg shadow-primary/20" onClick={() => showSuccess('Attendance saved successfully!')}>
  Save Register
</Button>