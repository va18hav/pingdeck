
// TopBar: the PingDeck mark (stacked "deck" layers + ping node) and wordmark.
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-6">
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="size-6 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M4 18.5L14 23.5L24 18.5"
          stroke="#18181B"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 13.75L14 18.75L24 13.75"
          stroke="#18181B"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 4L4 9L14 14L24 9L14 4Z"
          fill="#18181B"
          stroke="#18181B"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="5.5" r="3" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="1.2" />
      </svg>
      <span className="text-[18px] font-bold tracking-[-0.02em] text-ink">
        PingDeck
      </span>
    </header>
  )
}
