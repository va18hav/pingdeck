import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { fetchEventWithAttempts, fetchEvents, replayEndpointEvents, replayEvent } from "./api"
import type { Cursor, EventStatus } from "../../types"

export interface EventsFilter {
  
  endpointId?: string
  
  status?: EventStatus
}

// PAGE_SIZE must match the backend's default limit (50).
const PAGE_SIZE = 50

// useEvents is the paginated events list: infinite query over the
// (created_at, id) keyset cursor, "Load more" fetches the next page.
export function useEvents(filter: EventsFilter = {}) {
  const query = useInfiniteQuery({
    queryKey: ["events", filter.endpointId ?? "all", filter.status ?? "all"],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()
      if (filter.endpointId) params.set("endpoint_id", filter.endpointId)
      if (filter.status) params.set("status", filter.status)
      params.set("limit", String(PAGE_SIZE))
      const cursor = pageParam as Cursor | undefined
      if (cursor) {
        params.set("before", cursor.before)
        params.set("before_id", cursor.beforeId)
      }
      return fetchEvents(params)
    },
    initialPageParam: undefined as Cursor | undefined,
    getNextPageParam: (lastPage): Cursor | undefined => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined
      }
      const last = lastPage[lastPage.length - 1]
      return { before: last.CreatedAt, beforeId: last.ID }
    },
  })

  const rows = query.data ? query.data.pages.flat() : undefined
  return { ...query, rows }
}


export function useEvent(id: string | null) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => fetchEventWithAttempts(id!),
    enabled: id !== null,
  })
}
