import { AVATAR_COLORS } from '@/lib/forms';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-24 h-24 text-3xl',
};

// Color estable a partir del nombre cuando la jugadora no ha elegido uno
function defaultColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(firstname: string, lastname?: string | null) {
  return `${firstname.charAt(0)}${lastname?.charAt(0) ?? ''}`.toUpperCase();
}

type AvatarProps = {
  firstname: string;
  lastname?: string | null;
  color?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
};

export function Avatar({ firstname, lastname, color, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color || defaultColor(`${firstname} ${lastname ?? ''}`) }}
      aria-hidden="true"
    >
      {initials(firstname, lastname)}
    </span>
  );
}
