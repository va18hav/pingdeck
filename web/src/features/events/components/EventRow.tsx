import { statusDot } from "../../../components/StatusBadge"
import { timeAgo } from "../../../lib/time"
import type { WebhookEvent } from "../../../types"
import { EventAttempts } from "./EventAttempts"

interface EventRowProps {
  ev: WebhookEvent
  expanded: boolean
  onToggle: () => void
}


export function EventRow({ ev, expanded, onToggle }: EventRowProps) {
  return (
    <li
      className={`border-b border-line ${expanded ? "border-l-[3px] border-l-[#4f46e5]" : ""}`}
    >
      <button
        onClick={onToggle}
        className={`flex h-12 w-full cursor-pointer items-center gap-4 px-8 text-left transition-colors hover:bg-hover focus:outline-none ${
          expanded ? "bg-bg/70" : ""
        }`}
      >
        <span className={`size-2.5 shrink-0 rounded-full ${statusDot(ev.Status)}`} />
        <span className="font-mono text-[13px] text-ink-2">{ev.ID.slice(0, 8)}</span>
        <span className="ml-auto text-[14px] text-ink-2">
          {ev.AttemptCount} {ev.AttemptCount === 1 ? "attempt" : "attempts"}
        </span>
        <span className="w-20 text-right text-[14px] text-ink-3">
          {timeAgo(ev.CreatedAt)}
        </span>
      </button>
      {expanded && <EventAttempts eventId={ev.ID} />}
    </li>
  )
}
