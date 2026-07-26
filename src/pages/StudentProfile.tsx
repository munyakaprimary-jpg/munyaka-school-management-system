// Original button:
<Button className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
  Record Payment
</Button>

// Modified with onClick:
<Button className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => showSuccess('Payment recorded!')}>
  Record Payment
</Button>