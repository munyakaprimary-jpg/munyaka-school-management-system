// Original buttons:
<Button variant="ghost" size="sm" className="text-indigo-600 font-bold"> Edit Load </Button>
<Button className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl"> Reset Credentials </Button>

// Modified with onClick:
<Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => showSuccess('Load edited!')}> Edit Load </Button>
<Button className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl" onClick={() => showSuccess('Credentials reset!')}> Reset Credentials </Button>