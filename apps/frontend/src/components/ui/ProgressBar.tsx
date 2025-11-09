import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(value, max));
  const percentage = (clamped / max) * 100;

  return (
    <div
      className={[
        'w-full overflow-hidden rounded-full bg-white/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
