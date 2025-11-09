import React from 'react';

type BadgeVariant = 'default' | 'secondary';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-indigo-500/20 text-indigo-200',
  secondary: 'bg-white/10 text-white',
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  children,
  ...rest
}) => {
  const classes = [
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
    'border border-white/10',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};
