import { useId } from 'react';

// Copper brand colours, sampled from the PrimeTickets logo artwork
const COPPER_STOPS = ['#7c4027', '#b86e48', '#eab595', '#c7825c', '#8a4a2b'];

// Three slanted copper bars — the PrimeTickets mark
export function LogoMark({ className = 'w-9 h-9' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="PrimeTickets">
      <defs>
        <linearGradient id={`copper-${id}`} x1="0" y1="0" x2="1" y2="1">
          {COPPER_STOPS.map((c, i) => (
            <stop key={c} offset={i / (COPPER_STOPS.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      {[12, 24, 36].map((cy) => (
        <rect
          key={cy}
          x="6" y={cy - 4.25} width="36" height="8.5" rx="4.25"
          transform={`rotate(14 24 ${cy})`}
          fill={`url(#copper-${id})`}
        />
      ))}
    </svg>
  );
}

const SIZES = {
  sm: { mark: 'w-8 h-8',   prime: 'text-lg',  gap: 'gap-2'   },
  md: { mark: 'w-9 h-9',   prime: 'text-xl',  gap: 'gap-2.5' },
  lg: { mark: 'w-11 h-11', prime: 'text-2xl', gap: 'gap-3'   },
};

/**
 * Mark + "PRIME TICKETS" wordmark.
 * onDark: true when placed on a dark background (lighter copper text).
 * subtitle: optional line under the wordmark, e.g. "Admin Panel".
 */
export default function Logo({ size = 'md', onDark = false, subtitle }) {
  const s = SIZES[size];
  const text = onDark ? 'text-[#e2a47f]' : 'text-[#9a5332]';
  return (
    <span className={`flex items-center ${s.gap}`}>
      <LogoMark className={`${s.mark} shrink-0`} />
      <span className="flex flex-col leading-none">
        <span className={`${s.prime} font-black tracking-wide ${text}`}>PRIME</span>
        <span className={`text-[0.6rem] font-medium tracking-[0.42em] mt-0.5 ${text}`}>TICKETS</span>
        {subtitle && <span className="text-xs text-gray-400 mt-1 tracking-normal">{subtitle}</span>}
      </span>
    </span>
  );
}
