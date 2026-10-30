import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ClipboardList, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  Box, 
  Wrench,
  X
} from 'lucide-react';

export default function ScienceLab() {
  const [labStock, setLabStock] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'loans' | 'checklists' | 'damage'>('inventory');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Chemicals',
    quantity: 1,
    unit: 'Pieces',
    storageLocation: '',
    hazardLevel: 'Safe',
    condition: 'Good'
  });

  // Loans state
  const [loans, setLoans] = useState<any[]>([
    { id: 'l1', teacherName: 'Mr. Ouma', item: 'Microscopes (Compound)', qty: 4, date: '2025-05-10', status: 'Active' },
    { id: 'l2', teacherName: 'Madam Achieng', item: 'Hydrochloric Acid (Dilute 1M)', qty: 1, date: '2025-05-09', status: 'Returned' }
  ]);

  // Checklists state
  const [checklists, setChecklists] = useState<any[]>([
    { id: 'c1', grade: 'Grade 7', topic: 'Separating Mixtures (Filtration)', items: ['Funnel', 'Filter Paper', 'Beakers', 'Glass Rod'], status: 'Ready' },
    { id: 'c2', grade: 'Grade 8', topic: 'Photosynthesis Test (Starch in Leaves)', items: ['Ethanol', 'Bunsen Burner', 'White Tile', 'Iodine Solution'], status: 'Pending Reagents' },
    { id: 'c3', grade: 'Grade 9', topic: 'Ohm’s Law & Circuit Verification', items: ['Ammeters', 'Voltmeters', 'Connecting Wires', 'Dry Cells'], status: 'Ready' }
  ]);

  useEffect(() => {
    const raw = localStorage.getItem('munyaka_science_lab_inventory');
    if (raw) {
      try {
        setLabStock(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialSeed = [
        { id: '1', name: 'Microscopes (Compound)', category: 'Apparatus', quantity: 12, unit: 'Pieces', storageLocation: 'Cabinet B1', hazardLevel: 'Safe', condition: 'Good' },
        { id: '2', name: 'Hydrochloric Acid (Dilute 1M)', category: 'Chemicals', quantity: 5, unit: 'Liters', storageLocation: 'Chemical Acid Cupboard', hazardLevel: 'Hazardous', condition: 'Good' },
        { id: '3', name: 'Beakers 250ml (Pyrex)', category: 'Glassware', quantity: 45, unit: 'Pieces', storageLocation: 'Shelf A3', hazardLevel: 'Safe', condition: 'Good' },
        { id: '4', name: 'Bunsen Burners', category: 'Apparatus', quantity: 15, unit: 'Pieces', storageLocation: 'Gas Lab Desk 1', hazardLevel: 'Caution', condition: 'Good' },
        { id: '5', name: 'Prepared Onion Cell Slides', category: 'Specimens', quantity: 30, unit: 'Sets', storageLocation: 'Slide Rack 2', hazardLevel: 'Safe', condition: 'Good' },
        { id: '6', name: 'Sodium Hydroxide Pellets', category: 'Chemicals', quantity: 2, unit: 'Bottles', storageLocation: 'Chemical Cabinet C', hazardLevel: 'Hazardous', condition: 'Good' }
      ];
      localStorage.setItem('munyaka_science_lab_inventory', JSON.stringify(initialSeed));
      setLabStock(initialSeed);
    }
  }, []);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      ...formData,
      quantity: Number(formData.quantity)
    };

    const updated = [newItem, ...labStock];
    setLabStock(updated);
    localStorage.setItem('munyaka_science_lab_inventory', JSON.stringify(updated));
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      category: 'Chemicals',
      quantity: 1,
      unit: 'Pieces',
      storageLocation: '',
      hazardLevel: 'Safe',
      condition: 'Good'
    });
  };

  const handleDeleteItem = (id: string) => {
    const updated = labStock.filter(item => item.id !== id);
    setLabStock(updated);
    localStorage.setItem('munyaka_science_lab_inventory', JSON.stringify(updated));
  };

  const filteredStock = labStock.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.storageLocation && item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <FlaskConical size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">Science Lab & Equipment Management</h1>
            <p className="text-sm text-slate-400">Track laboratory apparatus, chemical reagents, biological specimens & CBC practical kits.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Add New Asset / Chemical
          </button>
        </div>
      </div>

      {/* Analytics Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Inventory Items</p>
          <h3 className="text-3xl font-black text-white mt-1">{labStock.length} <span className="text-sm font-normal text-slate-400">Entries</span></h3>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chemical Reagents</p>
          <h3 className="text-3xl font-black text-amber-400 mt-1">
            {labStock.filter(i => i.category === 'Chemicals').length} <span className="text-sm font-normal text-slate-400">Stocks</span>
          </h3>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Apparatus & Glassware</p>
          <h3 className="text-3xl font-black text-emerald-400 mt-1">
            {labStock.filter(i => i.category === 'Apparatus' || i.category === 'Glassware').length} <span className="text-sm font-normal text-slate-400">Items</span>
          </h3>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hazardous / Caution</p>
          <h3 className="text-3xl font-black text-rose-400 mt-1">
            {labStock.filter(i => i.hazardLevel === 'Hazardous' || i.hazardLevel === 'Caution').length} <span className="text-sm font-normal text-slate-400">Strict</span>
          </h3>
        </div>
      </div>

      {/* Sub-Workstation Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'inventory' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box size={18} /> Master Lab Inventory
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'loans' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList size={18} /> Quick Issue & Loans
        </button>
        <button
          onClick={() => setActiveTab('checklists')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'checklists' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={18} /> Practical Kits & CBC Checklists
        </button>
      </div>

      {/* Tab 1: Master Inventory */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search equipment, chemicals, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['All', 'Chemicals', 'Apparatus', 'Glassware', 'Specimens'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === cat 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <th className="p-4">Asset / Reagent Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Storage Location</th>
                    <th className="p-4">Hazard Level</th>
                    <th className="p-4">Condition</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No science lab items found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                            <FlaskConical size={18} />
                          </div>
                          <span>{item.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-200">
                          {item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </td>
                        <td className="p-4 text-slate-300 text-xs">
                          {item.storageLocation || 'Unassigned'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                            item.hazardLevel === 'Hazardous' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : item.hazardLevel === 'Caution'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {item.hazardLevel === 'Hazardous' && <ShieldAlert size={12} />}
                            {item.hazardLevel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={14} /> {item.condition}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Delete Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Quick Issue & Loans */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Active Practical Loan Ledger</h3>
              <p className="text-xs text-slate-400">Track equipment and chemical batches issued out to science teachers for laboratory lessons.</p>
            </div>
            <button 
              onClick={() => alert('New practical loan request logged successfully.')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              + Issue Equipment for Practical
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4">Teacher Name</th>
                  <th className="p-4">Apparatus / Chemical</th>
                  <th className="p-4">Quantity Issued</th>
                  <th className="p-4">Date Issued</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {loans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-white">{loan.teacherName}</td>
                    <td className="p-4 text-slate-300">{loan.item}</td>
                    <td className="p-4 font-semibold text-emerald-400">{loan.qty}</td>
                    <td className="p-4 text-slate-400 text-xs">{loan.date}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        loan.status === 'Active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => {
                          setLoans(loans.map(l => l.id === loan.id ? { ...l, status: 'Returned' } : l));
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-semibold"
                      >
                        {loan.status === 'Active' ? 'Mark Returned' : 'Archived'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Practical Kits & CBC Checklists */}
      {activeTab === 'checklists' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {checklists.map(kit => (
            <div key={kit.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {kit.grade}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${kit.status === 'Ready' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {kit.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{kit.topic}</h3>
                <p className="text-xs text-slate-400 mb-4 font-medium uppercase tracking-wider">Required Kit Reagents & Apparatus:</p>
                <ul className="space-y-2 mb-6">
                  {kit.items.map((i: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-200 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => alert(`Pre-flight checklist verified for ${kit.topic}`)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                Verify & Allocate Kit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-black text-white mb-1">Add Science Lab Asset</h2>
            <p className="text-xs text-slate-400 mb-6">Register a new chemical, apparatus, glassware, or biological specimen.</p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item / Reagent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper (II) Sulphate Crystals"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Chemicals">Chemicals</option>
                    <option value="Apparatus">Apparatus</option>
                    <option value="Glassware">Glassware</option>
                    <option value="Specimens">Specimens</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hazard Level</label>
                  <select
                    value={formData.hazardLevel}
                    onChange={(e) => setFormData({ ...formData, hazardLevel: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Safe">Safe</option>
                    <option value="Caution">Caution</option>
                    <option value="Hazardous">Hazardous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="Pieces, Liters, Bottles"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Cabinet A2, Shelf 3"
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
