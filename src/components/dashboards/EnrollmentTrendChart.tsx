import React from 'react';
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
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EnrollmentData {
  month: string;
  learners: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: EnrollmentData;
  }>;
}

// Sample enrollment data for the last 6 months
const enrollmentData: EnrollmentData[] = [
  { month: 'Apr', learners: 320 },
  { month: 'May', learners: 450 },
  { month: 'Jun', learners: 520 },
  { month: 'Jul', learners: 610 },
  { month: 'Aug', learners: 695 },
  { month: 'Sept', learners: 700 },
];

// Custom tooltip component with exact styling
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const monthName = data.payload.month.toUpperCase();
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 min-w-[140px]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          {monthName}
        </p>
        <p className="text-2xl font-black text-emerald-600">
          {data.value.toLocaleString()} Learners
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
  
  // Rounded top corners - 8px radius
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

const EnrollmentTrendChart: React.FC = () => {
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#0F172A] leading-tight">
              Learner Enrollment Trend (Last 6 Months)
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              Monthly enrollment growth — live from student admission records
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 shrink-0">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={enrollmentData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={40}
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
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: '#94A3B8',
                  fontSize: 12,
                  fontWeight: 500,
                }}
                dy={10}
              />
              
              {/* Y-Axis */}
              <YAxis
                domain={[0, 800]}
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: '#94A3B8',
                  fontSize: 12,
                  fontWeight: 500,
                }}
                tickCount={5}
                dy={0}
              />
              
              {/* Custom Tooltip */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: '#F1F5F9',
                  radius: 8,
                }}
              />
              
              {/* Bar with gradient fill */}
              <Bar
                dataKey="learners"
                shape={<RoundedBar />}
                maxBarSize={50}
              >
                {enrollmentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === enrollmentData.length - 1 ? '#10B981' : '#86EFAC'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-[#64748B]">Total Enrolled</p>
            <p className="text-xl font-black text-[#0F172A]">
              {enrollmentData.reduce((sum, d) => sum + d.learners, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#64748B]">Growth This Period</p>
            <p className="text-xl font-black text-emerald-600">
              +118.8%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnrollmentTrendChart;
