import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height, ...props }: SkeletonProps) {
  const baseStyles = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";
  
  const variantStyles = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
      {...props}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="border-none shadow-sm bg-white rounded-3xl p-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} className="bg-slate-100" />
        <div className="space-y-2">
          <Skeleton variant="text" width="60%" height={12} />
          <Skeleton variant="text" width="40%" height={28} />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="border-none shadow-sm rounded-3xl bg-white p-6 h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width="30%" height={20} />
        <Skeleton variant="text" width="20%" height={20} />
      </div>
      <div className="h-[260px] space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} className="rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="text-slate-500 border-b bg-slate-50/50">
            <tr>
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">
                  <Skeleton variant="text" width="80%" height={10} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50">
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-8 py-5">
                    <Skeleton variant="text" width={colIndex === 0 ? "60%" : "40%"} height={16} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AlertItemSkeleton() {
  return (
    <div className="flex gap-4 relative">
      <Skeleton variant="circular" width={8} height={8} className="mt-1.5 shrink-0" />
      <div className="flex-1 space-y-1">
        <Skeleton variant="text" width="80%" height={14} />
        <Skeleton variant="text" width="40%" height={10} />
      </div>
    </div>
  );
}