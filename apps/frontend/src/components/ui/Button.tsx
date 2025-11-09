import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-500 hover:bg-indigo-600 text-white border-transparent',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-white border-transparent',
  outline: 'bg-transparent border border-indigo-400 text-indigo-200 hover:bg-indigo-500/10',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button: React.FC<ButtonProps> = ({
  className = '',
  variant = 'primary',
  children,
  ...rest
}) => {
  const classes = [
    'inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors duration-150',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};
