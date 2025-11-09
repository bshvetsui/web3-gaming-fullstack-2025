import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  className?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  className = '',
  color = 'text-white',
}) => {
  return (
    <div
      className={[
        'flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {change && <p className="text-xs text-emerald-400">{change}</p>}
      </div>
      {icon && (
        <div className="rounded-full bg-white/10 p-3 text-white">
          {icon}
        </div>
      )}
    </div>
  );
};
