import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"


// useEventStream subscribes to the backend's SSE nudges and refetches
// "events" queries on every frame. EventSource reconnects automatically.
export function useEventStream() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const es = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/v1/events/stream`,
    )

    es.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    }

    es.onopen = () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    }

    return () => es.close()
  }, [queryClient])
}
