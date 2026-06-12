import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useEndpoints } from "../hooks"
import { CreateEndpointModal } from "./CreateEndpointModal"

interface EndpointsPaneProps {
  selectedId: string | null
  onSelect: (id: string) => void
}


export function EndpointsPane({ selectedId, onSelect }: EndpointsPaneProps) {
  const { data: endpoints, isLoading, error } = useEndpoints()
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  return (
    <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-r border-line bg-bg/50">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
        <button
          onClick={() => navigate("/")}
          title="PingDeck home"
          className="flex cursor-pointer items-center gap-2.5 focus:outline-none"
        >
          <svg
            viewBox="0 0 28 28"
            fill="none"
            className="size-6"
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
        </button>
        <button
          onClick={() => setShowCreate(true)}
          title="New endpoint"
          aria-label="New endpoint"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg bg-accent text-on-accent transition-colors hover:bg-accent-hover focus:outline-none"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </button>
      </div>

      {isLoading && <p className="p-5 text-[15px] text-ink-2">Loading endpoints…</p>}
      {error && <p className="p-5 text-[15px] text-failed">{error.message}</p>}

      {endpoints && (
        <ul>
          {endpoints.map((ep) => {
            const selected = ep.ID === selectedId
            return (
              <li
                key={ep.ID}
                onClick={() => onSelect(ep.ID)}
                className={`flex cursor-pointer flex-col justify-center gap-1 border-b border-line px-5 py-4 transition-colors ${
                  selected
                    ? "border-l-[3px] border-l-accent bg-surface"
                    : "hover:bg-surface/60"
                }`}
              >
                <span className="text-[15px] font-semibold text-ink">{ep.Name}</span>
                <span className="truncate font-mono text-[13px] text-ink-3">
                  {ep.TargetURL}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {showCreate && <CreateEndpointModal onClose={() => setShowCreate(false)} />}
    </aside>
  )
}
