// Original button:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
  <UserPlus size={18} /> Add Staff Member
</Button>

// Modified with onClick:
<Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={() => showSuccess('Staff member added!')}>
  <UserPlus size={18} /> Add Staff Member
</Button>