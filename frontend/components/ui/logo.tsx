interface BriefcaseLogoProps {
  className?: string;
}

export function BriefcaseLogo({ className }: BriefcaseLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Handle */}
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      {/* Body */}
      <rect x="2" y="7" width="20" height="14" rx="2" />
      {/* Lightning bolt: represents the breach cutting through */}
      <path d="M13.5 9.5L10.5 14H13L10 18.5" />
    </svg>
  );
}
