import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
  category: string;
  studentId?: string;
  grade?: string;
}

interface TermData {
  term: string;
  label: string;
  amount: number;
}

// Academic term month ranges
const TERM_CONFIG = {
  'Term 1 (Jan-Mar)': { months: [1, 2, 3], order: 1 },
  'Term 2 (May-Jul)': { months: [5, 6, 7], order: 2 },
  'Term 3 (Sep-Nov)': { months: [9, 10, 11], order: 3 },
};

const ACADEMIC_YEARS = ['2026', '2025', '2024'];

// Parse date string "M/DD/YYYY" or "MM/DD/YYYY" or "YYYY-MM-DD"
const parseDate = (dateStr: string): { month: number; year: number } => {
  if (!dateStr) return { month: 0, year: 0 };
  
  // Handle YYYY-MM-DD format
  if (dateStr.includes('-') && dateStr.length === 10) {
    const parts = dateStr.split('-');
    return { month: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
  }
  
  // Handle M/D/YYYY or MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return { month: parseInt(parts[0], 10), year: parseInt(parts[2], 10) };
  }
  
  return { month: 0, year: 0 };
};

// Format KES currency
const formatKES = (amount: number): string => {
  return `KES ${amount.toLocaleString('en-KE')}`;
};

// Custom tooltip for fee payments
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: TermData;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 min-w-[160px]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          {data.payload.term}
        </p>
        <p className="text-2xl font-black text-emerald-600">
          {formatKES(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

// Custom bar shape with rounded top corners
const RoundedBar: React.FC<any> = (props) => {
  const { x, y, width, height, fill } = props;
  
  if (height <= 0) return null;
  
  const radius = 8;
  
  return (
    <g>
      <path
        d={`
          M ${x},${y + height}
          L ${x},${y + radius}
          Q ${x},${y} ${x + radius},${y}
          L ${x + width - radius},${y}
          Q ${x + width},${y} ${x + width},${y + radius}
          L ${x + width},${y + height}
          Z
        `}
        fill={fill}
      />
    </g>
  );
};

// Role check - fee charts visible to admin, owner, bursar
const canViewFeeData = (role?: string): boolean => {
  if (!role) return false;
  return ['admin', 'owner', 'bursar'].includes(role);
};

const FeePaymentsTrendChart: React.FC = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Read transactions from localStorage
  const transactions = useMemo((): Transaction[] => {
    try {
      const raw = localStorage.getItem('munyaka_transactions');
      if (!raw) return [];
      return JSON.parse(raw) as Transaction[];
    } catch {
      return [];
    }
  }, []);

  // Generate empty data when no real transactions exist for the year.
  // All KES values have been removed — the chart shows real data only.
  const generateEmptyDataForYear = (_year: string): Transaction[] => {
    return [];
  };

  // Aggregate transactions by term for selected year
  const termData = useMemo((): TermData[] => {
    // Get transactions for the selected year
    let yearTransactions = transactions.filter(tx => {
      const { year } = parseDate(tx.date);
      return year === parseInt(selectedYear, 10);
    });

    // If no real data for this year, show empty state (no mock data).
    if (yearTransactions.length === 0) {
      yearTransactions = generateEmptyDataForYear(selectedYear);
    }

    // Aggregate by term
    const aggregated: Record<string, number> = {
      'Term 1 (Jan-Mar)': 0,
      'Term 2 (May-Jul)': 0,
      'Term 3 (Sep-Nov)': 0,
    };

    yearTransactions.forEach(tx => {
      const { month } = parseDate(tx.date);
      
      for (const [termName, config] of Object.entries(TERM_CONFIG)) {
        if (config.months.includes(month)) {
          aggregated[termName] += tx.amount;
          break;
        }
      }
    });

    // Convert to array format for chart
    const result: TermData[] = Object.entries(TERM_CONFIG)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([term]) => ({
        term,
        label: term,
        amount: aggregated[term] || 0,
      }));

    return result;
  }, [transactions, selectedYear]);

  // Calculate totals for footer
  const totalCollected = useMemo(() => {
    return termData.reduce((sum, d) => sum + d.amount, 0);
  }, [termData]);

  const highestTerm = useMemo(() => {
    return termData.reduce((max, d) => (d.amount > max.amount ? d : max), termData[0]);
  }, [termData]);

  // Don't render for unauthorized roles
  if (!canViewFeeData(user?.role)) {
    return null;
  }

  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#0F172A] leading-tight">
              Termly Fee Collections
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              Fee collection totals grouped by academic terms — live from payment records
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 shrink-0">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
        </div>

        {/* Year Selector Dropdown */}
        <div className="mb-4 flex justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
                "focus:outline-none focus:ring-2 focus:ring-emerald-300"
              )}
            >
              <span>Academic Year</span>
              <span className="font-black text-emerald-600">{selectedYear}</span>
              <ChevronDown 
                size={14} 
                className={cn("text-slate-400 transition-transform", isDropdownOpen && "rotate-180")} 
              />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10">
                {ACADEMIC_YEARS.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      selectedYear === year
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Academic Year {year}
                    {year === '2026' && (
                      <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart Container — empty state when no real data for the year */}
        <div className="h-[280px] w-full">
          {termData.every(t => t.amount === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <TrendingUp size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-bold text-slate-500">
                No fee collection data for {selectedYear}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Fee records will appear here once payments are recorded.
              </p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={termData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={80}
            >
              {/* Horizontal dashed grid lines */}
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#E2E8F0"
                strokeWidth={1}
              />
              
              {/* X-Axis */}
              <XAxis
                dataKey="term"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: '#94A3B8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
                dy={10}
                tickFormatter={(value) => value.split(' ')[0] + ' ' + value.split(' ')[1]}
              />
              
              {/* Y-Axis */}
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: '#94A3B8',
                  fontSize: 11,
                  fontWeight: 500,
                }}
                tickCount={5}
                dy={0}
                tickFormatter={(value) => {
                  if (value >= 1000) return `KES ${(value / 1000).toFixed(0)}K`;
                  return `KES ${value}`;
                }}
              />
              
              {/* Custom Tooltip */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: '#F1F5F9',
                  radius: 8,
                }}
              />
              
              {/* Bar with rounded top corners */}
              <Bar
                dataKey="amount"
                shape={<RoundedBar />}
                maxBarSize={100}
              >
                {termData.map((entry, index) => {
                  const isHighest = entry.term === highestTerm?.term && entry.amount > 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isHighest ? '#10B981' : '#86EFAC'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Footer stats — hidden when no real data for the year */}
        {termData.some(t => t.amount > 0) && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-[#64748B]">Total Collected ({selectedYear})</p>
            <p className="text-xl font-black text-[#0F172A]">
              {formatKES(totalCollected)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#64748B]">Highest Collection</p>
            <p className="text-xl font-black text-emerald-600">
              {highestTerm?.term.split(' ')[0]} {highestTerm?.term.split(' ')[1]}
            </p>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeePaymentsTrendChart;
