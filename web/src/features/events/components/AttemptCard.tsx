import { timeAgo } from "../../../lib/time"
import type { DeliveryAttempt } from "../../../types"


// AttemptCard renders one delivery attempt; NO RESPONSE means the request
// never got an HTTP answer (timeout / connection refused).
export function AttemptCard({ attempt }: { attempt: DeliveryAttempt }) {
  const noResponse = attempt.response_status === null
  const ok = !noResponse && attempt.response_status! >= 200 && attempt.response_status! < 300

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-semibold text-ink">
          Attempt #{attempt.attempt_number}
        </span>
        <span
          className={`font-mono text-[13px] font-medium ${
            noResponse || !ok ? "text-failed" : "text-delivered"
          }`}
        >
          {noResponse ? "NO RESPONSE" : attempt.response_status}
        </span>
        <span className="ml-auto font-mono text-[13px] text-ink-3">
          {attempt.execution_time_ms}ms
        </span>
        <span className="text-[14px] text-ink-3">{timeAgo(attempt.attempted_at)}</span>
      </div>

      {attempt.error_message && (
        <p className="mt-2.5 font-mono text-[13px] text-failed">{attempt.error_message}</p>
      )}

      {attempt.response_body && (
        <pre className="mt-2.5 max-h-48 overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-[13px] whitespace-pre-wrap text-ink-2">
          {attempt.response_body}
        </pre>
      )}
    </div>
  )
}
