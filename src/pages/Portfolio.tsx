// Original button:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-primary/20">
  <Plus size={18} /> Upload Artifact
</Button>

// Modified with onClick:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-primary/20" onClick={() => showSuccess('Artifact uploaded!')}>
  <Plus size={18} /> Upload Artifact
</Button>