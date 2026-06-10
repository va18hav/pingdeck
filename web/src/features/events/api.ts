import api from "../../api"
import type { EventWithAttempts, WebhookEvent } from "../../types"



export async function fetchEvents(params: URLSearchParams): Promise<WebhookEvent[]> {
  const qs = params.size > 0 ? `?${params.toString()}` : ""
  const res = await api.get<WebhookEvent[]>(`/events${qs}`)
  return res.data
}


export async function fetchEventWithAttempts(
  id: string,
): Promise<EventWithAttempts> {
  const res = await api.get<EventWithAttempts>(`/events/${id}`)
  return res.data
}


export async function replayEvent(
  id: string,
): Promise<Pick<WebhookEvent, "ID" | "Status" | "AttemptCount" | "NextRetryAt">> {
  const res = await api.post(`/events/${id}/replay`)
  return res.data
}


export async function replayEndpointEvents(
  endpointId: string,
): Promise<{ replayed: number }> {
  const res = await api.post(`/endpoints/${endpointId}/replay`)
  return res.data
}
