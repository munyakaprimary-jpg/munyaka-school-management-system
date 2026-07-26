// Original button:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
  <Plus size={18} /> Post New Notice
</Button>

// Modified with onClick:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={() => showSuccess('Notice posted!')}>
  <Plus size={18} /> Post New Notice
</Button>