import { useReplay, useEvent } from "../hooks"
import { payloadText } from "../../../lib/decode"
import { AttemptCard } from "./AttemptCard"
import { StatusBadge } from "../../../components/StatusBadge"


// Only FAILED events can be replayed (the Go handler enforces it too).
const replayable = (status: string) => status === "FAILED"


export function EventAttempts({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useEvent(eventId)
  const replay = useReplay(eventId)

  if (isLoading) return <p className="px-8 py-4 text-[14px] text-ink-2">Loading attempts…</p>
  if (error || !data) {
    return <p className="px-8 py-4 text-[14px] text-failed">{error?.message ?? "Not found"}</p>
  }

  const ev = data.event
  return (
    <div className="bg-bg/70 px-8 pb-5 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={ev.Status} />
        <span className="ml-auto text-[14px] text-ink-3">
          {ev.AttemptCount} total {ev.AttemptCount === 1 ? "attempt" : "attempts"}
        </span>
        <button
          onClick={() => replay.mutate()}
          disabled={!replayable(ev.Status) || replay.isPending}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#4f46e5] px-3.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-[#4338ca] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
              clipRule="evenodd"
            />
          </svg>
          {replay.isPending ? "Replaying…" : "Replay"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink">Payload</p>
          {(() => {
            const text = payloadText(ev.RawBody, ev.ContentType)
            if (text === null) {
              return <p className="text-[14px] text-ink-3">(undecodable payload)</p>
            }
            if (text === "") {
              return <p className="text-[14px] text-ink-3">Empty payload</p>
            }
            return (
              <pre className="max-h-72 overflow-auto rounded-lg border border-line bg-surface p-3.5 font-mono text-[13px] whitespace-pre-wrap text-ink">
                {text}
              </pre>
            )
          })()}
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink">Delivery attempts</p>
          {data.attempts.length === 0 ? (
            <p className="text-[14px] text-ink-3">
              No attempts yet — waiting for the worker.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.attempts.map((a) => (
                <AttemptCard key={a.id} attempt={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
