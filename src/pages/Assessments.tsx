// Original button:
<Button size="lg" className="rounded-xl px-12">Submit Marks</Button>

// Modified with onClick:
<Button size="lg" className="rounded-xl px-12" onClick={() => showSuccess('Marks submitted successfully!')}>
  Submit Marks
</Button>