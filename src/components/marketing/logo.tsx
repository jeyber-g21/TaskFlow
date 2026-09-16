export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M4 7h6M4 12h10M4 17h5" />
        <path d="M15 17.5 17.5 20l4.5-5" />
      </svg>
    </span>
  );
}
