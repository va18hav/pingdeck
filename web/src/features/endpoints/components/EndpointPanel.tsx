import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useEvents, useReplayEndpoint } from "../../events/hooks"
import { EventRow } from "../../events/components/EventRow"
import type { EventStatus } from "../../../types"
import { useDeleteEndpoint, useEndpoint } from "../hooks"
import { EditEndpointModal } from "./EditEndpointModal"

const STATUS_TABS: Array<{ label: string; value?: EventStatus }> = [
  { label: "All" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Retrying", value: "RETRYING" },
  { label: "Failed", value: "FAILED" },
]

interface EndpointPanelProps {
  id: string
}


// ProviderLogo: only Stripe/GitHub have official marks; everything else
// (incl. custom) gets a generic key icon.
function ProviderLogo({ provider }: { provider: string }) {
  const cls = "size-8 shrink-0"
  switch (provider) {
    case "stripe":
      return (
        <svg viewBox="0 0 24 24" className={`${cls} text-[#635BFF]`} fill="currentColor" aria-hidden="true">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
        </svg>
      )
    case "github":
      return (
        <svg viewBox="0 0 24 24" className={`${cls} text-[#181717]`} fill="currentColor" aria-hidden="true">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 20 20" className={`${cls} text-[#0d9488]`} fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M8 7a5 5 0 1 1 3.61 4.804l-1.903 1.903A1 1 0 0 1 9 14H8v1a1 1 0 0 1-1 1H6v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 .293-.707L8.196 9.39A5.002 5.002 0 0 1 8 7Zm5-3a.75.75 0 0 0 0 1.5A1.5 1.5 0 0 1 14.5 7 .75.75 0 0 0 16 7a3 3 0 0 0-3-3Z"
            clipRule="evenodd"
          />
        </svg>
      )
  }
}


export function EndpointPanel({ id }: EndpointPanelProps) {
  const navigate = useNavigate()
  const close = () => navigate("/")

  const { data: ep, isLoading, error } = useEndpoint(id)
  const deleteEndpoint = useDeleteEndpoint()
  const replayEndpoint = useReplayEndpoint(id)
  const [status, setStatus] = useState<EventStatus | undefined>(undefined)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReplay, setConfirmReplay] = useState(false)
  const {
    rows: events,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useEvents({ endpointId: id, status })

  return (
    <aside className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-surface">
      <div className="px-8 pt-7 pb-5">
        <div className="flex items-center gap-4">
          {ep && <ProviderLogo provider={ep.Provider} />}
          <div className="min-w-0">
            <h2 className="truncate text-[24px] font-bold tracking-[-0.02em] text-ink">
              {ep?.Name ?? "…"}
            </h2>
            {ep && (
              <p className="truncate font-mono text-[13px] text-ink-3">
                {ep.TargetURL}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={() => setConfirmReplay(true)}
              disabled={!ep}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#4f46e5] px-4 text-[14px] font-medium text-white shadow-xs transition-colors hover:bg-[#4338ca] focus:outline-none disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                  clipRule="evenodd"
                />
              </svg>
              Replay failed
            </button>
            <button
              onClick={() => setShowEdit(true)}
              disabled={!ep}
              title="Endpoint settings"
              aria-label="Endpoint settings"
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-bg/70 text-ink-2 transition-colors hover:bg-hover hover:text-ink focus:outline-none disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4.5">
                <path
                  fillRule="evenodd"
                  d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={!ep}
              title="Delete endpoint"
              aria-label="Delete endpoint"
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-failed/25 bg-failed-bg text-failed transition-colors hover:bg-failed/15 focus:outline-none disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4.5">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-line px-8">
        {STATUS_TABS.map((tab) => {
          const active = tab.value === status
          return (
            <button
              key={tab.label}
              onClick={() => setStatus(tab.value)}
              className={`-mb-px h-12 cursor-pointer border-b-2 text-[15px] font-medium transition-colors focus:outline-none ${
                active
                  ? "border-[#4f46e5] text-ink"
                  : "border-transparent text-ink-2 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {isLoading && <p className="p-8 text-[15px] text-ink-2">Loading endpoint…</p>}
      {error && <p className="p-8 text-[15px] text-failed">{error.message}</p>}
      {events !== undefined && events.length === 0 && (
        <p className="p-8 text-[15px] text-ink-3">
          No events matching this view — send a request to this endpoint's ingest URL.
        </p>
      )}
      {events && (
        <ul>
          {events.map((ev) => (
            <EventRow
              key={ev.ID}
              ev={ev}
              expanded={ev.ID === expandedId}
              onToggle={() => setExpandedId(expandedId === ev.ID ? null : ev.ID)}
            />
          ))}
        </ul>
      )}
      {hasNextPage && (
        <div className="px-8 py-5">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="h-10 w-full cursor-pointer rounded-lg border border-line-strong bg-surface text-[14px] font-medium text-ink-2 hover:bg-hover focus:outline-none disabled:opacity-40"
          >
            {isFetchingNextPage ? "Loading…" : "Load more events"}
          </button>
        </div>
      )}

      {showEdit && ep && <EditEndpointModal endpoint={ep} onClose={() => setShowEdit(false)} />}

      {confirmDelete && ep && (
        <div
          onClick={() => setConfirmDelete(false)}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[440px] rounded-xl border border-line bg-surface shadow-xl"
          >
            <div className="px-6 pt-6 pb-5">
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
                Delete “{ep.Name}”?
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">
                This permanently deletes the endpoint and all of its recorded events.
                Providers still posting to its ingest URL will receive <code className="font-mono text-[14px]">404</code> responses.
              </p>
              {deleteEndpoint.isError && (
                <p className="mt-3 text-[14px] text-failed">{deleteEndpoint.error.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 rounded-b-xl border-t border-line bg-bg/60 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-10 cursor-pointer rounded-lg border border-line-strong bg-surface px-4 text-[14px] font-medium text-ink-2 hover:bg-hover focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteEndpoint.isPending}
                onClick={() =>
                  deleteEndpoint.mutate(ep.ID, { onSuccess: close })
                }
                className="h-10 cursor-pointer rounded-lg bg-failed px-4 text-[14px] font-medium text-on-accent hover:opacity-90 focus:outline-none disabled:opacity-40"
              >
                {deleteEndpoint.isPending ? "Deleting…" : "Delete endpoint"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReplay && ep && (
        <div
          onClick={() => setConfirmReplay(false)}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[440px] rounded-xl border border-line bg-surface shadow-xl"
          >
            <div className="px-6 pt-6 pb-5">
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
                Replay failed events?
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">
                Every failed event on this endpoint will reset to <code className="font-mono text-[14px]">PENDING</code> and
                deliver again to <span className="font-mono text-[14px] text-ink">{ep.TargetURL}</span>.
              </p>
              {replayEndpoint.isError && (
                <p className="mt-3 text-[14px] text-failed">{replayEndpoint.error.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 rounded-b-xl border-t border-line bg-bg/60 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmReplay(false)}
                className="h-10 cursor-pointer rounded-lg border border-line-strong bg-surface px-4 text-[14px] font-medium text-ink-2 hover:bg-hover focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={replayEndpoint.isPending}
                onClick={() =>
                  replayEndpoint.mutate(undefined, {
                    onSuccess: () => setConfirmReplay(false),
                  })
                }
                className="h-10 cursor-pointer rounded-lg bg-[#4f46e5] px-4 text-[14px] font-medium text-white hover:bg-[#4338ca] focus:outline-none disabled:opacity-40"
              >
                {replayEndpoint.isPending ? "Replaying…" : "Replay failed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
