import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-black hover:bg-brand-hover shadow-md',
  secondary: 'border-2 border-ink-600 text-gray-100 hover:bg-ink-700 active:bg-ink-600',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-gray-300 hover:bg-ink-700',
};

// Clases del botón, también para <Link> (un <button> dentro de <a> no es HTML válido)
export function buttonClass(variant: Variant = 'primary', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl font-semibold transition',
    'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
    VARIANTS[variant],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClass(variant, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
