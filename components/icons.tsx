import type { CategoryKey } from "@/lib/categories";

type P = { className?: string; strokeWidth?: number };
const base = (p: P) => ({
  className: p.className ?? "h-6 w-6",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: p.strokeWidth ?? 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function CategoryIcon({ k, ...p }: P & { k: CategoryKey }) {
  switch (k) {
    case "coffee":
      return (
        <svg {...base(p)}>
          <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
          <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M8 3.5c0 1 .8 1.3.8 2.3M11.5 3.5c0 1 .8 1.3.8 2.3" />
        </svg>
      );
    case "food":
      return (
        <svg {...base(p)}>
          <path d="M4 11a8 6 0 0 1 16 0H4Z" />
          <path d="M3.5 14.5h17" />
          <path d="M5 18h14a1 1 0 0 0 1-1v-.5H4v.5a1 1 0 0 0 1 1Z" />
          <path d="M9 8h.01M12 7h.01M15 8h.01" />
        </svg>
      );
    case "shopping":
      return (
        <svg {...base(p)}>
          <path d="M5 8h14l-1 12H6L5 8Z" />
          <path d="M9 10V7a3 3 0 0 1 6 0v3" />
        </svg>
      );
    case "entertainment":
      return (
        <svg {...base(p)}>
          <path d="M7 8h10a4 4 0 0 1 3.9 4.9l-.8 3.4a2.2 2.2 0 0 1-3.9.8L14.5 15h-5l-1.7 2.1a2.2 2.2 0 0 1-3.9-.8l-.8-3.4A4 4 0 0 1 7 8Z" />
          <path d="M8 11v3M6.5 12.5h3" />
          <path d="M15.5 12h.01M17.5 13.5h.01" />
        </svg>
      );
    case "gifts":
      return (
        <svg {...base(p)}>
          <rect x="4" y="9" width="16" height="4" rx="1" />
          <path d="M5.5 13v6a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-6" />
          <path d="M12 9v11" />
          <path d="M12 9S10.5 4.5 8 5.2C6.5 5.7 7 8 8.5 9M12 9s1.5-4.5 4-3.8C17.5 5.7 17 8 15.5 9" />
        </svg>
      );
    case "outings":
      return (
        <svg {...base(p)}>
          <path d="M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4" />
          <path d="M4 16h16v1.5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1V17h-9v.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V16Z" />
          <path d="M5 12h14" />
          <path d="M7.5 14h.01M16.5 14h.01" />
        </svg>
      );
    default:
      return (
        <svg {...base(p)}>
          <path d="M12 3.5 13.6 9l5.4 1.5-5.4 1.6L12 17.5l-1.6-5.4L5 10.5 10.4 9 12 3.5Z" />
          <path d="M18.5 16.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z" />
        </svg>
      );
  }
}

export const CheckIcon = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}>
    <path d="M5 12.5 10 17 19 7.5" />
  </svg>
);
// flips in rtl
export const ArrowIcon = (p: P) => (
  <svg {...base(p)} className={`${p.className ?? "h-5 w-5"} rtl:-scale-x-100`}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const BackIcon = (p: P) => (
  <svg {...base(p)} className={`${p.className ?? "h-5 w-5"} rtl:-scale-x-100`}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const RefreshIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 11a8 8 0 0 0-14.7-4.3L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.7 4.3L20 15.5M20 20v-4.5h-4.5" />
  </svg>
);
export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />
  </svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);
export const LogoutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
  </svg>
);
export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
  </svg>
);
export const LockIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);
