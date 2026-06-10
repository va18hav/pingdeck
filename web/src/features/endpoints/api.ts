import api from "../../api"
import type { CreateEndpointInput, CreateEndpointResponse, Endpoint, RotateSecretResponse, UpdateEndpointInput } from "../../types"



export async function fetchEndpoints(): Promise<Endpoint[]> {
  const res = await api.get<Endpoint[]>("/endpoints")
  return res.data
}


export async function fetchEndpoint(id: string): Promise<Endpoint> {
  const res = await api.get<Endpoint>(`/endpoints/${id}`)
  return res.data
}


export async function createEndpoint(input: CreateEndpointInput): Promise<CreateEndpointResponse> {
  const res = await api.post<CreateEndpointResponse>("/endpoints", input)
  return res.data
}


export async function updateEndpoint(id: string, input: UpdateEndpointInput): Promise<Endpoint> {
  const res = await api.put<Endpoint>(`/endpoints/${id}`, input)
  return res.data
}


export async function deleteEndpoint(id: string): Promise<void> {
  await api.delete(`/endpoints/${id}`)
}


// regenerateSigningSecret hits POST /endpoints/{id}/rotate-secret — the raw
// new secret comes back exactly once.
export async function regenerateSigningSecret(id: string): Promise<RotateSecretResponse> {
  const res = await api.post<RotateSecretResponse>(`/endpoints/${id}/rotate-secret`)
  return res.data
}
