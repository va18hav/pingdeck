import type { EventStatus } from "../types"

// Per-status color tokens (dot, text, background) from index.css.
const styles: Record<EventStatus, { dot: string; text: string; bg: string }> = {
  DELIVERED: { dot: "bg-delivered-dot", text: "text-delivered", bg: "bg-delivered-bg" },
  RETRYING: { dot: "bg-retrying-dot", text: "text-retrying", bg: "bg-retrying-bg" },
  PENDING: { dot: "bg-pending-dot", text: "text-pending", bg: "bg-pending-bg" },
  PROCESSING: { dot: "bg-processing-dot", text: "text-processing", bg: "bg-processing-bg" },
  FAILED: { dot: "bg-failed-dot", text: "text-failed", bg: "bg-failed-bg" },
}


// statusDot returns just the colored dot class, for rows that show status without the badge.
export function statusDot(status: EventStatus): string {
  return styles[status].dot
}


export function StatusBadge({ status }: { status: EventStatus }) {
  const s = styles[status]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-[13px] font-medium ${s.bg} ${s.text}`}
    >
      <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}
